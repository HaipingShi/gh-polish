import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { GitHubWorkflowRun } from "../src/githubAdapter.js";
import { verifyRemoteRevision } from "../src/remoteVerification.js";

const ref = { owner: "owner", repo: "repo" };
const target = { planId: "plan-1", branch: "gh-polish/plan-1", sha: "target-sha" };

describe("T-016 remote revision verification", () => {
  it("uses only runs for the exact target branch and SHA", async () => {
    const result = await verifyRemoteRevision(adapter([
      run("CI", "completed", "failure", "main", "other-sha"),
      run("CI", "completed", "success", target.branch, target.sha)
    ]), ref, target);

    assert.equal(result.status, "success");
    assert.equal(result.matchedRuns, 1);
    assert.equal(result.planId, target.planId);
  });

  it("classifies pending, failure, and missing with one next action", async () => {
    const pending = await verifyRemoteRevision(adapter([run("CI", "queued", null, target.branch, target.sha)]), ref, target);
    assert.equal(pending.status, "pending");
    assert.match(pending.nextStep, /wait|verify/i);

    const failure = await verifyRemoteRevision(adapter([run("CI", "completed", "failure", target.branch, target.sha)]), ref, target);
    assert.equal(failure.status, "failure");
    assert.match(failure.nextStep, /inspect/i);

    const missing = await verifyRemoteRevision(adapter([run("CI", "completed", "success", "main", "other")]), ref, target);
    assert.equal(missing.status, "missing");
    assert.match(missing.nextStep, /confirm|wait/i);
  });

  it("reports permission-limited reads without claiming completion", async () => {
    const result = await verifyRemoteRevision({ async listWorkflowRuns() { return { ok: false as const, warning: { kind: "forbidden" as const, message: "no permission" } }; } }, ref, target);
    assert.equal(result.status, "permission-limited");
    assert.match(result.nextStep, /permission/i);
  });
});

function adapter(runs: GitHubWorkflowRun[]) {
  return { async listWorkflowRuns() { return { ok: true as const, value: runs }; } };
}

function run(name: string, status: string | null, conclusion: string | null, headBranch: string | null, headSha: string): GitHubWorkflowRun {
  return { id: Math.random(), name, status, conclusion, headBranch, headSha, htmlUrl: "https://example.test/run" };
}
