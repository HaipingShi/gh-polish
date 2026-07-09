import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertRealGitHubMutationAllowed } from "../src/mutationGuard.js";

describe("verification harness", () => {
  it("keeps real GitHub mutation disabled by default", () => {
    assert.equal(assertRealGitHubMutationAllowed({}).allowed, false);
    assert.equal(assertRealGitHubMutationAllowed({ GH_POLISH_ALLOW_REAL_GITHUB_MUTATION: "1" }).allowed, true);
  });

  it("keeps the GitHub read adapter GET-only", () => {
    const source = readFileSync(join(process.cwd(), "src", "githubAdapter.ts"), "utf8");
    assert.match(source, /method: "GET"/);
    assert.doesNotMatch(source, /method: "(POST|PUT|PATCH|DELETE)"/);
    assert.doesNotMatch(source, /createPullRequest|updateRepository|replaceTopics/);
  });
});
