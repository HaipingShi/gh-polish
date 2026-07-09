import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyApprovedPlan, type ApplyClients } from "../src/applier.js";

function fakeClients(log: string[]): ApplyClients {
  return {
    git: {
      async createBranch(branch, base) { log.push(`branch:${branch}:${base}`); },
      async writeFile(path) { log.push(`write:${path}`); },
      async commit(message) { log.push(`commit:${message}`); },
      async push(branch) { log.push(`push:${branch}`); }
    },
    pullRequest: {
      async openPullRequest(input) {
        log.push(`pr:${input.branchName}:${input.baseBranch}`);
        return { url: "https://github.com/owner/repo/pull/1" };
      }
    },
    metadata: {
      async updateRepositoryMetadata() { log.push("metadata"); },
      async replaceTopics(topics) { log.push(`topics:${topics.join(",")}`); }
    }
  };
}

describe("applier", () => {
  it("dry-runs without mutation", async () => {
    const log: string[] = [];
    const evidence = await applyApprovedPlan({
      planId: "plan-1",
      branchName: "gh-polish/plan-1",
      baseBranch: "main",
      dryRun: true,
      confirmations: [],
      operations: [{ id: "readme", kind: "file", path: "README.md", content: "# demo\n", risk: "low", requiresConfirmation: false }]
    }, fakeClients(log), {});

    assert.equal(evidence.mutation, "none");
    assert.deepEqual(log, []);
  });

  it("refuses default branch, missing confirmations, and missing mutation env", async () => {
    const operation = { id: "metadata", kind: "metadata" as const, description: "demo", risk: "medium" as const, requiresConfirmation: true };
    await assert.rejects(() => applyApprovedPlan({ planId: "p", branchName: "main", baseBranch: "main", dryRun: true, confirmations: ["metadata"], operations: [operation] }, fakeClients([]), {}), /default branch/);
    await assert.rejects(() => applyApprovedPlan({ planId: "p", branchName: "b", baseBranch: "main", dryRun: true, confirmations: [], operations: [operation] }, fakeClients([]), {}), /requires explicit confirmation/);
    await assert.rejects(() => applyApprovedPlan({ planId: "p", branchName: "b", baseBranch: "main", dryRun: false, confirmations: ["metadata"], operations: [operation] }, fakeClients([]), {}), /Real GitHub mutation is disabled/);
  });

  it("executes approved branch and PR flow only when mutation env is explicit", async () => {
    const log: string[] = [];
    const evidence = await applyApprovedPlan({
      planId: "plan-1",
      branchName: "gh-polish/plan-1",
      baseBranch: "main",
      dryRun: false,
      confirmations: ["metadata", "topics"],
      operations: [
        { id: "readme", kind: "file", path: "README.md", content: "# demo\n", risk: "low", requiresConfirmation: false },
        { id: "metadata", kind: "metadata", description: "demo", risk: "medium", requiresConfirmation: true },
        { id: "topics", kind: "topics", topics: ["cli"], risk: "medium", requiresConfirmation: true }
      ]
    }, fakeClients(log), { GH_POLISH_ALLOW_REAL_GITHUB_MUTATION: "1" });

    assert.equal(evidence.pullRequestUrl, "https://github.com/owner/repo/pull/1");
    assert.deepEqual(log, [
      "branch:gh-polish/plan-1:main",
      "write:README.md",
      "metadata",
      "topics:cli",
      "commit:chore: apply gh-polish plan plan-1",
      "push:gh-polish/plan-1",
      "pr:gh-polish/plan-1:main"
    ]);
  });
});
