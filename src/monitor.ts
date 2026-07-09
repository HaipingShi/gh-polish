import type { GitHubReadApi } from "./remoteAnalyzer.js";
import type { GitHubRepositoryRef } from "./githubAdapter.js";

export interface MonitorSummary {
  status: "success" | "failure" | "pending" | "missing" | "unknown";
  totalRuns: number;
  failures: Array<{ name: string; url: string }>;
  recommendations: string[];
}

interface WorkflowRunLike {
  name?: string | null;
  status?: string | null;
  conclusion?: string | null;
  htmlUrl?: string;
  html_url?: string;
}

export async function monitorWorkflowRuns(adapter: Pick<GitHubReadApi, "listWorkflowRuns">, ref: GitHubRepositoryRef): Promise<MonitorSummary> {
  const result = await adapter.listWorkflowRuns(ref);
  if (!result.ok) {
    return {
      status: "unknown",
      totalRuns: 0,
      failures: [],
      recommendations: [`Unable to read workflow runs: ${result.warning.message}`]
    };
  }

  const runs = result.value as WorkflowRunLike[];
  if (runs.length === 0) {
    return { status: "missing", totalRuns: 0, failures: [], recommendations: ["No workflow runs found."] };
  }

  const failures = runs
    .filter((run) => run.conclusion === "failure" || run.conclusion === "cancelled" || run.conclusion === "timed_out")
    .map((run) => ({ name: run.name ?? "workflow", url: run.htmlUrl ?? run.html_url ?? "" }));

  if (failures.length > 0) {
    return { status: "failure", totalRuns: runs.length, failures, recommendations: ["Inspect failing jobs and create a follow-up fix task."] };
  }

  if (runs.some((run) => run.status !== "completed")) {
    return { status: "pending", totalRuns: runs.length, failures: [], recommendations: ["Wait for pending checks to complete."] };
  }

  return { status: "success", totalRuns: runs.length, failures: [], recommendations: [] };
}
