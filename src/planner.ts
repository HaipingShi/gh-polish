import type { LocalAnalysis } from "./localAnalyzer.js";
import type { RemoteAnalysis } from "./remoteAnalyzer.js";
import { classifyOperation, type OperationRisk, type OperationSurface } from "./policy.js";

export interface PlanOperation {
  id: string;
  title: string;
  surface: OperationSurface;
  mutation: boolean;
  risk: OperationRisk;
  requiresConfirmation: boolean;
  allowedInMvp: boolean;
  verification: string;
  evidence: string;
}

export interface PolishPlan {
  id: string;
  createdAt: string;
  summary: string;
  operations: PlanOperation[];
  warnings: string[];
}

export function createPolishPlan(local: LocalAnalysis, remote?: RemoteAnalysis, now: Date = new Date()): PolishPlan {
  const operations: PlanOperation[] = [];
  addMissingFileOperations(operations, local);
  if (remote?.repository.ok === true && typeof remote.repository.value === "object") {
    const metadata = remote.repository.value as { description?: string | null; homepage?: string | null };
    if (!metadata.description) operations.push(makeOperation("metadata-description", "Add repository description", "metadata", true, "Fetch repository metadata after apply."));
    if (!metadata.homepage) operations.push(makeOperation("metadata-homepage", "Consider repository homepage", "metadata", true, "Fetch repository metadata after apply."));
  }
  if (remote?.topics.ok === true && remote.topics.value.length === 0) {
    operations.push(makeOperation("topics", "Add repository topics", "topics", true, "Fetch repository topics after apply."));
  }

  return {
    id: `plan-${now.toISOString().replace(/[:.]/g, "-")}`,
    createdAt: now.toISOString(),
    summary: `${operations.length} proposed operation(s), ${operations.filter((operation) => operation.requiresConfirmation).length} confirmation-gated.`,
    operations: operations.sort((left, right) => left.id.localeCompare(right.id)),
    warnings: remote?.warnings ?? []
  };
}

export function serializePlan(plan: PolishPlan): string {
  return `${JSON.stringify(plan, null, 2)}\n`;
}

export function parsePlan(text: string): PolishPlan {
  const value = JSON.parse(text) as PolishPlan;
  if (!value.id || !Array.isArray(value.operations)) {
    throw new Error("Invalid plan.");
  }
  return value;
}

function addMissingFileOperations(operations: PlanOperation[], local: LocalAnalysis): void {
  const missing: Array<[boolean, string, string]> = [
    [local.files.readme, "readme", "Create README"],
    [local.files.license, "license", "Add license file"],
    [local.files.gitignore, "gitignore", "Add .gitignore"],
    [local.files.contributing, "contributing", "Add CONTRIBUTING.md"],
    [local.files.security, "security", "Add SECURITY.md"],
    [local.files.codeOfConduct, "code-of-conduct", "Add CODE_OF_CONDUCT.md"],
    [local.files.issueTemplates, "issue-templates", "Add issue templates"],
    [local.files.pullRequestTemplate, "pr-template", "Add pull request template"],
    [local.files.dependabot, "dependabot", "Add Dependabot config"],
    [local.files.workflows.length > 0, "ci", "Add basic CI workflow"],
    [local.files.codeql, "codeql", "Add CodeQL workflow"]
  ];

  for (const [exists, id, title] of missing) {
    if (!exists) operations.push(makeOperation(id, title, "file", true, "Review generated PR diff."));
  }
}

function makeOperation(id: string, title: string, surface: OperationSurface, mutation: boolean, verification: string): PlanOperation {
  const policy = classifyOperation({ surface, mutation });
  return {
    id,
    title,
    surface,
    mutation,
    risk: policy.risk,
    requiresConfirmation: policy.requiresConfirmation,
    allowedInMvp: policy.allowedInMvp,
    verification,
    evidence: policy.reason
  };
}
