import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCli } from "../src/cli.js";
import {
  GitHubLiveRepositoryAdapter,
  mapRepositoryPermissions,
  type LiveGitHubFetch
} from "../src/liveGitHubAdapter.js";
import {
  resolveLiveGitHubCredential,
  type LiveMutationAuthorization
} from "../src/liveGitHubAuthorization.js";
import {
  createLiveGitHubExecutor,
  parseRepositoryName
} from "../src/liveGitHubComposition.js";
import type { LiveGitInvocation, LiveGitRunner } from "../src/liveGitPushAdapter.js";
import type { LocalEffectExecutor } from "../src/localApply.js";

const TOKEN = "github_pat_NEVER_PERSIST_T023";
const DIGEST = "d".repeat(64);
const BASE_SHA = "b".repeat(40);
const HEAD_SHA = "a".repeat(40);

describe("T-023 live composition permissions mapping", () => {
  it("maps GitHub /repos permissions to fail-closed live permission levels", () => {
    assert.deepEqual(mapRepositoryPermissions({ push: true, pull: true }), {
      contents: "write",
      pullRequests: "write",
      actions: "write"
    });
    assert.deepEqual(mapRepositoryPermissions({ push: false, pull: true }), {
      contents: "read",
      pullRequests: "read",
      actions: "read"
    });
    assert.deepEqual(mapRepositoryPermissions({ push: false, pull: false }), {
      contents: "none",
      pullRequests: "none",
      actions: "none"
    });
    assert.deepEqual(mapRepositoryPermissions(undefined), {
      contents: "none",
      pullRequests: "none",
      actions: "none"
    });
    assert.deepEqual(mapRepositoryPermissions("invalid"), {
      contents: "none",
      pullRequests: "none",
      actions: "none"
    });
  });

  it("returns fetched permissions from repository preflight", async () => {
    const fetch = createSequencedFetch([
      jsonResponse(200, {
        id: 12345,
        full_name: "HaipingShi/gh-polish",
        default_branch: "main",
        permissions: { push: true, pull: true }
      }),
      jsonResponse(200, { object: { sha: BASE_SHA } })
    ]);
    const adapter = new GitHubLiveRepositoryAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      fetch: fetch.fetch,
      baseUrl: "https://mock.github.invalid"
    });

    const result = await adapter.preflightRepository({
      owner: "HaipingShi",
      repo: "gh-polish",
      expectedRepositoryId: 12345,
      expectedFullName: "HaipingShi/gh-polish",
      baseBranch: "main",
      baseSha: BASE_SHA
    });

    assert.deepEqual(result.permissions, { contents: "write", pullRequests: "write", actions: "write" });
  });
});

describe("T-023 repository name parsing", () => {
  it("accepts exact owner/name and rejects malformed values", () => {
    assert.deepEqual(parseRepositoryName("HaipingShi/gh-polish"), { owner: "HaipingShi", repo: "gh-polish" });
    for (const invalid of ["", "owner", "owner/", "/repo", "owner/repo/extra", "owner/..", "-owner/repo", "https://github.com/o/r"]) {
      assert.throws(() => parseRepositoryName(invalid), /owner\/name|repository/i, invalid);
    }
  });
});

describe("T-023 composed live executor", () => {
  it("delegates push to the token-scoped live push adapter with the exact commit SHA", async () => {
    const authorization = makeAuthorization();
    const base = makeRecordingBaseExecutor();
    const runner = createFakeGitRunner(authorization.headBranch, HEAD_SHA);
    const executor = createLiveGitHubExecutor({
      repositoryRoot: "/tmp/fixture",
      remoteUrl: "https://github.com/HaipingShi/gh-polish.git",
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization,
      runner: runner.runner,
      base: base.executor
    });

    await executor.createBranch(authorization.headBranch, "main", BASE_SHA);
    await executor.writeFile("CONTRIBUTING.md", "# Contributing\n");
    const sha = await executor.commit("plan-1");
    await executor.push(authorization.headBranch);

    assert.equal(sha, HEAD_SHA);
    assert.deepEqual(base.calls, ["createBranch", "writeFile", "commit"]);
    const commands = runner.invocations.map((invocation) => invocation.args[0]);
    assert.deepEqual(commands, ["ls-remote", "push", "ls-remote"]);
    const push = runner.invocations[1];
    assert.equal(push.args.includes(`${HEAD_SHA}:refs/heads/${authorization.headBranch}`), true);
    assert.equal(push.args.includes("https://github.com/HaipingShi/gh-polish.git"), true);
  });

  it("refuses to push without a commit SHA produced by this execution", async () => {
    const authorization = makeAuthorization();
    const runner = createFakeGitRunner(authorization.headBranch, HEAD_SHA);
    const executor = createLiveGitHubExecutor({
      repositoryRoot: "/tmp/fixture",
      remoteUrl: "https://github.com/HaipingShi/gh-polish.git",
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization,
      runner: runner.runner,
      base: makeRecordingBaseExecutor().executor
    });

    await assert.rejects(() => executor.push(authorization.headBranch), /commit SHA/i);
    assert.equal(runner.invocations.length, 0);
  });
});

