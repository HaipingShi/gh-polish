import { execFile } from "node:child_process";

export type RepositoryVersionRelation =
  | "synchronized"
  | "local-ahead"
  | "local-behind"
  | "diverged"
  | "history-unavailable";

export interface RepositoryVersionGitInvocation {
  cwd: string;
  args: readonly string[];
}

export interface RepositoryVersionGitResult {
  stdout: string;
  stderr: string;
}

export interface RepositoryVersionGitRunner {
  (invocation: RepositoryVersionGitInvocation): Promise<RepositoryVersionGitResult>;
}

export interface DetectRemoteLocalVersionInput {
  repositoryRoot: string;
  expectedRepository: string;
  baseBranch: string;
  remoteSha: string;
  remoteName?: string;
  runner?: RepositoryVersionGitRunner;
}

export interface RepositoryVersionResult {
  repository: string;
  remoteName: string;
  branch: string;
  localSha: string;
  remoteSha: string;
  relation: RepositoryVersionRelation;
  aheadBy: number | null;
  behindBy: number | null;
  safeToExecute: boolean;
  nextAction: string;
}

const SHA_PATTERN = /^[a-f0-9]{40}$/i;

export async function detectRemoteLocalVersion(
  input: DetectRemoteLocalVersionInput
): Promise<RepositoryVersionResult> {
  validateInput(input);
  const runner = input.runner ?? runGit;
  const remoteName = input.remoteName ?? "origin";
  const remoteUrl = await readRequired(runner, input.repositoryRoot, ["remote", "get-url", remoteName], "remote URL");
  const repository = parseGitHubRepository(remoteUrl);
  if (repository !== input.expectedRepository) {
    throw new Error("Local Git remote does not match the expected repository identity.");
  }

  const branch = await readRequired(runner, input.repositoryRoot, ["branch", "--show-current"], "current branch");
  if (branch !== input.baseBranch) {
    throw new Error("Local Git branch does not match the expected base branch.");
  }

  const localSha = await readRequired(runner, input.repositoryRoot, ["rev-parse", "HEAD"], "local HEAD");
  if (!SHA_PATTERN.test(localSha)) throw new Error("Local Git HEAD is not an exact commit SHA.");
  const remoteSha = input.remoteSha.toLowerCase();
  const normalizedLocalSha = localSha.toLowerCase();
  if (normalizedLocalSha === remoteSha) {
    return result(input, remoteName, branch, normalizedLocalSha, remoteSha, "synchronized", 0, 0);
  }

  try {
    await runner({
      cwd: input.repositoryRoot,
      args: ["cat-file", "-e", `${remoteSha}^{commit}`]
    });
  } catch {
    return result(input, remoteName, branch, normalizedLocalSha, remoteSha, "history-unavailable", null, null);
  }

  const counts = await readRequired(
    runner,
    input.repositoryRoot,
    ["rev-list", "--left-right", "--count", `${normalizedLocalSha}...${remoteSha}`],
    "revision relationship"
  );
  const match = /^(\d+)\s+(\d+)$/.exec(counts);
  if (!match?.[1] || !match[2]) throw new Error("Git returned an invalid revision relationship.");
  const aheadBy = Number.parseInt(match[1], 10);
  const behindBy = Number.parseInt(match[2], 10);
  if (!Number.isSafeInteger(aheadBy) || !Number.isSafeInteger(behindBy)) {
    throw new Error("Git returned an invalid revision relationship.");
  }

  const relation: RepositoryVersionRelation = aheadBy === 0 && behindBy === 0
    ? "synchronized"
    : behindBy === 0
      ? "local-ahead"
      : aheadBy === 0
        ? "local-behind"
        : "diverged";
  return result(input, remoteName, branch, normalizedLocalSha, remoteSha, relation, aheadBy, behindBy);
}

function validateInput(input: DetectRemoteLocalVersionInput): void {
  if (!input.repositoryRoot.trim()) throw new Error("Repository root is required.");
  if (!/^[^/\s]+\/[^/\s]+$/.test(input.expectedRepository)) {
    throw new Error("Expected repository must use owner/name form.");
  }
  if (!input.baseBranch.trim()) throw new Error("Expected base branch is required.");
  if (!SHA_PATTERN.test(input.remoteSha)) throw new Error("Remote revision must be an exact commit SHA.");
  if (input.remoteName !== undefined && !/^[A-Za-z0-9._-]+$/.test(input.remoteName)) {
    throw new Error("Remote name is invalid.");
  }
}

async function readRequired(
  runner: RepositoryVersionGitRunner,
  cwd: string,
  args: readonly string[],
  label: string
): Promise<string> {
  let output: RepositoryVersionGitResult;
  try {
    output = await runner({ cwd, args });
  } catch {
    throw new Error(`Unable to read ${label} from local Git state.`);
  }
  const value = output.stdout.trim();
  if (!value || value.includes("\n") || value.includes("\r")) {
    throw new Error(`Local Git returned an ambiguous ${label}.`);
  }
  return value;
}

function parseGitHubRepository(remoteUrl: string): string {
  const https = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(remoteUrl);
  const ssh = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/.exec(remoteUrl);
  const match = https ?? ssh;
  if (!match?.[1] || !match[2]) {
    throw new Error("Local Git remote must be a canonical GitHub HTTPS or SSH URL.");
  }
  return `${match[1]}/${match[2]}`;
}

function result(
  input: DetectRemoteLocalVersionInput,
  remoteName: string,
  branch: string,
  localSha: string,
  remoteSha: string,
  relation: RepositoryVersionRelation,
  aheadBy: number | null,
  behindBy: number | null
): RepositoryVersionResult {
  const nextActions: Record<RepositoryVersionRelation, string> = {
    synchronized: "Local HEAD matches the reviewed remote revision.",
    "local-ahead": "Review local-only commits before preparing effects.",
    "local-behind": "Update the checkout in a separately authorized Git step, then detect again.",
    diverged: "Reconcile the diverged histories outside this read-only detector.",
    "history-unavailable": "Obtain remote history in a separately authorized read-only Git step, then detect again."
  };
  return {
    repository: input.expectedRepository,
    remoteName,
    branch,
    localSha,
    remoteSha,
    relation,
    aheadBy,
    behindBy,
    safeToExecute: relation === "synchronized",
    nextAction: nextActions[relation]
  };
}

const runGit: RepositoryVersionGitRunner = (invocation) => new Promise((resolve, reject) => {
  const env: NodeJS.ProcessEnv = { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "Never" };
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;
  execFile("git", [...invocation.args], {
    cwd: invocation.cwd,
    env,
    encoding: "utf8",
    windowsHide: true
  }, (error, stdout, stderr) => {
    if (error) {
      reject(new Error("Read-only Git command failed."));
      return;
    }
    resolve({ stdout, stderr });
  });
});
