import {
  GitHubLivePullRequestAdapter,
  GitHubLiveRepositoryAdapter,
  type LiveGitHubFetch
} from "./liveGitHubAdapter.js";
import {
  authorizeLiveGitHubMutation,
  type LiveGitHubCredential,
  type LiveMutationAuthorization,
  type LiveMutationEffect
} from "./liveGitHubAuthorization.js";
import { GitHubLiveGitPushAdapter, type LiveGitRunner } from "./liveGitPushAdapter.js";
import { createLocalGitExecutor } from "./localGitExecutor.js";
import type { LocalEffectExecutor } from "./localApply.js";
import type { PlanArtifact } from "./planArtifact.js";
import type { RepositoryContext } from "./repositoryContext.js";
import type {
  PullRequestAdapter,
  RevisionCheckAdapter
} from "./repositoryReadyExecution.js";

export interface LiveExecutionCompositionInput {
  credential: LiveGitHubCredential;
  artifact: PlanArtifact;
  context: RepositoryContext;
  enableMutation: boolean;
  requestedRepository: string;
  allowlistedRepository: string;
  expectedRepositoryId: number;
  expectedReviewToken: string;
  suppliedReviewToken: string;
  confirmations: readonly string[];
  fetch?: LiveGitHubFetch;
  gitRunner?: LiveGitRunner;
  localExecutor?: LocalEffectExecutor;
  baseUrl?: string;
}

export interface LiveExecutionComposition {
  authorization: LiveMutationAuthorization;
  executor: LocalEffectExecutor;
  pullRequests: PullRequestAdapter;
  revisionChecks: RevisionCheckAdapter;
  remoteUrl: string;
}

export async function composeLiveExecution(
  input: LiveExecutionCompositionInput
): Promise<LiveExecutionComposition> {
  const { owner, repo } = parseRepositoryName(input.requestedRepository);
  const fetchImpl = input.fetch ?? defaultLiveFetch;
  const repositoryAdapter = new GitHubLiveRepositoryAdapter({
    credential: input.credential,
    fetch: fetchImpl,
    ...(input.baseUrl ? { baseUrl: input.baseUrl } : {})
  });

  const baseBranch = input.artifact.repository.defaultBranch;
  const fetched = await repositoryAdapter.preflightRepository({
    owner,
    repo,
    expectedRepositoryId: input.expectedRepositoryId,
    expectedFullName: input.requestedRepository,
    baseBranch,
    baseSha: input.artifact.baseSha
  });

  const authorization = authorizeLiveGitHubMutation({
    enableMutation: input.enableMutation,
    requestedRepository: input.requestedRepository,
    allowlistedRepository: input.allowlistedRepository,
    localRemoteRepository: remoteRepositoryName(input.context),
    artifactRepository: artifactRepositoryName(input.artifact),
    expectedRepositoryId: input.expectedRepositoryId,
    fetchedRepository: {
      id: fetched.id,
      fullName: fetched.fullName,
      defaultBranch: fetched.defaultBranch,
      baseSha: fetched.baseSha,
      permissions: fetched.permissions
    },
    baseBranch,
    baseSha: input.artifact.baseSha,
    planDigest: input.artifact.digest,
    expectedReviewToken: input.expectedReviewToken,
    suppliedReviewToken: input.suppliedReviewToken,
    effects: artifactLiveEffects(input.artifact),
    confirmedEffectIds: input.confirmations
  });

  const remoteUrl = `https://github.com/${owner}/${repo}.git`;
  const executor = createLiveGitHubExecutor({
    repositoryRoot: input.artifact.repository.root,
    remoteUrl,
    credential: input.credential,
    authorization,
    ...(input.gitRunner ? { runner: input.gitRunner } : {}),
    ...(input.localExecutor ? { base: input.localExecutor } : {})
  });

  const pullRequestAdapter = new GitHubLivePullRequestAdapter({
    credential: input.credential,
    authorization,
    fetch: fetchImpl,
    ...(input.baseUrl ? { baseUrl: input.baseUrl } : {})
  });

  const pullRequests: PullRequestAdapter = {
    async ensurePullRequest(request) {
      return pullRequestAdapter.ensureDraftPullRequest({
        repository: { id: authorization.repositoryId, owner, repo },
        planId: request.planId,
        planDigest: authorization.planDigest,
        baseBranch: request.baseBranch,
        baseSha: authorization.baseSha,
        headBranch: request.headBranch,
        headSha: request.headSha,
        title: request.title,
        body: request.body,
        effectIds: authorization.effectIds
      });
    }
  };

  const revisionChecks: RevisionCheckAdapter = {
    async verify(target) {
      return repositoryAdapter.verifyExactRevision({
        owner,
        repo,
        planId: target.planId,
        branch: target.branch,
        sha: target.sha
      });
    }
  };

  return { authorization, executor, pullRequests, revisionChecks, remoteUrl };
}