describe("T-023 CLI ready command slice", () => {
  it("requires a known subcommand", async () => {
    const result = await runCli(["ready", "--json"], {});
    assert.equal(result.code, 2);
    assert.equal(JSON.parse(result.stdout).error.code, "READY_SUBCOMMAND_REQUIRED");
  });

  it("documents the ready workflow in usage output", async () => {
    const result = await runCli(["--help"]);
    assert.match(result.stdout, /ready prepare/);
    assert.match(result.stdout, /ready review/);
    assert.match(result.stdout, /ready execute/);
    assert.match(result.stdout, /--live/);
  });

  it("rejects unsupported prepare profiles fail-closed", async () => {
    const result = await runCli(["ready", "prepare", "--profile", "library", "--json"], {});
    assert.equal(result.code, 2);
    assert.equal(JSON.parse(result.stdout).error.code, "PROFILE_UNSUPPORTED");
  });

  it("requires --plan and --confirm for review and execute", async () => {
    const missingPlan = await runCli(["ready", "review", "--json"], {});
    assert.equal(JSON.parse(missingPlan.stdout).error.code, "PLAN_REFERENCE_REQUIRED");

    const missingConfirm = await runCli(["ready", "review", "--plan", "fixture", "--json"], {});
    assert.equal(JSON.parse(missingConfirm.stdout).error.code, "CONFIRMATION_REQUIRED");
  });

  it("fails execute closed without review token, live flag, allowlist, repo id, or credential", async () => {
    const baseArgs = ["ready", "execute", "--plan", "fixture", "--confirm", "contributing", "--json"];

    const missingToken = await runCli(baseArgs, {});
    assert.equal(JSON.parse(missingToken.stdout).error.code, "REVIEW_TOKEN_REQUIRED");

    const missingLive = await runCli([...baseArgs, "--review-token", "t"], {});
    assert.equal(JSON.parse(missingLive.stdout).error.code, "LIVE_FLAG_REQUIRED");

    const missingRepo = await runCli([...baseArgs, "--review-token", "t", "--live"], {});
    assert.equal(JSON.parse(missingRepo.stdout).error.code, "REPOSITORY_ALLOWLIST_REQUIRED");

    const missingRepoId = await runCli([...baseArgs, "--review-token", "t", "--live", "--repo", "HaipingShi/gh-polish"], {});
    assert.equal(JSON.parse(missingRepoId.stdout).error.code, "REPOSITORY_ID_REQUIRED");

    const missingCredential = await runCli(
      [...baseArgs, "--review-token", "t", "--live", "--repo", "HaipingShi/gh-polish", "--repo-id", "12345"],
      {}
    );
    assert.equal(missingCredential.code, 2);
    assert.match(JSON.parse(missingCredential.stdout).error.message, /GH_TOKEN/);
  });

  it("prepares and reviews a Repository Ready plan end to end without credentials", async () => {
    const fixture = createGitFixture();
    try {
      const prepared = await runCli(["ready", "prepare", "--json"], {}, {
        cwd: fixture.root,
        planStore: fixture.store,
        now: () => new Date("2026-07-14T09:00:00Z")
      });
      assert.equal(prepared.code, 0);
      const prepareEnvelope = JSON.parse(prepared.stdout) as {
        command: string;
        ok: boolean;
        data: {
          mutation: string;
          plan: { id: string; reference: string; confirmations: string[]; items: Array<{ id: string; action: string; path: string }> };
        };
      };
      assert.equal(prepareEnvelope.command, "ready.prepare");
      assert.equal(prepareEnvelope.ok, true);
      assert.equal(prepareEnvelope.data.mutation, "plan-store-write");
      const items = prepareEnvelope.data.plan.items;
      assert.equal(items.find((item) => item.id === "readme")?.action, "manual_review");
      assert.equal(items.find((item) => item.id === "contributing")?.action, "create");
      assert.equal(items.find((item) => item.id === "pr-template")?.action, "create");
      assert.deepEqual(prepareEnvelope.data.plan.confirmations.slice().sort(), ["contributing", "gitignore", "pr-template"]);

      const confirmArgs = prepareEnvelope.data.plan.confirmations.flatMap((id) => ["--confirm", id]);
      const reviewed = await runCli(
        ["ready", "review", "--plan", prepareEnvelope.data.plan.reference, ...confirmArgs, "--json"],
        {},
        { cwd: fixture.root, planStore: fixture.store }
      );
      assert.equal(reviewed.code, 0);
      const reviewEnvelope = JSON.parse(reviewed.stdout) as {
        command: string;
        data: { mutation: string; review: { token: string; impacts: Array<{ path: string }> } };
      };
      assert.equal(reviewEnvelope.command, "ready.review");
      assert.equal(reviewEnvelope.data.mutation, "none");
      assert.match(reviewEnvelope.data.review.token, /^[a-f0-9]{64}$/);
      assert.deepEqual(
        reviewEnvelope.data.review.impacts.map((impact) => impact.path).sort(),
        [".github/pull_request_template.md", ".gitignore", "CONTRIBUTING.md"]
      );

      const wrongConfirm = await runCli(
        ["ready", "review", "--plan", prepareEnvelope.data.plan.reference, "--confirm", "not-a-real-effect", "--json"],
        {},
        { cwd: fixture.root, planStore: fixture.store }
      );
      assert.equal(wrongConfirm.code, 2);
    } finally {
      fixture.cleanup();
    }
  });
});

