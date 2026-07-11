import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeLocalRepository } from "../src/localAnalyzer.js";
import { createLocalGitExecutor } from "../src/localGitExecutor.js";
import {
  executeAgentRepositoryReady,
  prepareAgentRepositoryReady,
  reviewAgentRepositoryReady
} from "../src/repositoryReadyAgentProtocol.js";
import type {
  PullRequestAdapter,
  PullRequestInput,
  PullRequestResult,
  RevisionCheckAdapter
} from "../src/repositoryReadyExecution.js";
import type { RemoteVerificationEvidence, RemoteVerificationTarget } from "../src/remoteVerification.js";
import { detectRepositoryContext } from "../src/repositoryContext.js";

class MockPullRequests implements PullRequestAdapter {
  readonly requests: PullRequestInput[] = [];
  private result?: PullRequestResult;

  async ensurePullRequest(input: PullRequestInput): Promise<PullRequestResult> {
    this.requests.push(input);
    if (this.result) return { ...this.result, created: false };
    this.result = { id: "pr-1", url: "mock://pull/1", created: true };
    return this.result;
  }
}

class MockChecks implements RevisionCheckAdapter {
  readonly requests: RemoteVerificationTarget[] = [];
  constructor(readonly status: RemoteVerificationEvidence["status"] = "success") {}

  async verify(target: RemoteVerificationTarget): Promise<RemoteVerificationEvidence> {
    this.requests.push(target);
    return {
      ...target,
      status: this.status,
      matchedRuns: 1,
      runs: [{
        id: 1,
        name: "ci",
        status: this.status === "pending" ? "in_progress" : "completed",
        conclusion: this.status === "success" ? "success" : null,
        url: "mock://checks/1"
      }],
      nextStep: this.status === "success" ? "Review the PR." : "Wait for checks."
    };
  }
}

