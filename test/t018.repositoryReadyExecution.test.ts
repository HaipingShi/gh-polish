import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLocalGitExecutor } from "../src/localGitExecutor.js";
import type { LocalEffectExecutor } from "../src/localApply.js";
import {
  executeRepositoryReadyPullRequest,
  type PullRequestAdapter,
  type PullRequestInput,
  type PullRequestResult,
  type RepositoryReadyExecutionRequest
} from "../src/repositoryReadyExecution.js";

class MockPullRequestAdapter implements PullRequestAdapter {
  readonly requests: PullRequestInput[] = [];
  readonly pullRequests = new Map<string, PullRequestResult>();
  failNext = false;

  async ensurePullRequest(input: PullRequestInput): Promise<PullRequestResult> {
    this.requests.push(input);
    if (this.failNext) {
      this.failNext = false;
      throw new Error("mock PR service unavailable");
    }
    const key = `${input.repositoryRoot}:${input.planId}:${input.baseBranch}:${input.headBranch}`;
    const existing = this.pullRequests.get(key);
    if (existing) return { ...existing, created: false };
    const result = { id: `pr-${this.pullRequests.size + 1}`, url: `mock://pull/${this.pullRequests.size + 1}`, created: true };
    this.pullRequests.set(key, result);
    return result;
  }
}

describe("T-018 Repository Ready PR execution", () => {
  for (const kind of ["node", "generic"] as const) {
    it(`creates one plan-bound PR without changing the default branch for a ${kind} repository`, async () => {
      const fixture = createFixture(kind);
      const adapter = new MockPullRequestAdapter();
      try {
        const initialMain = git(fixture.root, ["rev-parse", "main"]);
        const request = makeRequest(fixture.root, initialMain, kind);
        const first = await executeRepositoryReadyPullRequest(request, createLocalGitExecutor(fixture.root), adapter);

        assert.equal(first.status, "completed");
        assert.equal(first.pullRequest.status, "created");
        assert.equal(first.pullRequest.headSha, git(fixture.remote, ["rev-parse", `refs/heads/${request.branchName}`]));
        assert.equal(git(fixture.root, ["rev-parse", "main"]), initialMain);
        assert.equal(readFileSync(join(fixture.root, "CONTRIBUTING.md"), "utf8"), `# Contributing to ${kind}\n`);
        assert.deepEqual(adapter.requests[0], {
          repositoryRoot: fixture.root,
          planId: request.planId,
          baseBranch: "main",
          headBranch: request.branchName,
          headSha: first.pullRequest.headSha,
          title: "Make repository ready",
          body: `Apply ${request.planId}`
        });

        const commitCount = git(fixture.root, ["rev-list", "--count", request.branchName]);
        const retry = await executeRepositoryReadyPullRequest(
          { ...request, previousEvidence: first },
          createLocalGitExecutor(fixture.root),
          adapter
        );

        assert.equal(retry.status, "completed");
        assert.equal(retry.pullRequest.status, "existing");
        assert.equal(git(fixture.root, ["rev-list", "--count", request.branchName]), commitCount);
        assert.equal(adapter.pullRequests.size, 1);
      } finally {
        fixture.dispose();
      }
    });
  }

  it("refuses to overwrite customized content before push or PR creation", async () => {
    const fixture = createFixture("generic");
    const adapter = new MockPullRequestAdapter();
    try {
      const mainSha = git(fixture.root, ["rev-parse", "main"]);
      const result = await executeRepositoryReadyPullRequest({
        ...makeRequest(fixture.root, mainSha, "generic"),
        operations: [{
          id: "readme",
          path: "README.md",
          content: "# replacement\n",
          risk: "low",
          requiresConfirmation: true
        }],
        confirmations: ["readme"]
      }, createLocalGitExecutor(fixture.root), adapter);

      assert.equal(result.status, "partial-failure");
      assert.match(result.local.operations.at(-1)?.error ?? "", /refusing to overwrite/i);
      assert.equal(adapter.requests.length, 0);
      assert.equal(readFileSync(join(fixture.root, "README.md"), "utf8"), "# fixture\n");
      assert.equal(git(fixture.root, ["rev-parse", "main"]), mainSha);
      assert.throws(() => git(fixture.remote, ["show-ref", "--verify", `refs/heads/${result.branchName}`]));
    } finally {
      fixture.dispose();
    }
  });

  it("recovers from PR failure without duplicating local effects or commits", async () => {
    const fixture = createFixture("node");
    const adapter = new MockPullRequestAdapter();
    adapter.failNext = true;
    try {
      const request = makeRequest(fixture.root, git(fixture.root, ["rev-parse", "main"]), "node");
      const failed = await executeRepositoryReadyPullRequest(request, createLocalGitExecutor(fixture.root), adapter);

      assert.equal(failed.status, "partial-failure");
      assert.equal(failed.local.status, "completed");
      assert.equal(failed.pullRequest.status, "failed");
      assert.match(failed.recovery.action, /retry/i);
      const commitCount = git(fixture.root, ["rev-list", "--count", request.branchName]);

      const recovered = await executeRepositoryReadyPullRequest(
        { ...request, previousEvidence: failed },
        createLocalGitExecutor(fixture.root),
        adapter
      );

      assert.equal(recovered.status, "completed");
      assert.equal(recovered.pullRequest.status, "created");
      assert.equal(git(fixture.root, ["rev-list", "--count", request.branchName]), commitCount);
      assert.equal(adapter.pullRequests.size, 1);
    } finally {
      fixture.dispose();
    }
  });

  it("retries only the failed local effect before creating one PR", async () => {
    const adapter = new MockPullRequestAdapter();
    const writes = new Map<string, number>();
    let failSecond = true;
    let commits = 0;
    let pushes = 0;
    const executor: LocalEffectExecutor = {
      async createBranch() {},
      async writeFile(path) {
        if (path === "SECOND.md" && failSecond) {
          failSecond = false;
          throw new Error("mock local write failure");
        }
        writes.set(path, (writes.get(path) ?? 0) + 1);
      },
      async commit() {
        commits += 1;
        return "a".repeat(40);
      },
      async push() {
        pushes += 1;
      }
    };
    const request: RepositoryReadyExecutionRequest = {
      planId: "plan-local-retry",
      repositoryRoot: "mock-repository",
      baseSha: "b".repeat(40),
      baseBranch: "main",
      branchName: "gh-polish/plan-local-retry",
      operations: [
        { id: "first", path: "FIRST.md", content: "first\n", risk: "low", requiresConfirmation: true },
        { id: "second", path: "SECOND.md", content: "second\n", risk: "low", requiresConfirmation: true }
      ],
      confirmations: ["first", "second"],
      pullRequest: { title: "Ready", body: "Apply plan-local-retry" }
    };

    const failed = await executeRepositoryReadyPullRequest(request, executor, adapter);
    const recovered = await executeRepositoryReadyPullRequest({ ...request, previousEvidence: failed }, executor, adapter);

    assert.equal(failed.status, "partial-failure");
    assert.equal(failed.pullRequest.status, "not-attempted");
    assert.equal(recovered.status, "completed");
    assert.equal(writes.get("FIRST.md"), 1);
    assert.equal(writes.get("SECOND.md"), 1);
    assert.equal(commits, 1);
    assert.equal(pushes, 1);
    assert.equal(adapter.pullRequests.size, 1);
  });

  it("refuses a stale base SHA before any effect or PR request", async () => {
    const fixture = createFixture("generic");
    const adapter = new MockPullRequestAdapter();
    try {
      const staleSha = git(fixture.root, ["rev-parse", "main"]);
      writeFileSync(join(fixture.root, "AFTER-PLAN.md"), "drift\n", "utf8");
      git(fixture.root, ["add", "AFTER-PLAN.md"]);
      git(fixture.root, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "drift"]);

      const result = await executeRepositoryReadyPullRequest(
        makeRequest(fixture.root, staleSha, "generic"),
        createLocalGitExecutor(fixture.root),
        adapter
      );

      assert.equal(result.status, "partial-failure");
      assert.match(result.local.operations.at(-1)?.error ?? "", /no longer matches plan SHA/i);
      assert.equal(adapter.requests.length, 0);
    } finally {
      fixture.dispose();
    }
  });
});