function makeAuthorization(): LiveMutationAuthorization {
  return Object.freeze({
    repositoryId: 12345,
    repository: "HaipingShi/gh-polish",
    baseBranch: "main",
    baseSha: BASE_SHA,
    planDigest: DIGEST,
    headBranch: `gh-polish/live/${DIGEST.slice(0, 12)}`,
    effectIds: Object.freeze(["contributing", "pr-template"]) as readonly string[]
  });
}

function makeRecordingBaseExecutor(): { executor: LocalEffectExecutor; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    executor: {
      async createBranch() {
        calls.push("createBranch");
      },
      async writeFile() {
        calls.push("writeFile");
      },
      async commit() {
        calls.push("commit");
        return HEAD_SHA;
      },
      async push() {
        calls.push("basePush");
        throw new Error("The base local push must never run for live execution.");
      }
    }
  };
}

function createFakeGitRunner(headBranch: string, pushedSha: string): {
  runner: LiveGitRunner;
  invocations: LiveGitInvocation[];
} {
  const invocations: LiveGitInvocation[] = [];
  let remoteSha: string | undefined;
  const runner: LiveGitRunner = async (invocation) => {
    invocations.push(invocation);
    if (invocation.args[0] === "ls-remote") {
      return { stdout: remoteSha ? `${remoteSha}\trefs/heads/${headBranch}` : "", stderr: "" };
    }
    if (invocation.args[0] === "push") {
      remoteSha = pushedSha;
      return { stdout: "", stderr: "" };
    }
    throw new Error(`Unexpected git invocation: ${invocation.args.join(" ")}`);
  };
  return { runner, invocations };
}

function createSequencedFetch(responses: Array<Awaited<ReturnType<LiveGitHubFetch>>>): {
  fetch: LiveGitHubFetch;
  requests: string[];
} {
  const queue = [...responses];
  const requests: string[] = [];
  const fetch: LiveGitHubFetch = async (url) => {
    requests.push(url);
    const next = queue.shift();
    if (!next) throw new Error("Unexpected extra fetch request.");
    return next;
  };
  return { fetch, requests };
}

function jsonResponse(status: number, body: unknown): Awaited<ReturnType<LiveGitHubFetch>> {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: async () => body
  };
}

function createGitFixture(): { root: string; store: string; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "gh-polish-t023-repo-"));
  const store = mkdtempSync(join(tmpdir(), "gh-polish-t023-store-"));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  git("init", "--initial-branch=main");
  git("config", "user.name", "gh-polish test");
  git("config", "user.email", "gh-polish@example.invalid");
  writeFileSync(join(root, "README.md"), "# fixture\n");
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "fixture", scripts: { test: "node --test" } }, null, 2));
  git("add", ".");
  git("commit", "-m", "initial commit");
  return {
    root,
    store,
    cleanup: () => {
      rmSync(root, { recursive: true, force: true });
      rmSync(store, { recursive: true, force: true });
    }
  };
}
