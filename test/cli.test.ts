import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCli } from "../src/cli.js";
import { assertRealGitHubMutationAllowed } from "../src/mutationGuard.js";

describe("gh-polish CLI skeleton", () => {
  it("emits the T-014 versioned JSON envelope for inspect", async () => {
    const result = await runCli(["inspect", "--json"]);

    assert.equal(result.code, 0);
    assert.equal(result.stderr, "");
    const envelope = JSON.parse(result.stdout) as { version: string; command: string; ok: boolean; data: { mutation: string } };
    assert.equal(envelope.version, "1");
    assert.equal(envelope.command, "inspect");
    assert.equal(envelope.ok, true);
    assert.equal(envelope.data.mutation, "none");
  });

  it("prints help", async () => {
    const result = await runCli(["--help"]);

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Usage:/);
    assert.match(result.stdout, /inspect/);
    assert.equal(result.stderr, "");
  });

  it("fails unknown commands with a non-zero exit code", async () => {
    const result = await runCli(["wat"]);

    assert.equal(result.code, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Unknown command: wat/);
  });

  it("returns a structured recovery error when apply omits its plan", async () => {
    const result = await runCli(["apply", "--dry-run", "--json"]);

    assert.equal(result.code, 2);
    assert.equal(result.stderr, "");
    assert.deepEqual(JSON.parse(result.stdout).error, {
      code: "PLAN_REFERENCE_REQUIRED",
      message: "Command 'apply' requires --plan <id-or-path>."
    });
  });

  it("blocks non-dry-run apply while mutation support is not implemented", async () => {
    const result = await runCli(["apply", "--plan", "fixture"], {});

    assert.equal(result.code, 2);
    assert.equal(result.stderr, "");
    assert.equal(JSON.parse(result.stdout).error.code, "DRY_RUN_REQUIRED");
  });

  it("keeps mutation guard closed by default", () => {
    assert.deepEqual(assertRealGitHubMutationAllowed({}), {
      allowed: false,
      reason: "Real GitHub mutation is disabled unless GH_POLISH_ALLOW_REAL_GITHUB_MUTATION=1 is set."
    });
  });
});
