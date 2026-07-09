export interface GitHubRepositoryRef {
  owner: string;
  repo: string;
}

export interface GitHubAdapterOptions {
  token?: string;
  baseUrl?: string;
  fetch?: FetchLike;
}

export interface GitHubRepositoryMetadata {
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  homepage: string | null;
  defaultBranch: string;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  archived: boolean;
  disabled: boolean;
  license: {
    key: string;
    name: string;
    spdxId: string | null;
  } | null;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string | null;
  status: string | null;
  conclusion: string | null;
  headBranch: string | null;
  headSha: string;
  htmlUrl: string;
}

export interface GitHubLabel {
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubMilestone {
  number: number;
  title: string;
  state: string;
  description: string | null;
}

export type GitHubReadResult<T> =
  | { ok: true; value: T }
  | { ok: false; warning: GitHubReadWarning };

export interface GitHubReadWarning {
  kind: "not_found" | "forbidden" | "rate_limited" | "unauthorized" | "api_error" | "network_error" | "invalid_response";
  status?: number;
  message: string;
}

export interface TokenResolution {
  token?: string;
  source: "explicit" | "GH_TOKEN" | "GITHUB_TOKEN" | "none";
}

interface FetchLike {
  (url: string, init: { method: "GET"; headers: Record<string, string> }): Promise<ResponseLike>;
}

interface ResponseLike {
  ok: boolean;
  status: number;
  statusText: string;
  headers: {
    get(name: string): string | null;
  };
  json(): Promise<unknown>;
}

const DEFAULT_BASE_URL = "https://api.github.com";
const API_VERSION = "2026-03-10";

export class GitHubReadAdapter {
  private readonly token?: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: GitHubAdapterOptions = {}) {
    this.token = options.token;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  getRepository(ref: GitHubRepositoryRef): Promise<GitHubReadResult<GitHubRepositoryMetadata>> {
    return this.get(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`, mapRepositoryMetadata);
  }

  getTopics(ref: GitHubRepositoryRef): Promise<GitHubReadResult<string[]>> {
    return this.get(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/topics`, (json) => {
      const names = readArray(readObject(json), "names");
      return names.filter((value): value is string => typeof value === "string").sort();
    });
  }

  listWorkflows(ref: GitHubRepositoryRef): Promise<GitHubReadResult<GitHubWorkflow[]>> {
    return this.get(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/actions/workflows?per_page=100`, (json) => {
      return readArray(readObject(json), "workflows").map(mapWorkflow);
    });
  }

  listWorkflowRuns(ref: GitHubRepositoryRef): Promise<GitHubReadResult<GitHubWorkflowRun[]>> {
    return this.get(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/actions/runs?per_page=30`, (json) => {
      return readArray(readObject(json), "workflow_runs").map(mapWorkflowRun);
    });
  }

  listLabels(ref: GitHubRepositoryRef): Promise<GitHubReadResult<GitHubLabel[]>> {
    return this.get(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/labels?per_page=100`, (json) => {
      return readArrayValue(json).map(mapLabel);
    });
  }

  listMilestones(ref: GitHubRepositoryRef): Promise<GitHubReadResult<GitHubMilestone[]>> {
    return this.get(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/milestones?state=all&per_page=100`, (json) => {
      return readArrayValue(json).map(mapMilestone);
    });
  }

  private async get<T>(path: string, mapper: (json: unknown) => T): Promise<GitHubReadResult<T>> {
    let response: ResponseLike;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: this.headers()
      });
    } catch (error) {
      return {
        ok: false,
        warning: {
          kind: "network_error",
          message: error instanceof Error ? error.message : "GitHub request failed."
        }
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        warning: warningFromResponse(response)
      };
    }

    try {
      return { ok: true, value: mapper(await response.json()) };
    } catch (error) {
      return {
        ok: false,
        warning: {
          kind: "invalid_response",
          status: response.status,
          message: error instanceof Error ? error.message : "GitHub response could not be parsed."
        }
      };
    }
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": "gh-polish"
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }
}

