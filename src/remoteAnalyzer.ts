import type { GitHubReadResult, GitHubRepositoryRef } from "./githubAdapter.js";

export interface RemoteAnalysis {
  source: GitHubRepositoryRef;
  checkedAt: string;
  repository: GitHubReadResult<unknown>;
  topics: GitHubReadResult<string[]>;
  workflows: GitHubReadResult<unknown[]>;
  workflowRuns: GitHubReadResult<unknown[]>;
  labels: GitHubReadResult<unknown[]>;
  milestones: GitHubReadResult<unknown[]>;
  warnings: string[];
}

export interface GitHubReadApi {
  getRepository(ref: GitHubRepositoryRef): Promise<GitHubReadResult<unknown>>;
  getTopics(ref: GitHubRepositoryRef): Promise<GitHubReadResult<string[]>>;
  listWorkflows(ref: GitHubRepositoryRef): Promise<GitHubReadResult<unknown[]>>;
  listWorkflowRuns(ref: GitHubRepositoryRef): Promise<GitHubReadResult<unknown[]>>;
  listLabels(ref: GitHubRepositoryRef): Promise<GitHubReadResult<unknown[]>>;
  listMilestones(ref: GitHubRepositoryRef): Promise<GitHubReadResult<unknown[]>>;
}

export async function analyzeRemoteRepository(
  adapter: GitHubReadApi,
  ref: GitHubRepositoryRef,
  now: Date = new Date()
): Promise<RemoteAnalysis> {
  const [repository, topics, workflows, workflowRuns, labels, milestones] = await Promise.all([
    adapter.getRepository(ref),
    adapter.getTopics(ref),
    adapter.listWorkflows(ref),
    adapter.listWorkflowRuns(ref),
    adapter.listLabels(ref),
    adapter.listMilestones(ref)
  ]);

  const results = [repository, topics, workflows, workflowRuns, labels, milestones];
  return {
    source: ref,
    checkedAt: now.toISOString(),
    repository,
    topics,
    workflows,
    workflowRuns,
    labels,
    milestones,
    warnings: results.flatMap((result) => result.ok ? [] : [`${result.warning.kind}: ${result.warning.message}`])
  };
}
