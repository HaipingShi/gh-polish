import {
  executeLocalPlan,
  type LocalApplyEvidence,
  type LocalApplyRequest,
  type LocalEffectExecutor
} from "./localApply.js";

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

export interface RepositoryReadyExecutionRequest extends Omit<LocalApplyRequest, "completedOperationIds"> {
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

export interface RepositoryReadyExecutionEvidence {
  planId: string;
  repositoryRoot: string;
  baseSha: string;
  baseBranch: string;
  branchName: string;
  status: "completed" | "partial-failure";
  local: LocalApplyEvidence;
  pullRequest: PullRequestEvidence;
  recovery: { action: string; command?: string };
}

export async function executeRepositoryReadyPullRequest(
  request: RepositoryReadyExecutionRequest,
  executor: LocalEffectExecutor,
  pullRequests: PullRequestAdapter
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
    return evidence(request, local, { status: "not-attempted" }, {
      action: "Review the failed local effect, then retry with this evidence after correcting the cause."
    });
  }

  const headSha = local.commitSha ?? request.previousEvidence?.pullRequest.headSha;
  if (!headSha) {
    return evidence(request, local, { status: "failed", error: "No pushed head SHA is available." }, {
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
    return evidence(request, local, {
      status: result.created ? "created" : "existing",
      headSha,
      id: result.id,
      url: result.url
    }, { action: "Review the pull request checks and merge decision." }, "completed");
  } catch (error) {
    return evidence(request, local, {
      status: "failed",
      headSha,
      error: errorMessage(error)
    }, {
      action: "Retry PR creation with this evidence; completed local effects and the pushed commit will be reused."
    });
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
    recovery
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown pull-request adapter failure.";
}
