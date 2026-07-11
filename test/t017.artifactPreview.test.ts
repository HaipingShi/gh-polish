import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { LocalAnalysis } from "../src/localAnalyzer.js";
import { createArtifactPreview } from "../src/artifactPreview.js";
import { repositoryProfiles, requirementsForProfile } from "../src/repositoryProfile.js";

describe("T-017 profile-aware Repository Ready preview", () => {
  it("defines explicit requirements for all six profiles", () => {
    assert.deepEqual(repositoryProfiles, ["public-project", "private-project", "demo", "library", "application", "commercial-product"]);
    for (const profile of repositoryProfiles) assert.equal(requirementsForProfile(profile).length > 0, true);
  });

  it("preserves existing content and renders only observed Node commands", () => {
    const preview = createArtifactPreview("public-project", nodeAnalysis(), new Set(["README.md"]), "demo");
    const readme = preview.items.find((item) => item.id === "readme");
    assert.equal(readme?.action, "manual_review");
    assert.equal(readme?.content, undefined);
    assert.equal(preview.commands.test, "npm test");
    assert.equal(preview.commands.evidence, "observed");
  });

  it("marks generic commands unknown instead of inventing them", () => {
    const local = nodeAnalysis();
    local.stacks = ["generic"];
    local.manifests = [];
    local.commands = {};
    const preview = createArtifactPreview("demo", local, new Set(), "demo");
    assert.equal(preview.commands.evidence, "unknown");
    assert.equal(preview.commands.test, undefined);
    assert.equal(preview.items.every((item) => !item.content?.includes("No test command detected")), true);
  });
});

function nodeAnalysis(): LocalAnalysis {
  return {
    root: "/fixture",
    stacks: ["node"],
    manifests: ["package.json"],
    files: { readme: true, license: false, gitignore: true, contributing: false, security: false, codeOfConduct: false, issueTemplates: false, pullRequestTemplate: false, workflows: [], dependabot: false, codeql: false },
    commands: { test: "npm test", lint: "npm run lint", build: "npm run build" }
  };
}
