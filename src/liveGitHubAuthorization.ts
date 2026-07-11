const ALLOWED_CREATE_PATHS = new Set([
  "README.md",
  ".gitignore",
  "CONTRIBUTING.md",
  ".github/pull_request_template.md"
]);

export type LiveCredentialSource = "explicit" | "GH_TOKEN";

export class LiveGitHubCredential {
  readonly source: LiveCredentialSource;
  #token: string;

  constructor(token: string, source: LiveCredentialSource) {
    if (!token.trim()) throw new Error("A non-empty live GitHub credential is required.");
    this.#token = token;
    this.source = source;
  }

  authorizationHeader(): string {
    return `Bearer ${this.#token}`;
  }

  redact(value: string): string {
    return value.split(this.#token).join("[REDACTED]");
  }

  toJSON(): { source: LiveCredentialSource; redacted: true } {
    return { source: this.source, redacted: true };
  }
}

export function resolveLiveGitHubCredential(
  env: NodeJS.ProcessEnv,
  explicitToken?: string
): LiveGitHubCredential {
  if (explicitToken?.trim()) return new LiveGitHubCredential(explicitToken, "explicit");
  if (env.GH_TOKEN?.trim()) return new LiveGitHubCredential(env.GH_TOKEN, "GH_TOKEN");
  throw new Error("Live GitHub mutation requires an injected token or GH_TOKEN; ambient GITHUB_TOKEN is not accepted.");
}

export interface LiveRepositoryPermissions {
  contents: "none" | "read" | "write";
  pullRequests: "none" | "read" | "write";
  actions: "none" | "read" | "write";
}

export interface LiveFetchedRepository {
  id: number;
  fullName: string;
  defaultBranch: string;
  baseSha: string;
  permissions: LiveRepositoryPermissions;
}

export interface LiveMutationEffect {
  id: string;
  path: string;
  mode: "create";
}

export interface LiveMutationAuthorizationRequest {
  enableMutation: boolean;
  requestedRepository: string;
  allowlistedRepository: string;
  localRemoteRepository: string;
  artifactRepository: string;
  expectedRepositoryId: number;
  fetchedRepository: LiveFetchedRepository;
  baseBranch: string;
  baseSha: string;
  planDigest: string;
  expectedReviewToken: string;
  suppliedReviewToken: string;
  effects: readonly LiveMutationEffect[];
  confirmedEffectIds: readonly string[];
}

export interface LiveMutationAuthorization {
  repositoryId: number;
  repository: string;
  baseBranch: string;
  baseSha: string;
  planDigest: string;
  headBranch: string;
  effectIds: readonly string[];
}

export function authorizeLiveGitHubMutation(
  request: LiveMutationAuthorizationRequest
): LiveMutationAuthorization {
  if (!request.enableMutation) {
    throw new Error("Live GitHub mutation enable flag is not set.");
  }
  if (!request.allowlistedRepository || request.requestedRepository !== request.allowlistedRepository) {
    throw new Error("Requested repository does not exactly match the live repository allowlist.");
  }
  if (
    request.fetchedRepository.fullName !== request.requestedRepository ||
    request.localRemoteRepository !== request.requestedRepository ||
    request.artifactRepository !== request.requestedRepository ||
    request.fetchedRepository.id !== request.expectedRepositoryId
  ) {
    throw new Error("Repository identity does not agree across the allowlist, remote, artifact, and fetched repository.");
  }
  if (request.fetchedRepository.defaultBranch !== request.baseBranch) {
    throw new Error("Fetched default branch does not match the reviewed base branch.");
  }
  if (request.fetchedRepository.baseSha !== request.baseSha) {
    throw new Error("Fetched base SHA is stale or does not match the reviewed plan.");
  }
  requirePermissions(request.fetchedRepository.permissions);
  if (!request.expectedReviewToken || request.suppliedReviewToken !== request.expectedReviewToken) {
    throw new Error("Live execution review token does not match the reviewed artifact and confirmations.");
  }
  if (!/^[a-f0-9]{64}$/i.test(request.planDigest)) {
    throw new Error("Plan digest must be a SHA-256 value before live authorization.");
  }

  const effectIds = validateEffects(request.effects, request.confirmedEffectIds);
  return Object.freeze({
    repositoryId: request.fetchedRepository.id,
    repository: request.fetchedRepository.fullName,
    baseBranch: request.baseBranch,
    baseSha: request.baseSha,
    planDigest: request.planDigest.toLowerCase(),
    headBranch: `gh-polish/live/${request.planDigest.slice(0, 12).toLowerCase()}`,
    effectIds: Object.freeze(effectIds)
  });
}

function requirePermissions(permissions: LiveRepositoryPermissions): void {
  if (permissions.contents !== "write") {
    throw new Error("Live GitHub mutation requires Contents: write permission.");
  }
  if (permissions.pullRequests !== "write") {
    throw new Error("Live GitHub mutation requires Pull requests: write permission.");
  }
  if (permissions.actions !== "read" && permissions.actions !== "write") {
    throw new Error("Live GitHub verification requires Actions: read permission.");
  }
}

function validateEffects(
  effects: readonly LiveMutationEffect[],
  confirmedEffectIds: readonly string[]
): string[] {
  if (effects.length === 0) throw new Error("Live execution requires at least one reviewed create effect.");
  const ids = effects.map((effect) => effect.id);
  if (new Set(ids).size !== ids.length || new Set(confirmedEffectIds).size !== confirmedEffectIds.length) {
    throw new Error("Live effect IDs and confirmations must be unique.");
  }
  for (const effect of effects) {
    if (effect.mode !== "create" || !ALLOWED_CREATE_PATHS.has(effect.path)) {
      throw new Error(`Forbidden live effect path or mode: ${effect.path}.`);
    }
  }
  if (
    confirmedEffectIds.length !== ids.length ||
    ids.some((id) => !confirmedEffectIds.includes(id)) ||
    confirmedEffectIds.some((id) => !ids.includes(id))
  ) {
    throw new Error("Confirmed effect IDs must exactly match the reviewed live effects.");
  }
  return [...ids].sort();
}
