import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { executeLocalPlan, type LocalEffectExecutor } from "../src/localApply.js";

const operations = [
  { id: "readme", path: "README.md", content: "# updated\n", risk: "low" as const, requiresConfirmation: false },
  { id: "security", path: "SECURITY.md", content: "# security\n", risk: "medium" as const, requiresConfirmation: true }
];

describe("T-015 local apply lifecycle", () => {
  it("executes only confirmed operations on a non-default branch and records plan-bound evidence", async () => {
    const log: string[] = [];
    const evidence = await executeLocalPlan({
      planId: "plan-1",
      repositoryRoot: "/fixture",
      baseSha: "abc123",
      baseBranch: "main",
      branchName: "gh-polish/plan-1",
      operations,
      confirmations: ["security"]
    }, fakeExecutor(log));

    assert.equal(evidence.status, "completed");
    assert.deepEqual(evidence.operations.map((operation) => operation.status), ["executed", "executed"]);
    assert.equal(evidence.recovery.action, "Verify the pushed branch before creating a pull request.");
    assert.deepEqual(log, ["branch:gh-polish/plan-1:main", "write:README.md", "write:SECURITY.md", "commit:plan-1", "push:gh-polish/plan-1"]);
  });

  it("refuses default-branch, missing, and extra confirmations before effects", async () => {
    const log: string[] = [];
    await assert.rejects(() => executeLocalPlan({ planId: "p", repositoryRoot: "/fixture", baseSha: "sha", baseBranch: "main", branchName: "main", operations, confirmations: ["security"] }, fakeExecutor(log)), /default branch/);
    await assert.rejects(() => executeLocalPlan({ planId: "p", repositoryRoot: "/fixture", baseSha: "sha", baseBranch: "main", branchName: "branch", operations, confirmations: [] }, fakeExecutor(log)), /requires explicit confirmation/);
    await assert.rejects(() => executeLocalPlan({ planId: "p", repositoryRoot: "/fixture", baseSha: "sha", baseBranch: "main", branchName: "branch", operations, confirmations: ["security", "unknown"] }, fakeExecutor(log)), /not part of the plan/);
    assert.deepEqual(log, []);
  });

  it("records partial failure without false completion and supplies a retry recovery action", async () => {
    const executor = fakeExecutor([], "SECURITY.md");
    const evidence = await executeLocalPlan({ planId: "p", repositoryRoot: "/fixture", baseSha: "sha", baseBranch: "main", branchName: "branch", operations, confirmations: ["security"] }, executor);

    assert.equal(evidence.status, "partial-failure");
    assert.deepEqual(evidence.operations.map((operation) => operation.status), ["executed", "failed"]);
    assert.match(evidence.recovery.action, /Retry/);
  });

  it("skips previously completed operations during a retry", async () => {
    const log: string[] = [];
    const evidence = await executeLocalPlan({ planId: "p", repositoryRoot: "/fixture", baseSha: "sha", baseBranch: "main", branchName: "branch", operations, confirmations: ["security"], completedOperationIds: ["readme"] }, fakeExecutor(log));
    assert.deepEqual(evidence.operations.map((operation) => operation.status), ["skipped", "executed"]);
    assert.deepEqual(log, ["branch:branch:main", "write:SECURITY.md", "commit:p", "push:branch"]);
  });

  it("does not create a duplicate commit when every operation already completed", async () => {
    const log: string[] = [];
    const evidence = await executeLocalPlan({ planId: "p", repositoryRoot: "/fixture", baseSha: "sha", baseBranch: "main", branchName: "branch", operations, confirmations: ["security"], completedOperationIds: ["readme", "security"] }, fakeExecutor(log));
    assert.equal(evidence.status, "completed");
    assert.deepEqual(evidence.operations.map((operation) => operation.status), ["skipped", "skipped"]);
    assert.deepEqual(log, ["branch:branch:main"]);
  });
});

function fakeExecutor(log: string[], failPath?: string): LocalEffectExecutor {
  return {
    async createBranch(branch, base) { log.push(`branch:${branch}:${base}`); },
    async writeFile(path) {
      if (path === failPath) throw new Error("injected write failure");
      log.push(`write:${path}`);
    },
    async commit(planId) { log.push(`commit:${planId}`); return "commit-sha"; },
    async push(branch) { log.push(`push:${branch}`); }
  };
}
