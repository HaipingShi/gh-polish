import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  RepositoryContextError,
  detectRepositoryContext,
  parseGitHubRemoteUrl,
  parseGitHubRemotes
} from "../src/repositoryContext.js";
import { GitCommandError, type GitRunner } from "../src/git.js";

describe("repository context detection", () => {
  it("parses GitHub HTTPS and SSH remote URLs", () => {
    assert.deepEqual(parseGitHubRemoteUrl("https://github.com/owner/repo.git"), {
      owner: "owner",
      repo: "repo"
    });
    assert.deepEqual(parseGitHubRemoteUrl("git@github.com:owner/repo.git"), {
      owner: "owner",
      repo: "repo"
    });
    assert.deepEqual(parseGitHubRemoteUrl("ssh://git@github.com/owner/repo.git"), {
      owner: "owner",
      repo: "repo"
    });
    assert.equal(parseGitHubRemoteUrl("https://example.com/owner/repo.git"), undefined);
  });

  it("deduplicates fetch remotes and ignores non-GitHub remotes", () => {
    const remotes = parseGitHubRemotes([
      "origin\thttps://github.com/owner/repo.git (fetch)",
      "origin\thttps://github.com/owner/repo.git (push)",
      "backup\tgit@github.com:other/project.git (fetch)",
      "local\tfile:///tmp/repo.git (fetch)"
    ].join("\n"));

    assert.deepEqual(remotes, [
      {
        name: "backup",
        url: "git@github.com:other/project.git",
        owner: "other",
        repo: "project"
      },
      {
        name: "origin",
        url: "https://github.com/owner/repo.git",
        owner: "owner",
        repo: "repo"
      }
    ]);
  });

  it("builds context from injected git output", async () => {
    const outputs = new Map<string, string>([
      ["rev-parse --show-toplevel", "/work/repo\n"],
      ["branch --show-current", "main\n"],
      ["symbolic-ref --short refs/remotes/origin/HEAD", "origin/main\n"],
      ["status --porcelain", " M README.md\n"],
      ["remote -v", "origin\thttps://github.com/owner/repo.git (fetch)\norigin\thttps://github.com/owner/repo.git (push)\n"]
    ]);
    const runner: GitRunner = async (args) => ({ stdout: outputs.get(args.join(" ")) ?? "", stderr: "" });

    const context = await detectRepositoryContext("/work/repo", runner);

    assert.deepEqual(context, {
      root: "/work/repo",
      currentBranch: "main",
      defaultBranch: "main",
      dirty: true,
      remotes: [
        {
          name: "origin",
          url: "https://github.com/owner/repo.git",
          owner: "owner",
          repo: "repo"
        }
      ]
    });
  });

  it("reports a clear error outside a git repository", async () => {
    const runner: GitRunner = async () => {
      throw new GitCommandError("fatal", "", "fatal: not a git repository", 128);
    };

    await assert.rejects(() => detectRepositoryContext("/tmp/outside", runner), {
      name: "RepositoryContextError",
      message: "Not inside a git repository."
    } satisfies Partial<RepositoryContextError>);
  });

  it("smoke-tests a temporary git repository without network access", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gh-polish-context-"));
    try {
      execFileSync("git", ["init"], { cwd: dir, stdio: "ignore", windowsHide: true });
      execFileSync("git", ["remote", "add", "origin", "git@github.com:owner/repo.git"], {
        cwd: dir,
        stdio: "ignore",
        windowsHide: true
      });
      writeFileSync(join(dir, "README.md"), "# fixture\n", "utf8");

      const context = await detectRepositoryContext(dir);

      assert.equal(context.root.replace(/\\/g, "/"), dir.replace(/\\/g, "/"));
      assert.equal(context.dirty, true);
      assert.deepEqual(context.remotes, [
        {
          name: "origin",
          url: "git@github.com:owner/repo.git",
          owner: "owner",
          repo: "repo"
        }
      ]);
      assert.match(context.defaultBranch, /^(main|master)$/);
      assert.match(context.currentBranch, /^(main|master)$/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
