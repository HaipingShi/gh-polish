import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPolishPlan, parsePlan, serializePlan } from "../src/planner.js";
import type { LocalAnalysis } from "../src/localAnalyzer.js";

const local: LocalAnalysis = {
  root: "/repo",
  stacks: ["node"],
  manifests: ["package.json"],
  files: {
    readme: false,
    license: false,
    gitignore: true,
    contributing: false,
    security: true,
    codeOfConduct: true,
    issueTemplates: false,
    pullRequestTemplate: false,
    workflows: [],
    dependabot: false,
    codeql: false
  },
  commands: { test: "npm test" }
};

describe("planner", () => {
  it("creates deterministic dry-run plan operations with policy metadata", () => {
    const plan = createPolishPlan(local, undefined, new Date("2026-07-09T00:00:00Z"));
    assert.equal(plan.id, "plan-2026-07-09T00-00-00-000Z");
    assert.equal(plan.operations.every((operation) => operation.verification && operation.evidence), true);
    assert.deepEqual(plan.operations.map((operation) => operation.id), [
      "ci",
      "codeql",
      "contributing",
      "dependabot",
      "issue-templates",
      "license",
      "pr-template",
      "readme"
    ]);
    assert.deepEqual(parsePlan(serializePlan(plan)), plan);
  });
});
