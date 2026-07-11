import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLocalGitExecutor } from "../src/localGitExecutor.js";
import type { LocalEffectExecutor } from "../src/localApply.js";
import { analyzeLocalRepository } from "../src/localAnalyzer.js";
import { createPlanArtifact } from "../src/planArtifact.js";
import { createPolishPlan } from "../src/planner.js";
import { detectRepositoryContext } from "../src/repositoryContext.js";
import {
  executeArtifactRepositoryReadyPullRequest,
  executeRepositoryReadyPullRequest,
  type PullRequestAdapter,
  type PullRequestInput,
  type PullRequestResult,
  type RevisionCheckAdapter,
  type RepositoryReadyExecutionRequest
} from "../src/repositoryReadyExecution.js";
import type { RemoteVerificationEvidence, RemoteVerificationTarget } from "../src/remoteVerification.js";

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

class MockRevisionCheckAdapter implements RevisionCheckAdapter {
  readonly requests: RemoteVerificationTarget[] = [];
  status: RemoteVerificationEvidence["status"] = "success";
  failNext = false;

  async verify(target: RemoteVerificationTarget): Promise<RemoteVerificationEvidence> {
    this.requests.push(target);
    if (this.failNext) {
      this.failNext = false;
      throw new Error("mock checks unavailable");
    }
    return {
      ...target,
      status: this.status,
      matchedRuns: this.status === "missing" ? 0 : 1,
      runs: this.status === "missing" ? [] : [{
        id: 1,
        name: "ci",
        status: this.status === "pending" ? "in_progress" : "completed",
        conclusion: this.status === "success" ? "success" : this.status === "failure" ? "failure" : null,
        url: "mock://checks/1"
      }],
      nextStep: this.status === "success" ? "Checks passed." : "Resolve or wait for target checks."
    };
  }
}

