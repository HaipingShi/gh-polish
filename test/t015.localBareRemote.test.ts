import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLocalGitExecutor } from "../src/localGitExecutor.js";
import { executeLocalPlan } from "../src/localApply.js";

describe("T-015 local bare-remote integration", () => {
  for (const kind of ["node", "generic"] as const) {
    it(`pushes only a non-default branch for a ${kind} fixture`, async () => {
      const root = mkdtempSync(join(tmpdir(), `gh-polish-t015-${kind}-`));
      const remote = mkdtempSync(join(tmpdir(), "gh-polish-t015-remote-"));
      try {
        git(root, ["init", "-b", "main"]);
        writeFileSync(join(root, "README.md"), "# fixture\n", "utf8");
        if (kind === "node") writeFileSync(join(root, "package.json"), "{\"name\":\"fixture\"}\n", "utf8");
        git(root, ["add", "."]);
        git(root, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "initial"]);
        git(remote, ["init", "--bare"]);
        git(root, ["remote", "add", "origin", remote]);

        const evidence = await executeLocalPlan({
          planId: `plan-${kind}`,
          repositoryRoot: root,
          baseSha: git(root, ["rev-parse", "HEAD"]),
          baseBranch: "main",
          branchName: `gh-polish/plan-${kind}`,
          operations: [{ id: "security", path: "SECURITY.md", content: "# security\n", risk: "low", requiresConfirmation: false }],
          confirmations: []
        }, createLocalGitExecutor(root));

        assert.equal(evidence.status, "completed");
        assert.equal(readFileSync(join(root, "SECURITY.md"), "utf8"), "# security\n");
        assert.equal(git(root, ["rev-parse", "main"]), evidence.baseSha);
        assert.equal(git(remote, ["show-ref", "--verify", `refs/heads/gh-polish/plan-${kind}`]).length > 0, true);
        assert.throws(() => git(remote, ["show-ref", "--verify", "refs/heads/main"]));
      } finally {
        rmSync(root, { recursive: true, force: true });
        rmSync(remote, { recursive: true, force: true });
      }
    });
  }
});

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true }).trim();
}
