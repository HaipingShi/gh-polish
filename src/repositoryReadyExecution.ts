import {
  executeLocalPlan,
  type LocalApplyEvidence,
  type LocalApplyRequest,
  type LocalEffectExecutor
} from "./localApply.js";
import type { RemoteVerificationEvidence, RemoteVerificationTarget } from "./remoteVerification.js";
import { validateArtifactIntegrity, type PlanArtifact } from "./planArtifact.js";

export interface PullRequestInput {
  repositoryRoot: string;
  planId: string;
  baseBranch: string;
  headBranch: string;
  headSha: string;
  title: string;
  body: string;
}

export interface PullRequestResult {
  id: string;
  url: string;
  created: boolean;
}

export interface PullRequestAdapter {
  ensurePullRequest(input: PullRequestInput): Promise<PullRequestResult>;
}

export interface RevisionCheckAdapter {
  verify(target: RemoteVerificationTarget): Promise<RemoteVerificationEvidence>;
}

export interface RepositoryReadyExecutionRequest extends Omit<LocalApplyRequest, "completedOperationIds"> {
  pullRequest: { title: string; body: string };
  previousEvidence?: RepositoryReadyExecutionEvidence;
}

export interface ArtifactRepositoryReadyExecutionOptions {
  branchName: string;
  confirmations: readonly string[];
  pullRequest: { title: string; body: string };
  previousEvidence?: RepositoryReadyExecutionEvidence;
}

export interface PullRequestEvidence {
  status: "created" | "existing" | "failed" | "not-attempted";
  headSha?: string;
  id?: string;
  url?: string;
  error?: string;
}

export interface RevisionCheckEvidence {
  status: RemoteVerificationEvidence["status"] | "adapter-failure" | "not-attempted";
  result?: RemoteVerificationEvidence;
  error?: string;
}

export interface MergeDecisionEvidence {
  status: "ready-for-review" | "not-ready" | "unknown";
  reason: string;
}

export interface RepositoryReadyExecutionEvidence {
  planId: string;
  repositoryRoot: string;
  baseSha: string;
  baseBranch: string;
  branchName: string;
  status: "completed" | "partial-failure";
  local: LocalApplyEvidence;
  pullRequest: PullRequestEvidence;
  checks: RevisionCheckEvidence;
  mergeDecision: MergeDecisionEvidence;
  recovery: { action: string; command?: string };
}

export async function executeRepositoryReadyPullRequest(
  request: RepositoryReadyExecutionRequest,
  executor: LocalEffectExecutor,
  pullRequests: PullRequestAdapter,
  revisionChecks: RevisionCheckAdapter
): Promise<RepositoryReadyExecutionEvidence> {
  validatePreviousEvidence(request);
  const completedOperationIds = request.previousEvidence?.local.operations
    .filter((operation) => operation.status === "executed" || operation.status === "skipped")
    .map((operation) => operation.id) ?? [];
  const local = await executeLocalPlan({
    planId: request.planId,
    repositoryRoot: request.repositoryRoot,
    baseSha: request.baseSha,
    baseBranch: request.baseBranch,
    branchName: request.branchName,
    operations: request.operations,
    confirmations: request.confirmations,
    completedOperationIds
  }, executor);

  if (local.status !== "completed") {
    return evidence(request, local, { status: "not-attempted" }, { status: "not-attempted" }, {
      status: "not-ready",
      reason: "Local effects did not complete, so no pull request or checks can establish readiness."
    }, {
      action: "Review the failed local effect, then retry with this evidence after correcting the cause."
    });
  }

  const headSha = local.commitSha ?? request.previousEvidence?.pullRequest.headSha;
  if (!headSha) {
    return evidence(request, local, { status: "failed", error: "No pushed head SHA is available." }, { status: "not-attempted" }, {
      status: "unknown",
      reason: "No pushed head SHA exists to bind check evidence."
    }, {
      action: "Re-run local apply to produce plan-bound pushed-branch evidence before retrying PR creation."
    });
  }

  try {
    const result = await pullRequests.ensurePullRequest({
      repositoryRoot: request.repositoryRoot,
      planId: request.planId,
      baseBranch: request.baseBranch,
      headBranch: request.branchName,
      headSha,
      title: request.pullRequest.title,
      body: request.pullRequest.body
    });
    const pullRequest: PullRequestEvidence = {
      status: result.created ? "created" : "existing",
      headSha,
      id: result.id,
      url: result.url
    };
    try {
      const checkResult = await revisionChecks.verify({
        planId: request.planId,
        branch: request.branchName,
        sha: headSha
      });
      validateCheckIdentity(request, headSha, checkResult);
      const mergeDecision: MergeDecisionEvidence = checkResult.status === "success"
        ? { status: "ready-for-review", reason: "Checks passed for the exact pushed revision; human review and merge remain explicit." }
        : { status: "not-ready", reason: `Exact-revision checks are ${checkResult.status}.` };
      return evidence(request, local, pullRequest, { status: checkResult.status, result: checkResult }, mergeDecision, {
        action: checkResult.status === "success" ? "Review the pull request and make the explicit merge decision." : checkResult.nextStep
      }, "completed");
    } catch (error) {
      return evidence(request, local, pullRequest, { status: "adapter-failure", error: errorMessage(error) }, {
        status: "unknown",
        reason: "Exact-revision checks could not be read, so merge readiness is unknown."
      }, {
        action: "Retry exact-revision check verification with this evidence; the existing commit and pull request will be reused."
      });
    }
  } catch (error) {
    return evidence(request, local, {
      status: "failed",
      headSha,
      error: errorMessage(error)
    }, { status: "not-attempted" }, {
      status: "unknown",
      reason: "Pull-request creation failed before exact-revision checks could be bound."
    }, {
      action: "Retry PR creation with this evidence; completed local effects and the pushed commit will be reused."
    });
  }
}

