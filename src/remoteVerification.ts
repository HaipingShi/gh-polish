import type { GitHubRepositoryRef, GitHubWorkflowRun } from "./githubAdapter.js";
import type { GitHubReadApi } from "./remoteAnalyzer.js";

export interface RemoteVerificationTarget {
  planId: string;
  branch: string;
  sha: string;
}

export interface RemoteVerificationEvidence {
  planId: string;
  branch: string;
  sha: string;
  status: "pending" | "success" | "failure" | "missing" | "permission-limited";
  matchedRuns: number;
  runs: Array<{ id: number; name: string; status: string | null; conclusion: string | null; url: string }>;
  nextStep: string;
  warning?: string;
}

export async function verifyRemoteRevision(
  adapter: Pick<GitHubReadApi, "listWorkflowRuns">,
  ref: GitHubRepositoryRef,
  target: RemoteVerificationTarget
): Promise<RemoteVerificationEvidence> {
  const result = await adapter.listWorkflowRuns(ref);
  if (!result.ok) {
    return evidence(target, "permission-limited", [], `Review GitHub read permission and retry verification.`, result.warning.message);
  }

  const matched = (result.value as GitHubWorkflowRun[]).filter((run) => run.headBranch === target.branch && run.headSha === target.sha);
  if (matched.length === 0) {
    return evidence(target, "missing", [], "Confirm the pushed branch and SHA, then wait for its workflow run.");
  }

  const runs = matched.map((run) => ({
    id: run.id,
    name: run.name ?? "workflow",
    status: run.status,
    conclusion: run.conclusion,
    url: run.htmlUrl
  }));
  if (matched.some((run) => run.status !== "completed" || run.conclusion === null)) {
    return evidence(target, "pending", runs, "Wait for target-revision checks to complete, then verify again.");
  }
  if (matched.some((run) => run.conclusion !== "success")) {
    return evidence(target, "failure", runs, "Inspect the failing target-revision workflow run and create a repair task.");
  }
  return evidence(target, "success", runs, "Record M0 completion evidence and prepare the M1 Repository Ready contract.");
}

function evidence(
  target: RemoteVerificationTarget,
  status: RemoteVerificationEvidence["status"],
  runs: RemoteVerificationEvidence["runs"],
  nextStep: string,
  warning?: string
): RemoteVerificationEvidence {
  return {
    planId: target.planId,
    branch: target.branch,
    sha: target.sha,
    status,
    matchedRuns: runs.length,
    runs,
    nextStep,
    ...(warning ? { warning } : {})
  };
}
