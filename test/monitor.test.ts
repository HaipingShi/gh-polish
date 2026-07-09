import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { monitorWorkflowRuns } from "../src/monitor.js";

describe("monitor", () => {
  it("summarizes success, failure, pending, missing, and degraded reads", async () => {
    assert.equal((await monitorWorkflowRuns({ async listWorkflowRuns() { return { ok: true, value: [] }; } }, { owner: "o", repo: "r" })).status, "missing");
    assert.equal((await monitorWorkflowRuns({ async listWorkflowRuns() { return { ok: true, value: [{ status: "queued", conclusion: null }] }; } }, { owner: "o", repo: "r" })).status, "pending");
    assert.equal((await monitorWorkflowRuns({ async listWorkflowRuns() { return { ok: true, value: [{ name: "CI", status: "completed", conclusion: "success" }] }; } }, { owner: "o", repo: "r" })).status, "success");
    const failed = await monitorWorkflowRuns({ async listWorkflowRuns() { return { ok: true, value: [{ name: "CI", status: "completed", conclusion: "failure", htmlUrl: "url" }] }; } }, { owner: "o", repo: "r" });
    assert.equal(failed.status, "failure");
    assert.deepEqual(failed.failures, [{ name: "CI", url: "url" }]);
    assert.equal((await monitorWorkflowRuns({ async listWorkflowRuns() { return { ok: false, warning: { kind: "forbidden", message: "nope" } }; } }, { owner: "o", repo: "r" })).status, "unknown");
  });
});