export interface LiveGitHubExecutorOptions {
  repositoryRoot: string;
  remoteUrl: string;
  credential: LiveGitHubCredential;
  authorization: LiveMutationAuthorization;
  runner?: LiveGitRunner;
  base?: LocalEffectExecutor;
}

export function createLiveGitHubExecutor(options: LiveGitHubExecutorOptions): LocalEffectExecutor {
  const base = options.base ?? createLocalGitExecutor(options.repositoryRoot);
  const pushAdapter = new GitHubLiveGitPushAdapter({
    credential: options.credential,
    authorization: options.authorization,
    ...(options.runner ? { runner: options.runner } : {})
  });
  let commitSha: string | undefined;
  return {
    createBranch: (branch, baseBranch, expectedBaseSha) => base.createBranch(branch, baseBranch, expectedBaseSha),
    writeFile: (path, content) => base.writeFile(path, content),
    async commit(planId) {
      commitSha = await base.commit(planId);
      return commitSha;
    },
    async push(branch) {
      if (!commitSha) {
        throw new Error("Live push requires an exact commit SHA produced by this execution.");
      }
      await pushAdapter.ensurePushedBranch({
        repositoryRoot: options.repositoryRoot,
        repository: options.authorization.repository,
        remoteUrl: options.remoteUrl,
        baseBranch: options.authorization.baseBranch,
        headBranch: branch,
        headSha: commitSha
      });
    }
  };
}

export function artifactLiveEffects(artifact: PlanArtifact): LiveMutationEffect[] {
  return artifact.effects.map((effect) => ({
    id: effect.operationId,
    path: effect.path,
    mode: "create" as const
  }));
}

export function parseRepositoryName(value: string): { owner: string; repo: string } {
  const match = /^([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)\/([A-Za-z0-9._-]+)$/.exec(value);
  if (!match?.[1] || !match[2] || match[2] === "." || match[2] === "..") {
    throw new Error("Live repository must be an exact 'owner/name' GitHub repository.");
  }
  return { owner: match[1], repo: match[2] };
}

function remoteRepositoryName(context: RepositoryContext): string {
  const remote = context.remotes.find((candidate) => candidate.name === "origin") ?? context.remotes[0];
  if (!remote) throw new Error("Live mutation requires a GitHub remote on the local repository.");
  return `${remote.owner}/${remote.repo}`;
}

function artifactRepositoryName(artifact: PlanArtifact): string {
  const remotes = artifact.repository.remotes;
  const remote = remotes.find((candidate) => candidate.name === "origin") ?? remotes[0];
  if (!remote) throw new Error("Saved plan does not record a GitHub remote for live mutation.");
  return `${remote.owner}/${remote.repo}`;
}

const defaultLiveFetch: LiveGitHubFetch = async (url, init) => {
  const response = await globalThis.fetch(url, {
    method: init.method,
    headers: init.headers,
    ...(init.body ? { body: init.body } : {})
  });
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    json: () => response.json()
  };
};