export async function executeArtifactRepositoryReadyPullRequest(
  artifact: PlanArtifact,
  options: ArtifactRepositoryReadyExecutionOptions,
  executor: LocalEffectExecutor,
  pullRequests: PullRequestAdapter,
  revisionChecks: RevisionCheckAdapter
): Promise<RepositoryReadyExecutionEvidence> {
  validateArtifactIntegrity(artifact);
  if (artifact.effects.length === 0) {
    throw new Error("Saved plan contains no executable Repository Ready effect payloads.");
  }
  const seen = new Set<string>();
  const operations = artifact.effects.map((effect) => {
    const operation = artifact.operations.find((candidate) => candidate.id === effect.operationId);
    if (!operation || operation.surface !== "file" || !operation.mutation) {
      throw new Error(`Effect ${effect.operationId} is not an executable file operation in the saved plan.`);
    }
    if (seen.has(effect.operationId)) throw new Error(`Saved plan repeats effect ${effect.operationId}.`);
    seen.add(effect.operationId);
    if (!options.confirmations.includes(effect.operationId)) {
      throw new Error(`Effect ${effect.operationId} requires explicit confirmation for Repository Ready execution.`);
    }
    return {
      id: effect.operationId,
      path: effect.path,
      content: effect.content,
      risk: operation.risk,
      requiresConfirmation: true
    };
  });
  return executeRepositoryReadyPullRequest({
    planId: artifact.id,
    repositoryRoot: artifact.repository.root,
    baseSha: artifact.baseSha,
    baseBranch: artifact.repository.defaultBranch,
    branchName: options.branchName,
    operations,
    confirmations: options.confirmations,
    pullRequest: options.pullRequest,
    previousEvidence: options.previousEvidence
  }, executor, pullRequests, revisionChecks);
}

function validateCheckIdentity(request: RepositoryReadyExecutionRequest, headSha: string, result: RemoteVerificationEvidence): void {
  if (result.planId !== request.planId || result.branch !== request.branchName || result.sha !== headSha) {
    throw new Error("Revision-check evidence does not match the plan-bound pushed branch and SHA.");
  }
}

function validatePreviousEvidence(request: RepositoryReadyExecutionRequest): void {
  const previous = request.previousEvidence;
  if (!previous) return;
  if (
    previous.planId !== request.planId ||
    previous.repositoryRoot !== request.repositoryRoot ||
    previous.baseSha !== request.baseSha ||
    previous.baseBranch !== request.baseBranch ||
    previous.branchName !== request.branchName
  ) {
    throw new Error("Previous execution evidence does not match this repository-bound plan.");
  }
}

function evidence(
  request: RepositoryReadyExecutionRequest,
  local: LocalApplyEvidence,
  pullRequest: PullRequestEvidence,
  checks: RevisionCheckEvidence,
  mergeDecision: MergeDecisionEvidence,
  recovery: { action: string; command?: string },
  status: "completed" | "partial-failure" = "partial-failure"
): RepositoryReadyExecutionEvidence {
  return {
    planId: request.planId,
    repositoryRoot: request.repositoryRoot,
    baseSha: request.baseSha,
    baseBranch: request.baseBranch,
    branchName: request.branchName,
    status,
    local,
    pullRequest,
    checks,
    mergeDecision,
    recovery
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown pull-request adapter failure.";
}
