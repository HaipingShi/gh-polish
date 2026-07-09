import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeRemoteRepository } from "../src/remoteAnalyzer.js";

describe("remote analyzer", () => {
  it("combines read adapter results with warnings", async () => {
    const adapter = {
      async getRepository() { return { ok: true as const, value: { fullName: "owner/repo" } }; },
      async getTopics() { return { ok: true as const, value: ["cli"] }; },
      async listWorkflows() { return { ok: false as const, warning: { kind: "forbidden" as const, message: "no actions" } }; },
      async listWorkflowRuns() { return { ok: true as const, value: [] }; },
      async listLabels() { return { ok: true as const, value: [] }; },
      async listMilestones() { return { ok: true as const, value: [] }; }
    };

    const analysis = await analyzeRemoteRepository(adapter, { owner: "owner", repo: "repo" }, new Date("2026-07-09T00:00:00Z"));

    assert.equal(analysis.checkedAt, "2026-07-09T00:00:00.000Z");
    assert.deepEqual(analysis.warnings, ["forbidden: no actions"]);
  });
});
