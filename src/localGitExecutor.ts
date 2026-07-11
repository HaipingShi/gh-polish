import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve, dirname } from "node:path";
import { promisify } from "node:util";
import type { LocalEffectExecutor } from "./localApply.js";

const execFileAsync = promisify(execFile);

export function createLocalGitExecutor(root: string, remote = "origin"): LocalEffectExecutor {
  const written = new Set<string>();
  return {
    async createBranch(branch, base, expectedBaseSha) {
      if (expectedBaseSha) {
        const actualBaseSha = (await runGit(root, ["rev-parse", base])).trim();
        if (actualBaseSha !== expectedBaseSha) {
          throw new Error(`Base branch ${base} no longer matches plan SHA ${expectedBaseSha}.`);
        }
      }
      if (await branchExists(root, branch)) await runGit(root, ["checkout", branch]);
      else await runGit(root, ["checkout", "-b", branch, base]);
    },
    async writeFile(path, content) {
      const target = resolve(root, path);
      if (relative(root, target).startsWith("..")) throw new Error(`Refusing to write outside the test repository: ${path}`);
      const existing = await readExistingFile(target);
      if (existing !== undefined && existing !== content) {
        throw new Error(`Refusing to overwrite customized content: ${path}`);
      }
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
      written.add(path);
    },
    async commit(planId) {
      await runGit(root, ["add", "--", ...written]);
      const staged = await runGit(root, ["diff", "--cached", "--name-only", "--", ...written]);
      if (!staged.trim()) return (await runGit(root, ["rev-parse", "HEAD"])).trim();
      await runGit(root, ["-c", "user.name=gh-polish test", "-c", "user.email=gh-polish@example.invalid", "commit", "-m", `apply gh-polish plan ${planId}`]);
      const result = await runGit(root, ["rev-parse", "HEAD"]);
      return result.trim();
    },
    async push(branch) {
      await runGit(root, ["push", remote, branch]);
    }
  };
}

async function readExistingFile(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
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
