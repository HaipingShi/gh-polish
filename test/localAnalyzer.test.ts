import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeLocalRepository } from "../src/localAnalyzer.js";

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "gh-polish-local-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, content, "utf8");
  }
  return root;
}

describe("local analyzer", () => {
  it("detects Node hygiene, workflows, manifests, and commands", async () => {
    const root = fixture({
      "package.json": JSON.stringify({ scripts: { test: "node --test", lint: "tsc --noEmit", build: "tsc" } }),
      "README.md": "# demo\n",
      ".gitignore": "node_modules/\n",
      ".github/workflows/ci.yml": "name: CI\n",
      ".github/dependabot.yml": "version: 2\n",
      ".github/ISSUE_TEMPLATE/bug.yml": "name: Bug\n",
      ".github/pull_request_template.md": "## Summary\n"
    });
    try {
      const analysis = await analyzeLocalRepository(root);
      assert.deepEqual(analysis.stacks, ["node"]);
      assert.deepEqual(analysis.manifests, ["package.json"]);
      assert.equal(analysis.files.readme, true);
      assert.equal(analysis.files.gitignore, true);
      assert.equal(analysis.files.issueTemplates, true);
      assert.equal(analysis.files.pullRequestTemplate, true);
      assert.deepEqual(analysis.files.workflows, [".github/workflows/ci.yml"]);
      assert.equal(analysis.files.dependabot, true);
      assert.deepEqual(analysis.commands, { test: "npm test", lint: "npm run lint", build: "npm run build" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("detects Python, Go, Rust, and generic stacks deterministically", async () => {
    const py = fixture({ "pyproject.toml": "[project]\nname='demo'\n" });
    const go = fixture({ "go.mod": "module demo\n" });
    const rust = fixture({ "Cargo.toml": "[package]\nname='demo'\n" });
    const generic = fixture({});
    try {
      assert.deepEqual((await analyzeLocalRepository(py)).stacks, ["python"]);
      assert.deepEqual((await analyzeLocalRepository(go)).commands, { test: "go test ./...", build: "go build ./..." });
      assert.deepEqual((await analyzeLocalRepository(rust)).commands, { test: "cargo test", build: "cargo build" });
      assert.deepEqual((await analyzeLocalRepository(generic)).stacks, ["generic"]);
    } finally {
      for (const root of [py, go, rust, generic]) rmSync(root, { recursive: true, force: true });
    }
  });
});
