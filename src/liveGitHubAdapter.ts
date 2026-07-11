import type { LiveGitHubCredential, LiveMutationAuthorization } from "./liveGitHubAuthorization.js";
import type { RemoteVerificationEvidence } from "./remoteVerification.js";

export interface LiveGitHubResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
}

export interface LiveGitHubFetchInit {
  method: "GET" | "POST";
  headers: Record<string, string>;
  body?: string;
}

export interface LiveGitHubFetch {
  (url: string, init: LiveGitHubFetchInit): Promise<LiveGitHubResponse>;
}

export interface LivePullRequestInput {
  repository: { id: number; owner: string; repo: string };
  planId: string;
  planDigest: string;
  baseBranch: string;
  baseSha: string;
  headBranch: string;
  headSha: string;
  title: string;
  body: string;
  effectIds: readonly string[];
}

export interface LivePullRequestResult {
  id: string;
  url: string;
  created: boolean;
}

export interface GitHubLiveHttpOptions {
  credential: LiveGitHubCredential;
  fetch: LiveGitHubFetch;
  baseUrl?: string;
}

export interface GitHubLivePullRequestAdapterOptions extends GitHubLiveHttpOptions {
  authorization: LiveMutationAuthorization;
}

export interface LiveRepositoryPreflightInput {
  owner: string;
  repo: string;
  expectedRepositoryId: number;
  expectedFullName: string;
  baseBranch: string;
  baseSha: string;
}

export interface LiveRepositoryPreflightResult {
  id: number;
  fullName: string;
  defaultBranch: string;
  baseSha: string;
}

export interface LiveRevisionCheckInput {
  owner: string;
  repo: string;
  planId: string;
  branch: string;
  sha: string;
}

interface PullRequestCandidate {
  number: number;
  htmlUrl: string;
  baseBranch: string;
  headBranch: string;
  headSha: string;
  body: string;
}

export class GitHubLivePullRequestAdapter {
  private readonly credential: LiveGitHubCredential;
  private readonly authorization: LiveMutationAuthorization;
  private readonly fetchImpl: LiveGitHubFetch;
  private readonly baseUrl: string;

  constructor(options: GitHubLivePullRequestAdapterOptions) {
    this.credential = options.credential;
    this.authorization = options.authorization;
    this.fetchImpl = options.fetch;
    this.baseUrl = (options.baseUrl ?? "https://api.github.com").replace(/\/$/, "");
  }

  async ensureDraftPullRequest(input: LivePullRequestInput): Promise<LivePullRequestResult> {
    validatePullRequestAuthorization(this.authorization, input);
    validateInput(input);
    const existing = await this.findExisting(input);
    if (existing) return result(existing, false);

    const marker = createPullRequestMarker(input);
    const response = await this.request(this.pullRequestPath(input), {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        body: `${input.body}\n\n${marker}`,
        head: input.headBranch,
        base: input.baseBranch,
        draft: true
      })
    });

    if (response.status === 422) {
      const reconciled = await this.findExisting(input);
      if (reconciled) return result(reconciled, false);
      throw new Error("GitHub returned 422 and read-after-write reconciliation found no exact pull request.");
    }
    if (!response.ok) throw apiError(response.status, response.statusText);
    const created = mapPullRequest(await safeJson(response));
    assertExactCandidate(created, input);
    return result(created, true);
  }

  private async findExisting(input: LivePullRequestInput): Promise<PullRequestCandidate | undefined> {
    const ownerHead = `${input.repository.owner}:${input.headBranch}`;
    const query = new URLSearchParams({ state: "all", head: ownerHead, base: input.baseBranch, per_page: "100" });
    const response = await this.request(`${this.pullRequestPath(input)}?${query.toString()}`, { method: "GET" });
    if (!response.ok) throw apiError(response.status, response.statusText);
    const value = await safeJson(response);
    if (!Array.isArray(value)) throw new Error("GitHub pull-request lookup returned an invalid response.");
    const candidates = value.map(mapPullRequest);
    if (candidates.length > 1) {
      throw new Error("Multiple pull requests match the deterministic head/base identity; refusing mutation.");
    }
    const candidate = candidates[0];
    if (!candidate) return undefined;
    assertExactCandidate(candidate, input);
    return candidate;
  }

  private pullRequestPath(input: LivePullRequestInput): string {
    return `/repos/${encodeURIComponent(input.repository.owner)}/${encodeURIComponent(input.repository.repo)}/pulls`;
  }

  private async request(path: string, init: { method: "GET" | "POST"; body?: string }): Promise<LiveGitHubResponse> {
    try {
      return await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: init.method,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: this.credential.authorizationHeader(),
          "Content-Type": "application/json",
          "User-Agent": "gh-polish",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        ...(init.body ? { body: init.body } : {})
      });
    } catch {
      throw new Error("GitHub network request failed; retry with the same plan-bound evidence.");
    }
  }
}

