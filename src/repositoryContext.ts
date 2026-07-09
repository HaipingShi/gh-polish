import { GitCommandError, type GitRunner, defaultGitRunner } from "./git.js";

export interface GitHubRemote {
  name: string;
  url: string;
  owner: string;
  repo: string;
}

export interface RepositoryContext {
  root: string;
  currentBranch: string;
  defaultBranch: string;
  dirty: boolean;
  remotes: GitHubRemote[];
}

export class RepositoryContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryContextError";
  }
}

export async function detectRepositoryContext(
  cwd: string,
  runner: GitRunner = defaultGitRunner
): Promise<RepositoryContext> {
  const root = await runRequired(runner, ["rev-parse", "--show-toplevel"], cwd, "Not inside a git repository.");
  const currentBranch = await runRequired(runner, ["branch", "--show-current"], root, "Unable to read current branch.");
  const defaultBranch = await detectDefaultBranch(root, currentBranch, runner);
  const status = await runRequired(runner, ["status", "--porcelain"], root, "Unable to read git status.");
  const remoteLines = await runRequired(runner, ["remote", "-v"], root, "Unable to read git remotes.");

  return {
    root,
    currentBranch: currentBranch || "HEAD",
    defaultBranch,
    dirty: status.length > 0,
    remotes: parseGitHubRemotes(remoteLines)
  };
}

export function parseGitHubRemoteUrl(url: string): Omit<GitHubRemote, "name" | "url"> | undefined {
  const normalized = url.trim().replace(/\.git$/, "");

  const httpsMatch = normalized.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/i);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  const sshMatch = normalized.match(/^git@github\.com:([^/]+)\/([^/]+)$/i);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const sshUrlMatch = normalized.match(/^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+)$/i);
  if (sshUrlMatch) {
    return { owner: sshUrlMatch[1], repo: sshUrlMatch[2] };
  }

  return undefined;
}

export function parseGitHubRemotes(remoteOutput: string): GitHubRemote[] {
  const byName = new Map<string, GitHubRemote>();

  for (const line of remoteOutput.split(/\r?\n/)) {
    const match = line.trim().match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
    if (!match || match[3] !== "fetch") {
      continue;
    }

    const parsed = parseGitHubRemoteUrl(match[2]);
    if (!parsed) {
      continue;
    }

    byName.set(match[1], {
      name: match[1],
      url: match[2],
      owner: parsed.owner,
      repo: parsed.repo
    });
  }

  return [...byName.values()].sort((left, right) => left.name.localeCompare(right.name));
}

async function detectDefaultBranch(root: string, currentBranch: string, runner: GitRunner): Promise<string> {
  const remoteHead = await runOptional(runner, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], root);
  if (remoteHead) {
    return remoteHead.replace(/^origin\//, "");
  }

  return currentBranch || "HEAD";
}

async function runRequired(
  runner: GitRunner,
  args: readonly string[],
  cwd: string,
  failureMessage: string
): Promise<string> {
  try {
    const result = await runner(args, { cwd });
    return result.stdout.trim();
  } catch (error) {
    if (error instanceof GitCommandError && error.stderr.includes("not a git repository")) {
      throw new RepositoryContextError("Not inside a git repository.");
    }

    throw new RepositoryContextError(failureMessage);
  }
}

async function runOptional(runner: GitRunner, args: readonly string[], cwd: string): Promise<string | undefined> {
  try {
    const result = await runner(args, { cwd });
    const value = result.stdout.trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}
