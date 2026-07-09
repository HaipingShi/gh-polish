import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { selectTemplate } from "../src/templateRegistry.js";

describe("template registry", () => {
  it("selects stack-aware templates and protects existing files", () => {
    const create = selectTemplate("ci", ["node"], new Set());
    assert.equal(create.action, "create");
    assert.match(create.template.render({ projectName: "demo", stack: "node", commands: { test: "npm test" } }), /setup-node/);

    const existing = selectTemplate("readme", ["generic"], new Set(["README.md"]));
    assert.equal(existing.action, "manual_review");
    assert.match(existing.reason, /must not be overwritten/);
  });
});
