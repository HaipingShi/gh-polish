import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeLocalRepository } from "../src/localAnalyzer.js";
import { executeArtifactLocalPlan, type LocalEffectExecutor } from "../src/localApply.js";
import { createPlanArtifact } from "../src/planArtifact.js";
import { createPolishPlan } from "../src/planner.js";
import { detectRepositoryContext } from "../src/repositoryContext.js";

describe("T-015 artifact-bound local apply", () => {
  it("executes only immutable saved effects and rejects missing or tampered payloads", async () => {
    const root = fixture();
    try {
      const context = await detectRepositoryContext(root);
      const local = await analyzeLocalRepository(root);
      const plan = createPolishPlan(local, undefined, new Date("2026-07-11T00:00:00Z"));
      const content = "# license\n";
      const artifact = await createPlanArtifact({
        context,
        local,
        plan,
        effects: [{ operationId: "license", path: "LICENSE", content, contentSha256: hash(content), requiresConfirmation: false }],
        now: new Date("2026-07-11T00:00:00Z")
      });
      const log: string[] = [];
      const result = await executeArtifactLocalPlan(artifact, "gh-polish/plan", [], executor(log));
      assert.equal(result.status, "completed");
      assert.deepEqual(log, ["branch", "LICENSE", "commit", "push"]);

      await assert.rejects(() => executeArtifactLocalPlan({ ...artifact, effects: [] }, "branch", [], executor([])), /digest/);
      artifact.effects[0].content = "tampered";
      await assert.rejects(() => executeArtifactLocalPlan(artifact, "branch", [], executor([])), /digest/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "gh-polish-t015-artifact-"));
  git(root, ["init", "-b", "main"]); writeFileSync(join(root, "README.md"), "# fixture\n"); git(root, ["add", "."]); git(root, ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-m", "init"]); return root;
}
function git(cwd: string, args: string[]): string { return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true }).trim(); }
function hash(content: string): string { return createHash("sha256").update(content).digest("hex"); }
function executor(log: string[]): LocalEffectExecutor { return { async createBranch() { log.push("branch"); }, async writeFile(path) { log.push(path); }, async commit() { log.push("commit"); return "sha"; }, async push() { log.push("push"); } }; }