describe("T-020 agent-facing Repository Ready protocol", () => {
  it("binds prepare, review, execute, and a truthful deferred-live M1 report", async () => {
    const fixture = createFixture();
    const pullRequests = new MockPullRequests();
    const checks = new MockChecks();
    try {
      const before = git(fixture.root, ["status", "--short"]);
      const prepared = await prepareAgentRepositoryReady({
        profile: "library",
        context: await detectRepositoryContext(fixture.root),
        local: await analyzeLocalRepository(fixture.root),
        existingPaths: new Set(["README.md"]),
        projectName: "agent-fixture",
        planStore: fixture.store,
        now: new Date("2026-07-11T08:45:00Z")
      });

      assert.equal(prepared.protocolVersion, "1");
      assert.equal(prepared.command, "repository-ready.prepare");
      assert.equal(prepared.phase, "awaiting-review");
      assert.deepEqual(prepared.effects, {
        inspectedRepository: "none",
        planStore: "write",
        liveGitHub: "none"
      });
      assert.equal(prepared.plan.confirmations.length > 0, true);
      assert.equal(prepared.plan.items.some((item) => item.action === "manual_review"), true);

      const reviewed = await reviewAgentRepositoryReady({
        artifactReference: prepared.plan.reference,
        planStore: fixture.store,
        confirmations: prepared.plan.confirmations
      });
      const reviewedAgain = await reviewAgentRepositoryReady({
        artifactReference: prepared.plan.id,
        planStore: fixture.store,
        confirmations: [...prepared.plan.confirmations].reverse()
      });

      assert.equal(reviewed.command, "repository-ready.review");
      assert.equal(reviewed.phase, "ready-to-execute");
      assert.equal(reviewed.review.token, reviewedAgain.review.token);
      assert.deepEqual(reviewed.effects, {
        inspectedRepository: "none",
        planStore: "none",
        liveGitHub: "none"
      });
      assert.equal(git(fixture.root, ["status", "--short"]), before);

      await assert.rejects(() => executeAgentRepositoryReady({
        artifactReference: prepared.plan.reference,
        planStore: fixture.store,
        branchName: "gh-polish/t020",
        confirmations: prepared.plan.confirmations,
        reviewToken: "invalid",
        pullRequest: { title: "Repository Ready", body: "Agent protocol" }
      }, createLocalGitExecutor(fixture.root), pullRequests, checks), /review token/i);
      assert.equal(pullRequests.requests.length, 0);
      assert.equal(checks.requests.length, 0);

      const completed = await executeAgentRepositoryReady({
        artifactReference: prepared.plan.reference,
        planStore: fixture.store,
        branchName: "gh-polish/t020",
        confirmations: prepared.plan.confirmations,
        reviewToken: reviewed.review.token,
        pullRequest: { title: "Repository Ready", body: "Agent protocol" }
      }, createLocalGitExecutor(fixture.root), pullRequests, checks);

      assert.equal(completed.command, "repository-ready.execute");
      assert.equal(completed.phase, "completed");
      assert.equal(completed.m1.credentialFree, "achieved");
      assert.equal(completed.m1.liveGitHub, "deferred");
      assert.equal(completed.m1.overall, "deferred");
      assert.match(completed.m1.reason, /live GitHub/i);
      assert.equal(completed.execution.mergeDecision.status, "ready-for-review");
      assert.deepEqual(completed.effects, {
        inspectedRepository: "non-default-branch",
        remote: "local-bare-remote",
        liveGitHub: "none",
        automaticMerge: "none"
      });
    } finally {
      fixture.dispose();
    }
  });

  it("requires exact confirmations and never reports pending checks as achieved", async () => {
    const fixture = createFixture();
    try {
      const prepared = await prepareAgentRepositoryReady({
        profile: "demo",
        context: await detectRepositoryContext(fixture.root),
        local: await analyzeLocalRepository(fixture.root),
        existingPaths: new Set(["README.md"]),
        projectName: "agent-fixture",
        planStore: fixture.store,
        now: new Date("2026-07-11T08:45:00Z")
      });
      await assert.rejects(() => reviewAgentRepositoryReady({
        artifactReference: prepared.plan.reference,
        planStore: fixture.store,
        confirmations: []
      }), /missing confirmation/i);
      await assert.rejects(() => reviewAgentRepositoryReady({
        artifactReference: prepared.plan.reference,
        planStore: fixture.store,
        confirmations: [...prepared.plan.confirmations, "not-in-plan"]
      }), /not part of the plan/i);
      const reviewed = await reviewAgentRepositoryReady({
        artifactReference: prepared.plan.reference,
        planStore: fixture.store,
        confirmations: prepared.plan.confirmations
      });
      const completed = await executeAgentRepositoryReady({
        artifactReference: prepared.plan.reference,
        planStore: fixture.store,
        branchName: "gh-polish/t020-pending",
        confirmations: prepared.plan.confirmations,
        reviewToken: reviewed.review.token,
        pullRequest: { title: "Repository Ready", body: "Pending checks" }
      }, createLocalGitExecutor(fixture.root), new MockPullRequests(), new MockChecks("pending"));

      assert.equal(completed.phase, "completed");
      assert.equal(completed.m1.credentialFree, "not-ready");
      assert.equal(completed.m1.liveGitHub, "deferred");
      assert.equal(completed.m1.overall, "not-ready");
      assert.equal(completed.execution.mergeDecision.status, "not-ready");
    } finally {
      fixture.dispose();
    }
  });
});

function createFixture(): { root: string; remote: string; store: string; dispose(): void } {
  const root = mkdtempSync(join(tmpdir(), "gh-polish-t020-root-"));
  const remote = mkdtempSync(join(tmpdir(), "gh-polish-t020-remote-"));
  const store = mkdtempSync(join(tmpdir(), "gh-polish-t020-store-"));
  git(root, ["init", "-b", "main"]);
  writeFileSync(join(root, "README.md"), "# customized fixture\n", "utf8");
  writeFileSync(join(root, "package.json"), "{\"name\":\"fixture\",\"scripts\":{\"test\":\"node --test\"}}\n", "utf8");
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "initial"]);
  git(remote, ["init", "--bare"]);
  git(root, ["remote", "add", "origin", remote]);
  return {
    root,
    remote,
    store,
    dispose() {
      rmSync(root, { recursive: true, force: true });
      rmSync(remote, { recursive: true, force: true });
      rmSync(store, { recursive: true, force: true });
    }
  };
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