export class GitHubLiveRepositoryAdapter {
  private readonly credential: LiveGitHubCredential;
  private readonly fetchImpl: LiveGitHubFetch;
  private readonly baseUrl: string;

  constructor(options: GitHubLiveHttpOptions) {
    this.credential = options.credential;
    this.fetchImpl = options.fetch;
    this.baseUrl = (options.baseUrl ?? "https://api.github.com").replace(/\/$/, "");
  }

  async preflightRepository(input: LiveRepositoryPreflightInput): Promise<LiveRepositoryPreflightResult> {
    const repositoryPath = `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}`;
    const repositoryResponse = await requestJson(this.fetchImpl, this.credential, this.baseUrl, repositoryPath);
    const repository = readObject(repositoryResponse);
    const result = {
      id: readNumber(repository, "id"),
      fullName: readString(repository, "full_name"),
      defaultBranch: readString(repository, "default_branch"),
      baseSha: ""
    };
    if (result.id !== input.expectedRepositoryId || result.fullName !== input.expectedFullName) {
      throw new Error("Fetched GitHub repository identity does not match the exact allowlist.");
    }
    if (result.defaultBranch !== input.baseBranch) {
      throw new Error("Fetched GitHub default branch does not match the reviewed plan.");
    }

    const refPath = `${repositoryPath}/git/ref/heads/${encodeURIComponent(input.baseBranch)}`;
    const ref = readObject(await requestJson(this.fetchImpl, this.credential, this.baseUrl, refPath));
    result.baseSha = readString(readObject(ref.object), "sha");
    if (result.baseSha !== input.baseSha) {
      throw new Error("Fetched GitHub base SHA is stale or does not match the reviewed plan.");
    }
    return result;
  }

  async verifyExactRevision(input: LiveRevisionCheckInput): Promise<RemoteVerificationEvidence> {
    const query = new URLSearchParams({ branch: input.branch, per_page: "100" });
    const path = `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/actions/runs?${query.toString()}`;
    const object = readObject(await requestJson(this.fetchImpl, this.credential, this.baseUrl, path));
    const rawRuns = object.workflow_runs;
    if (!Array.isArray(rawRuns)) throw new Error("GitHub workflow-run response is invalid.");
    const runs = rawRuns.map(mapWorkflowRun).filter((run) => run.branch === input.branch && run.sha === input.sha);
    const mapped = runs.map((run) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      url: run.url
    }));
    if (runs.length === 0) return revisionEvidence(input, "missing", mapped, "Wait for a workflow run for the exact pushed branch and SHA.");
    if (runs.some((run) => run.status !== "completed" || run.conclusion === null)) {
      return revisionEvidence(input, "pending", mapped, "Wait for exact-revision checks to complete, then retry verification.");
    }
    if (runs.some((run) => run.conclusion !== "success")) {
      return revisionEvidence(input, "failure", mapped, "Inspect the failing exact-revision workflow run before review.");
    }
    return revisionEvidence(input, "success", mapped, "Exact-revision checks passed; merge remains a separate human decision.");
  }
}

export function createPullRequestMarker(input: LivePullRequestInput): string {
  const payload = {
    repositoryId: input.repository.id,
    planId: input.planId,
    planDigest: input.planDigest,
    baseBranch: input.baseBranch,
    baseSha: input.baseSha,
    headBranch: input.headBranch,
    headSha: input.headSha,
    effectIds: [...input.effectIds].sort()
  };
  return `<!-- gh-polish:${JSON.stringify(payload)} -->`;
}

function assertExactCandidate(candidate: PullRequestCandidate, input: LivePullRequestInput): void {
  if (
    candidate.baseBranch !== input.baseBranch ||
    candidate.headBranch !== input.headBranch ||
    candidate.headSha !== input.headSha ||
    !candidate.body.includes(createPullRequestMarker(input))
  ) {
    throw new Error("Pull-request conflict: existing base, head, SHA, or plan marker does not match.");
  }
}