function makeRequest(root: string, baseSha: string, kind: "node" | "generic"): RepositoryReadyExecutionRequest {
  const planId = `plan-t018-${kind}`;
  return {
    planId,
    repositoryRoot: root,
    baseSha,
    baseBranch: "main",
    branchName: `gh-polish/${planId}`,
    operations: [{
      id: "contributing",
      path: "CONTRIBUTING.md",
      content: `# Contributing to ${kind}\n`,
      risk: "low",
      requiresConfirmation: true
    }],
    confirmations: ["contributing"],
    pullRequest: { title: "Make repository ready", body: `Apply ${planId}` }
  };
}

function createFixture(kind: "node" | "generic"): { root: string; remote: string; dispose(): void } {
  const root = mkdtempSync(join(tmpdir(), `gh-polish-t018-${kind}-`));
  const remote = mkdtempSync(join(tmpdir(), "gh-polish-t018-remote-"));
  git(root, ["init", "-b", "main"]);
  writeFileSync(join(root, "README.md"), "# fixture\n", "utf8");
  if (kind === "node") writeFileSync(join(root, "package.json"), "{\"name\":\"fixture\"}\n", "utf8");
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "initial"]);
  git(remote, ["init", "--bare"]);
  git(root, ["remote", "add", "origin", remote]);
  return {
    root,
    remote,
    dispose() {
      rmSync(root, { recursive: true, force: true });
      rmSync(remote, { recursive: true, force: true });
    }
  };
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
