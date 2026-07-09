import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyOperation } from "../src/policy.js";

describe("policy engine", () => {
  it("classifies reads, file changes, metadata, high-risk settings, and refused default branch mutation", () => {
    assert.deepEqual(classifyOperation({ surface: "metadata", mutation: false }).risk, "read");
    assert.deepEqual(classifyOperation({ surface: "file", mutation: true }), {
      risk: "low",
      requiresConfirmation: false,
      allowedInMvp: true,
      reason: "File change must be applied through a branch and PR."
    });
    assert.equal(classifyOperation({ surface: "topics", mutation: true }).requiresConfirmation, true);
    assert.equal(classifyOperation({ surface: "branch_ruleset", mutation: true }).allowedInMvp, false);
    assert.deepEqual(classifyOperation({ surface: "default_branch", mutation: true }), {
      risk: "refused",
      requiresConfirmation: true,
      allowedInMvp: false,
      reason: "Direct default-branch mutation is refused in MVP."
    });
  });
});