function validateInput(input: LivePullRequestInput): void {
  if (!Number.isSafeInteger(input.repository.id) || input.repository.id <= 0) {
    throw new Error("A fetched numeric repository identity is required for pull-request idempotency.");
  }
  if (!/^[a-f0-9]{64}$/i.test(input.planDigest)) throw new Error("A valid plan digest is required.");
  if (!/^[a-f0-9]{40}$/i.test(input.baseSha) || !/^[a-f0-9]{40}$/i.test(input.headSha)) {
    throw new Error("Exact base and head SHAs are required.");
  }
  if (input.baseBranch === input.headBranch || !input.headBranch.startsWith(`gh-polish/live/${input.planDigest.slice(0, 12)}`)) {
    throw new Error("Head branch must be the deterministic non-default live branch.");
  }
}

function validatePullRequestAuthorization(
  authorization: LiveMutationAuthorization,
  input: LivePullRequestInput
): void {
  const repository = `${input.repository.owner}/${input.repository.repo}`;
  const expectedEffects = [...authorization.effectIds].sort();
  const receivedEffects = [...input.effectIds].sort();
  if (input.repository.id !== authorization.repositoryId || repository !== authorization.repository) {
    throw new Error("Pull-request repository identity is not bound to the live authorization.");
  }
  if (
    input.baseBranch !== authorization.baseBranch ||
    input.baseSha !== authorization.baseSha ||
    input.headBranch !== authorization.headBranch ||
    input.planDigest.toLowerCase() !== authorization.planDigest
  ) {
    throw new Error("Pull-request branch or plan identity is not bound to the live authorization.");
  }
  if (
    expectedEffects.length !== receivedEffects.length ||
    expectedEffects.some((effect, index) => effect !== receivedEffects[index])
  ) {
    throw new Error("Pull-request effect IDs are not bound to the live authorization.");
  }
}

function mapPullRequest(value: unknown): PullRequestCandidate {
  const object = readObject(value);
  const base = readObject(object.base);
  const head = readObject(object.head);
  return {
    number: readNumber(object, "number"),
    htmlUrl: readString(object, "html_url"),
    baseBranch: readString(base, "ref"),
    headBranch: readString(head, "ref"),
    headSha: readString(head, "sha"),
    body: typeof object.body === "string" ? object.body : ""
  };
}

function result(candidate: PullRequestCandidate, created: boolean): LivePullRequestResult {
  return { id: String(candidate.number), url: candidate.htmlUrl, created };
}

function apiError(status: number, statusText: string): Error {
  if (status === 401) return new Error("GitHub credential is missing or invalid (401).");
  if (status === 403) return new Error("GitHub permission is insufficient or rate limited (403).");
  if (status === 404) return new Error("Allowlisted GitHub repository or pull request is not visible (404).");
  return new Error(`GitHub API request failed (${status}${statusText ? ` ${statusText}` : ""}).`);
}

async function safeJson(response: LiveGitHubResponse): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("GitHub API returned an unreadable response.");
  }
}

async function requestJson(
  fetchImpl: LiveGitHubFetch,
  credential: LiveGitHubCredential,
  baseUrl: string,
  path: string
): Promise<unknown> {
  let response: LiveGitHubResponse;
  try {
    response = await fetchImpl(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: credential.authorizationHeader(),
        "User-Agent": "gh-polish",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
  } catch {
    throw new Error("GitHub network request failed during repository-bound verification.");
  }
  if (!response.ok) throw apiError(response.status, response.statusText);
  return safeJson(response);
}

function mapWorkflowRun(value: unknown): {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  branch: string | null;
  sha: string;
  url: string;
} {
  const object = readObject(value);
  return {
    id: readNumber(object, "id"),
    name: typeof object.name === "string" ? object.name : "workflow",
    status: typeof object.status === "string" ? object.status : null,
    conclusion: typeof object.conclusion === "string" ? object.conclusion : null,
    branch: typeof object.head_branch === "string" ? object.head_branch : null,
    sha: readString(object, "head_sha"),
    url: readString(object, "html_url")
  };
}

function revisionEvidence(
  input: LiveRevisionCheckInput,
  status: RemoteVerificationEvidence["status"],
  runs: RemoteVerificationEvidence["runs"],
  nextStep: string
): RemoteVerificationEvidence {
  return {
    planId: input.planId,
    branch: input.branch,
    sha: input.sha,
    status,
    matchedRuns: runs.length,
    runs,
    nextStep
  };
}

function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected GitHub response object.");
  return value as Record<string, unknown>;
}

function readString(object: Record<string, unknown>, key: string): string {
  const value = object[key];
  if (typeof value !== "string") throw new Error(`Expected GitHub string field ${key}.`);
  return value;
}

function readNumber(object: Record<string, unknown>, key: string): number {
  const value = object[key];
  if (typeof value !== "number") throw new Error(`Expected GitHub number field ${key}.`);
  return value;
}
