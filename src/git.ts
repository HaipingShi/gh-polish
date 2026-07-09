import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitRunOptions {
  cwd: string;
}

export interface GitRunResult {
  stdout: string;
  stderr: string;
}

export type GitRunner = (args: readonly string[], options: GitRunOptions) => Promise<GitRunResult>;

export class GitCommandError extends Error {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode?: number;

  constructor(message: string, stdout = "", stderr = "", exitCode?: number) {
    super(message);
    this.name = "GitCommandError";
    this.stdout = stdout;
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

export const defaultGitRunner: GitRunner = async (args, options) => {
  try {
    const result = await execFileAsync("git", [...args], {
      cwd: options.cwd,
      encoding: "utf8",
      windowsHide: true
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      code?: number;
    };

    throw new GitCommandError(
      err.message,
      typeof err.stdout === "string" ? err.stdout : "",
      typeof err.stderr === "string" ? err.stderr : "",
      typeof err.code === "number" ? err.code : undefined
    );
  }
};