describe("T-018 Repository Ready PR execution", () => {
  for (const kind of ["node", "generic"] as const) {
    it(`creates one plan-bound PR without changing the default branch for a ${kind} repository`, async () => {
      const fixture = createFixture(kind);
      const adapter = new MockPullRequestAdapter();
      const checks = new MockRevisionCheckAdapter();
      try {
        const initialMain = git(fixture.root, ["rev-parse", "main"]);
        const request = makeRequest(fixture.root, initialMain, kind);
        const first = await executeRepositoryReadyPullRequest(request, createLocalGitExecutor(fixture.root), adapter, checks);

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
          adapter,
          checks
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
    const checks = new MockRevisionCheckAdapter();
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
      }, createLocalGitExecutor(fixture.root), adapter, checks);

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
    const checks = new MockRevisionCheckAdapter();
    adapter.failNext = true;
    try {
      const request = makeRequest(fixture.root, git(fixture.root, ["rev-parse", "main"]), "node");
      const failed = await executeRepositoryReadyPullRequest(request, createLocalGitExecutor(fixture.root), adapter, checks);

      assert.equal(failed.status, "partial-failure");
      assert.equal(failed.local.status, "completed");
      assert.equal(failed.pullRequest.status, "failed");
      assert.match(failed.recovery.action, /retry/i);
      const commitCount = git(fixture.root, ["rev-list", "--count", request.branchName]);

      const recovered = await executeRepositoryReadyPullRequest(
        { ...request, previousEvidence: failed },
        createLocalGitExecutor(fixture.root),
        adapter,
        checks
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
    const checks = new MockRevisionCheckAdapter();
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

    const failed = await executeRepositoryReadyPullRequest(request, executor, adapter, checks);
    const recovered = await executeRepositoryReadyPullRequest({ ...request, previousEvidence: failed }, executor, adapter, checks);

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
    const checks = new MockRevisionCheckAdapter();
    try {
      const staleSha = git(fixture.root, ["rev-parse", "main"]);
      writeFileSync(join(fixture.root, "AFTER-PLAN.md"), "drift\n", "utf8");
      git(fixture.root, ["add", "AFTER-PLAN.md"]);
      git(fixture.root, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "drift"]);

      const result = await executeRepositoryReadyPullRequest(
        makeRequest(fixture.root, staleSha, "generic"),
        createLocalGitExecutor(fixture.root),
        adapter,
        checks
      );

      assert.equal(result.status, "partial-failure");
      assert.match(result.local.operations.at(-1)?.error ?? "", /no longer matches plan SHA/i);
      assert.equal(adapter.requests.length, 0);
    } finally {
      fixture.dispose();
    }
  });

  it("binds exact revision checks to a truthful merge decision", async () => {
    const fixture = createFixture("node");
    const adapter = new MockPullRequestAdapter();
    const checks = new MockRevisionCheckAdapter();
    checks.status = "pending";
    try {
      const request = makeRequest(fixture.root, git(fixture.root, ["rev-parse", "main"]), "node");
      const result = await executeRepositoryReadyPullRequest(request, createLocalGitExecutor(fixture.root), adapter, checks);

      assert.equal(result.status, "completed");
      assert.equal(result.checks.status, "pending");
      assert.equal(result.mergeDecision.status, "not-ready");
      assert.deepEqual(checks.requests, [{ planId: request.planId, branch: request.branchName, sha: result.pullRequest.headSha }]);
    } finally {
      fixture.dispose();
    }
  });

  it("retries failed check reads without duplicating the commit or PR", async () => {
    const fixture = createFixture("generic");
    const adapter = new MockPullRequestAdapter();
    const checks = new MockRevisionCheckAdapter();
    checks.failNext = true;
    try {
      const request = makeRequest(fixture.root, git(fixture.root, ["rev-parse", "main"]), "generic");
      const failed = await executeRepositoryReadyPullRequest(request, createLocalGitExecutor(fixture.root), adapter, checks);
      const commitCount = git(fixture.root, ["rev-list", "--count", request.branchName]);
      const recovered = await executeRepositoryReadyPullRequest(
        { ...request, previousEvidence: failed },
        createLocalGitExecutor(fixture.root),
        adapter,
        checks
      );

      assert.equal(failed.status, "partial-failure");
      assert.equal(failed.checks.status, "adapter-failure");
      assert.equal(recovered.status, "completed");
      assert.equal(recovered.checks.status, "success");
      assert.equal(recovered.mergeDecision.status, "ready-for-review");
      assert.equal(git(fixture.root, ["rev-list", "--count", request.branchName]), commitCount);
      assert.equal(adapter.pullRequests.size, 1);
      assert.equal(checks.requests.length, 2);
    } finally {
      fixture.dispose();
    }
  });

  it("executes only integrity-checked saved artifact effects", async () => {
    const fixture = createFixture("node");
    const adapter = new MockPullRequestAdapter();
    const checks = new MockRevisionCheckAdapter();
    try {
      const context = await detectRepositoryContext(fixture.root);
      const local = await analyzeLocalRepository(fixture.root);
      const plan = createPolishPlan(local, undefined, new Date("2026-07-11T00:00:00Z"));
      const content = "# Contributing from artifact\n";
      const artifact = await createPlanArtifact({
        context,
        local,
        plan,
        effects: [{
          operationId: "contributing",
          path: "CONTRIBUTING.md",
          content,
          contentSha256: createHash("sha256").update(content).digest("hex"),
          requiresConfirmation: true
        }],
        now: new Date("2026-07-11T00:00:00Z")
      });

      const result = await executeArtifactRepositoryReadyPullRequest(artifact, {
        branchName: "gh-polish/artifact-plan",
        confirmations: ["contributing"],
        pullRequest: { title: "Artifact plan", body: "Apply saved artifact" }
      }, createLocalGitExecutor(fixture.root), adapter, checks);

      assert.equal(result.status, "completed");
      assert.equal(result.planId, artifact.id);
      assert.equal(readFileSync(join(fixture.root, "CONTRIBUTING.md"), "utf8"), content);

      const tampered = structuredClone(artifact);
      tampered.effects[0].content = "tampered\n";
      await assert.rejects(() => executeArtifactRepositoryReadyPullRequest(tampered, {
        branchName: "gh-polish/tampered",
        confirmations: ["contributing"],
        pullRequest: { title: "Tampered", body: "must not run" }
      }, createLocalGitExecutor(fixture.root), adapter, checks), /digest/i);
      await assert.rejects(() => executeArtifactRepositoryReadyPullRequest({ ...artifact, effects: [] }, {
        branchName: "gh-polish/missing",
        confirmations: [],
        pullRequest: { title: "Missing", body: "must not run" }
      }, createLocalGitExecutor(fixture.root), adapter, checks), /digest|no executable/i);
      assert.equal(adapter.pullRequests.size, 1);
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
