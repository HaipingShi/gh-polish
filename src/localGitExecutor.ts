import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve, dirname } from "node:path";
import { promisify } from "node:util";
import type { LocalEffectExecutor } from "./localApply.js";

const execFileAsync = promisify(execFile);

export function createLocalGitExecutor(root: string, remote = "origin"): LocalEffectExecutor {
  const written = new Set<string>();
  return {
    async createBranch(branch, base) {
      if (await branchExists(root, branch)) await runGit(root, ["checkout", branch]);
      else await runGit(root, ["checkout", "-b", branch, base]);
    },
    async writeFile(path, content) {
      const target = resolve(root, path);
      if (relative(root, target).startsWith("..")) throw new Error(`Refusing to write outside the test repository: ${path}`);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
      written.add(path);
    },
    async commit(planId) {
      await runGit(root, ["add", "--", ...written]);
      await runGit(root, ["-c", "user.name=gh-polish test", "-c", "user.email=gh-polish@example.invalid", "commit", "-m", `apply gh-polish plan ${planId}`]);
      const result = await runGit(root, ["rev-parse", "HEAD"]);
      return result.trim();
    },
    async push(branch) {
      await runGit(root, ["push", remote, branch]);
    }
  };
}

async function branchExists(root: string, branch: string): Promise<boolean> {
  try {
    await runGit(root, ["show-ref", "--verify", `refs/heads/${branch}`]);
    return true;
  } catch {
    return false;
  }
}

async function runGit(cwd: string, args: string[]): Promise<string> {
  const result = await execFileAsync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  return result.stdout;
}
