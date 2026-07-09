import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCli } from "../src/cli.js";
import { assertRealGitHubMutationAllowed } from "../src/mutationGuard.js";

describe("gh-polish CLI skeleton", () => {
  it("prints help", () => {
    const result = runCli(["--help"]);

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Usage:/);
    assert.match(result.stdout, /inspect/);
    assert.equal(result.stderr, "");
  });

  it("fails unknown commands with a non-zero exit code", () => {
    const result = runCli(["wat"]);

    assert.equal(result.code, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Unknown command: wat/);
  });

  it("supports dry-run smoke paths for MVP commands", () => {
    for (const command of ["inspect", "plan", "apply", "monitor"]) {
      const args = command === "apply" ? [command, "--plan", "fixture", "--dry-run"] : [command, "--dry-run"];
      const result = runCli(args);

      assert.equal(result.code, 0);
      assert.match(result.stdout, new RegExp(`command: ${command}`));
      assert.match(result.stdout, /mutation: none/);
      assert.equal(result.stderr, "");
    }
  });

  it("blocks non-dry-run apply while mutation support is not implemented", () => {
    const result = runCli(["apply", "--plan", "fixture"], {});

    assert.equal(result.code, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Real GitHub mutation is disabled/);
  });

  it("keeps mutation guard closed by default", () => {
    assert.deepEqual(assertRealGitHubMutationAllowed({}), {
      allowed: false,
      reason: "Real GitHub mutation is disabled unless GH_POLISH_ALLOW_REAL_GITHUB_MUTATION=1 is set."
    });
  });
});
