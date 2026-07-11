import type { OperationRisk } from "./policy.js";
import { validateArtifactIntegrity, type PlanArtifact } from "./planArtifact.js";

export interface LocalFileOperation {
  id: string;
  path: string;
  content: string;
  risk: OperationRisk;
  requiresConfirmation: boolean;
}

export interface LocalApplyRequest {
  planId: string;
  repositoryRoot: string;
  baseSha: string;
  baseBranch: string;
  branchName: string;
  operations: readonly LocalFileOperation[];
  confirmations: readonly string[];
  completedOperationIds?: readonly string[];
}

export interface LocalEffectExecutor {
  createBranch(branch: string, base: string): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
  commit(planId: string): Promise<string>;
  push(branch: string): Promise<void>;
}

export interface OperationLifecycleEvidence {
  id: string;
  status: "executed" | "failed" | "skipped";
  error?: string;
}

export interface LocalApplyEvidence {
  planId: string;
  repositoryRoot: string;
  baseSha: string;
  branchName: string;
  status: "completed" | "partial-failure";
  operations: OperationLifecycleEvidence[];
  recovery: { action: string; command?: string };
}

export async function executeLocalPlan(request: LocalApplyRequest, executor: LocalEffectExecutor): Promise<LocalApplyEvidence> {
  validateRequest(request);
  const evidence: OperationLifecycleEvidence[] = [];
  const completed = new Set(request.completedOperationIds ?? []);

  try {
    await executor.createBranch(request.branchName, request.baseBranch);
    for (const operation of request.operations) {
      if (completed.has(operation.id)) {
        evidence.push({ id: operation.id, status: "skipped" });
        continue;
      }
      try {
        await executor.writeFile(operation.path, operation.content);
        evidence.push({ id: operation.id, status: "executed" });
      } catch (error) {
        evidence.push({ id: operation.id, status: "failed", error: errorMessage(error) });
        return failed(request, evidence);
      }
    }
    if (evidence.every((operation) => operation.status === "skipped")) {
      return {
        planId: request.planId,
        repositoryRoot: request.repositoryRoot,
        baseSha: request.baseSha,
        branchName: request.branchName,
        status: "completed",
        operations: evidence,
        recovery: { action: "No effects remained to retry; verify the existing branch evidence." }
      };
    }
    await executor.commit(request.planId);
    await executor.push(request.branchName);
    return {
      planId: request.planId,
      repositoryRoot: request.repositoryRoot,
      baseSha: request.baseSha,
      branchName: request.branchName,
      status: "completed",
      operations: evidence,
      recovery: { action: "Verify the pushed branch before creating a pull request." }
    };
  } catch (error) {
    evidence.push({ id: "executor", status: "failed", error: errorMessage(error) });
    return failed(request, evidence);
  }
}

export async function executeArtifactLocalPlan(artifact: PlanArtifact, branchName: string, confirmations: readonly string[], executor: LocalEffectExecutor): Promise<LocalApplyEvidence> {
  validateArtifactIntegrity(artifact);
  const operations = artifact.effects.map((effect) => {
    const operation = artifact.operations.find((candidate) => candidate.id === effect.operationId);
    if (!operation) throw new Error(`Effect ${effect.operationId} is not part of the saved plan.`);
    return { id: effect.operationId, path: effect.path, content: effect.content, risk: operation.risk, requiresConfirmation: effect.requiresConfirmation };
  });
  if (operations.length === 0) throw new Error("Saved plan contains no executable local effect payloads.");
  return executeLocalPlan({
    planId: artifact.id,
    repositoryRoot: artifact.repository.root,
    baseSha: artifact.baseSha,
    baseBranch: artifact.repository.defaultBranch,
    branchName,
    operations,
    confirmations
  }, executor);
}

function validateRequest(request: LocalApplyRequest): void {
  if (request.branchName === request.baseBranch) throw new Error("Local apply refuses to mutate the default branch directly.");
  const ids = new Set(request.operations.map((operation) => operation.id));
  for (const confirmation of request.confirmations) {
    if (!ids.has(confirmation)) throw new Error(`Confirmation '${confirmation}' is not part of the plan.`);
  }
  for (const operation of request.operations) {
    if (operation.risk === "refused") throw new Error(`Operation ${operation.id} is refused by policy.`);
    if (operation.requiresConfirmation && !request.confirmations.includes(operation.id)) {
      throw new Error(`Operation ${operation.id} requires explicit confirmation.`);
    }
  }
}

function failed(request: LocalApplyRequest, operations: OperationLifecycleEvidence[]): LocalApplyEvidence {
  return {
    planId: request.planId,
    repositoryRoot: request.repositoryRoot,
    baseSha: request.baseSha,
    branchName: request.branchName,
    status: "partial-failure",
    operations,
    recovery: { action: "Retry the failed operation only after reviewing the recorded evidence." }
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown executor failure.";
}
