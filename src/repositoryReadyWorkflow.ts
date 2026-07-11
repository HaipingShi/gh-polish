import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve } from "node:path";
import { createArtifactPreview, type ArtifactPreview } from "./artifactPreview.js";
import type { LocalAnalysis } from "./localAnalyzer.js";
import { analyzeLocalRepository } from "./localAnalyzer.js";
import {
  createPlanArtifact,
  loadPlanArtifact,
  savePlanArtifact,
  validatePlanForRepository,
  type EffectPayload
} from "./planArtifact.js";
import type { PlanOperation, PolishPlan } from "./planner.js";
import type { RepositoryProfile } from "./repositoryProfile.js";
import type { RepositoryContext } from "./repositoryContext.js";
import { detectRepositoryContext } from "./repositoryContext.js";
import {
  executeArtifactRepositoryReadyPullRequest,
  type PullRequestAdapter,
  type RepositoryReadyExecutionEvidence,
  type RevisionCheckAdapter
} from "./repositoryReadyExecution.js";
import type { LocalEffectExecutor } from "./localApply.js";

export interface PrepareRepositoryReadyWorkflowInput {
  profile: RepositoryProfile;
  context: RepositoryContext;
  local: LocalAnalysis;
  existingPaths: Set<string>;
  projectName: string;
  planStore: string;
  now?: Date;
}

export interface PreparedRepositoryReadyWorkflow {
  preview: ArtifactPreview;
  artifactId: string;
  artifactPath: string;
  confirmations: string[];
}

export interface ExecuteSavedRepositoryReadyWorkflowInput {
  artifactReference: string;
  planStore: string;
  branchName: string;
  confirmations: readonly string[];
  pullRequest: { title: string; body: string };
  previousEvidence?: RepositoryReadyExecutionEvidence;
}

export async function prepareRepositoryReadyWorkflow(
  input: PrepareRepositoryReadyWorkflowInput
): Promise<PreparedRepositoryReadyWorkflow> {
  assertExternalPlanStore(input.context.root, input.planStore);
  const now = input.now ?? new Date();
  const preview = createArtifactPreview(input.profile, input.local, input.existingPaths, input.projectName);
  const executable = preview.items.filter((item) => item.action === "create");
  const operations: PlanOperation[] = executable.map((item) => ({
    id: item.id,
    title: `Create ${item.path}`,
    surface: "file",
    mutation: true,
    risk: "low",
    requiresConfirmation: true,
    allowedInMvp: true,
    verification: "Review the generated PR diff and exact-revision checks.",
    evidence: item.reason
  }));
  const effects: EffectPayload[] = executable.map((item) => {
    if (!item.content) throw new Error(`Create preview ${item.id} has no evidence-backed content.`);
    return {
      operationId: item.id,
      path: item.path,
      content: item.content,
      contentSha256: createHash("sha256").update(item.content).digest("hex"),
      requiresConfirmation: true
    };
  });
  const plan: PolishPlan = {
    id: `repository-ready-${input.profile}-${now.toISOString().replace(/[:.]/g, "-")}`,
    createdAt: now.toISOString(),
    summary: `${effects.length} confirmation-gated Repository Ready create effect(s).`,
    operations,
    warnings: preview.items
      .filter((item) => item.action !== "create")
      .map((item) => `${item.path}: ${item.action} - ${item.reason}`)
  };
  const artifact = await createPlanArtifact({
    context: input.context,
    local: input.local,
    plan,
    effects,
    now
  });
  const artifactPath = await savePlanArtifact(artifact, input.planStore);
  return {
    preview,
    artifactId: artifact.id,
    artifactPath,
    confirmations: effects.map((effect) => effect.operationId)
  };
}

export async function executeSavedRepositoryReadyWorkflow(
  input: ExecuteSavedRepositoryReadyWorkflowInput,
  executor: LocalEffectExecutor,
  pullRequests: PullRequestAdapter,
  revisionChecks: RevisionCheckAdapter
): Promise<RepositoryReadyExecutionEvidence> {
  const artifact = await loadPlanArtifact(input.artifactReference, input.planStore);
  assertExternalPlanStore(artifact.repository.root, input.planStore);
  if (isAbsolute(input.artifactReference) || input.artifactReference.includes("/") || input.artifactReference.includes("\\")) {
    assertExternalPlanStore(artifact.repository.root, input.artifactReference);
  }
  if (!input.previousEvidence) {
    const context = await detectRepositoryContext(artifact.repository.root);
    const local = await analyzeLocalRepository(artifact.repository.root);
    await validatePlanForRepository(artifact, context, local);
  }
  return executeArtifactRepositoryReadyPullRequest(artifact, {
    branchName: input.branchName,
    confirmations: input.confirmations,
    pullRequest: input.pullRequest,
    previousEvidence: input.previousEvidence
  }, executor, pullRequests, revisionChecks);
}

function assertExternalPlanStore(repositoryRoot: string, planStore: string): void {
  const relation = relative(resolve(repositoryRoot), resolve(planStore));
  if (relation === "" || (!relation.startsWith("..") && !isAbsolute(relation))) {
    throw new Error("Repository Ready plans must be stored outside the inspected repository.");
  }
}
