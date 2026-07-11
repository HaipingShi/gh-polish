import { execFile } from "node:child_process";
import type { LiveGitHubCredential, LiveMutationAuthorization } from "./liveGitHubAuthorization.js";

export interface LiveGitInvocation {
  cwd: string;
  args: readonly string[];
  env: Record<string, string>;
}

export interface LiveGitResult {
  stdout: string;
  stderr: string;
}

export interface LiveGitRunner {
  (invocation: LiveGitInvocation): Promise<LiveGitResult>;
}

export interface LiveGitPushInput {
  repositoryRoot: string;
  repository: string;
  remoteUrl: string;
  baseBranch: string;
  headBranch: string;
  headSha: string;
}

export interface LiveGitPushResult {
  branch: string;
  sha: string;
  created: boolean;
}

export interface GitHubLiveGitPushAdapterOptions {
  credential: LiveGitHubCredential;
  authorization: LiveMutationAuthorization;
  runner?: LiveGitRunner;
}

export class GitHubLiveGitPushAdapter {
  private readonly credential: LiveGitHubCredential;
  private readonly authorization: LiveMutationAuthorization;
  private readonly runner: LiveGitRunner;

  constructor(options: GitHubLiveGitPushAdapterOptions) {
    this.credential = options.credential;
    this.authorization = options.authorization;
    this.runner = options.runner ?? runGit;
  }

  async ensurePushedBranch(input: LiveGitPushInput): Promise<LiveGitPushResult> {
    validatePushAuthorization(this.authorization, input);
    validatePushInput(input);
    const environment = gitEnvironment(this.credential);
    const current = await this.readRemoteSha(input, environment);
    if (current === input.headSha) return pushResult(input, false);
    if (current) throw new Error("Live branch conflict: remote branch exists at an unexpected SHA.");

    try {
      await this.runner({
        cwd: input.repositoryRoot,
        args: ["push", "--porcelain", input.remoteUrl, `${input.headSha}:refs/heads/${input.headBranch}`],
        env: environment
      });
    } catch {
      const reconciled = await this.readRemoteSha(input, environment);
      if (reconciled === input.headSha) return pushResult(input, false);
      throw new Error("Live Git push failed; the token and Git output were redacted. Retry with the same plan evidence.");
    }

    const pushed = await this.readRemoteSha(input, environment);
    if (pushed !== input.headSha) throw new Error("Live Git push did not produce the expected exact branch SHA.");
    return pushResult(input, true);
  }

  private async readRemoteSha(input: LiveGitPushInput, env: Record<string, string>): Promise<string | undefined> {
    let result: LiveGitResult;
    try {
      result = await this.runner({
        cwd: input.repositoryRoot,
        args: ["ls-remote", "--heads", input.remoteUrl, `refs/heads/${input.headBranch}`],
        env
      });
    } catch {
      throw new Error("Live Git remote preflight failed; credential and Git output were redacted.");
    }
    const line = result.stdout.trim();
    if (!line) return undefined;
    const [sha, ref, ...extra] = line.split(/\s+/);
    if (extra.length > 0 || !sha || ref !== `refs/heads/${input.headBranch}` || !/^[a-f0-9]{40}$/i.test(sha)) {
      throw new Error("Live Git remote returned an ambiguous branch identity.");
    }
    return sha;
  }
}

function validatePushInput(input: LiveGitPushInput): void {
  const remoteRepository = parseHttpsGitHubRepository(input.remoteUrl);
  if (remoteRepository !== input.repository) {
    throw new Error("Live Git remote does not exactly match the repository allowlist.");
  }
  if (input.headBranch === input.baseBranch || !input.headBranch.startsWith("gh-polish/live/")) {
    throw new Error("Live Git push requires a deterministic non-default branch.");
  }
  if (!/^[a-f0-9]{40}$/i.test(input.headSha)) throw new Error("Live Git push requires an exact commit SHA.");
}

function validatePushAuthorization(authorization: LiveMutationAuthorization, input: LiveGitPushInput): void {
  if (input.repository !== authorization.repository) {
    throw new Error("Live Git push repository is not bound to the live authorization.");
  }
  if (
    input.baseBranch !== authorization.baseBranch ||
    input.headBranch !== authorization.headBranch
  ) {
    throw new Error("Live Git push branch is not bound to the live authorization.");
  }
}

function parseHttpsGitHubRepository(remoteUrl: string): string {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(remoteUrl);
  if (!match?.[1] || !match[2]) throw new Error("Live Git remote must be an exact HTTPS GitHub repository URL.");
  return `${match[1]}/${match[2]}`;
}

function gitEnvironment(credential: LiveGitHubCredential): Record<string, string> {
  return {
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "Never",
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.extraHeader",
    GIT_CONFIG_VALUE_0: `Authorization: ${credential.authorizationHeader()}`
  };
}

function pushResult(input: LiveGitPushInput, created: boolean): LiveGitPushResult {
  return { branch: input.headBranch, sha: input.headSha, created };
}

const runGit: LiveGitRunner = (invocation) => new Promise((resolve, reject) => {
  const env: NodeJS.ProcessEnv = { ...process.env, ...invocation.env };
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;
  execFile("git", [...invocation.args], {
    cwd: invocation.cwd,
    env,
    encoding: "utf8",
    windowsHide: true
  }, (error, stdout, stderr) => {
    if (error) {
      reject(new Error("Live Git command failed."));
      return;
    }
    resolve({ stdout, stderr });
  });
});