export function resolveGitHubToken(env: NodeJS.ProcessEnv, explicitToken?: string): TokenResolution {
  if (explicitToken) {
    return { token: explicitToken, source: "explicit" };
  }

  if (env.GH_TOKEN) {
    return { token: env.GH_TOKEN, source: "GH_TOKEN" };
  }

  if (env.GITHUB_TOKEN) {
    return { token: env.GITHUB_TOKEN, source: "GITHUB_TOKEN" };
  }

  return { source: "none" };
}

function warningFromResponse(response: ResponseLike): GitHubReadWarning {
  const remaining = response.headers.get("x-ratelimit-remaining");
  if (response.status === 403 && remaining === "0") {
    return { kind: "rate_limited", status: response.status, message: "GitHub API rate limit exceeded." };
  }

  if (response.status === 401) {
    return { kind: "unauthorized", status: response.status, message: "GitHub token is missing or invalid." };
  }

  if (response.status === 403) {
    return { kind: "forbidden", status: response.status, message: "GitHub token lacks permission for this read." };
  }

  if (response.status === 404) {
    return { kind: "not_found", status: response.status, message: "GitHub resource was not found or is not visible." };
  }

  return {
    kind: "api_error",
    status: response.status,
    message: response.statusText || `GitHub API returned ${response.status}.`
  };
}

function mapRepositoryMetadata(json: unknown): GitHubRepositoryMetadata {
  const object = readObject(json);
  const license = object.license === null || object.license === undefined ? null : readObject(object.license);

  return {
    name: readString(object, "name"),
    fullName: readString(object, "full_name"),
    private: readBoolean(object, "private"),
    description: readNullableString(object, "description"),
    homepage: readNullableString(object, "homepage"),
    defaultBranch: readString(object, "default_branch"),
    hasIssues: readBoolean(object, "has_issues"),
    hasProjects: readBoolean(object, "has_projects"),
    hasWiki: readBoolean(object, "has_wiki"),
    hasPages: readBoolean(object, "has_pages"),
    archived: readBoolean(object, "archived"),
    disabled: readBoolean(object, "disabled"),
    license: license
      ? {
          key: readString(license, "key"),
          name: readString(license, "name"),
          spdxId: readNullableString(license, "spdx_id")
        }
      : null
  };
}

function mapWorkflow(value: unknown): GitHubWorkflow {
  const object = readObject(value);
  return {
    id: readNumber(object, "id"),
    name: readString(object, "name"),
    path: readString(object, "path"),
    state: readString(object, "state")
  };
}

function mapWorkflowRun(value: unknown): GitHubWorkflowRun {
  const object = readObject(value);
  return {
    id: readNumber(object, "id"),
    name: readNullableString(object, "name"),
    status: readNullableString(object, "status"),
    conclusion: readNullableString(object, "conclusion"),
    headBranch: readNullableString(object, "head_branch"),
    headSha: readString(object, "head_sha"),
    htmlUrl: readString(object, "html_url")
  };
}

function mapLabel(value: unknown): GitHubLabel {
  const object = readObject(value);
  return {
    name: readString(object, "name"),
    color: readString(object, "color"),
    description: readNullableString(object, "description")
  };
}

function mapMilestone(value: unknown): GitHubMilestone {
  const object = readObject(value);
  return {
    number: readNumber(object, "number"),
    title: readString(object, "title"),
    state: readString(object, "state"),
    description: readNullableString(object, "description")
  };
}

function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected GitHub response object.");
  }

  return value as Record<string, unknown>;
}

function readArray(object: Record<string, unknown>, key: string): unknown[] {
  return readArrayValue(object[key]);
}

function readArrayValue(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected GitHub response array.");
  }

  return value;
}

function readString(object: Record<string, unknown>, key: string): string {
  const value = object[key];
  if (typeof value !== "string") {
    throw new Error(`Expected string field ${key}.`);
  }

  return value;
}

function readNullableString(object: Record<string, unknown>, key: string): string | null {
  const value = object[key];
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`Expected nullable string field ${key}.`);
  }

  return value;
}

function readBoolean(object: Record<string, unknown>, key: string): boolean {
  const value = object[key];
  if (typeof value !== "boolean") {
    throw new Error(`Expected boolean field ${key}.`);
  }

  return value;
}

function readNumber(object: Record<string, unknown>, key: string): number {
  const value = object[key];
  if (typeof value !== "number") {
    throw new Error(`Expected number field ${key}.`);
  }

  return value;
}
