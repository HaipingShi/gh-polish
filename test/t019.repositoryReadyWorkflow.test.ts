import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeLocalRepository } from "../src/localAnalyzer.js";
import { createLocalGitExecutor } from "../src/localGitExecutor.js";
import { loadPlanArtifact } from "../src/planArtifact.js";
import type {
  PullRequestAdapter,
  PullRequestInput,
  PullRequestResult,
  RevisionCheckAdapter
} from "../src/repositoryReadyExecution.js";
import {
  executeSavedRepositoryReadyWorkflow,
  prepareRepositoryReadyWorkflow
} from "../src/repositoryReadyWorkflow.js";
import type { RemoteVerificationEvidence, RemoteVerificationTarget } from "../src/remoteVerification.js";
import { detectRepositoryContext } from "../src/repositoryContext.js";

class MockPullRequests implements PullRequestAdapter {
  readonly requests: PullRequestInput[] = [];
  private readonly created = new Map<string, PullRequestResult>();

  async ensurePullRequest(input: PullRequestInput): Promise<PullRequestResult> {
    this.requests.push(input);
    const key = `${input.planId}:${input.baseBranch}:${input.headBranch}:${input.headSha}`;
    const existing = this.created.get(key);
    if (existing) return { ...existing, created: false };
    const result = { id: "pr-1", url: "mock://pull/1", created: true };
    this.created.set(key, result);
    return result;
  }

  get size(): number {
    return this.created.size;
  }
}

class SuccessfulChecks implements RevisionCheckAdapter {
  readonly requests: RemoteVerificationTarget[] = [];

  async verify(target: RemoteVerificationTarget): Promise<RemoteVerificationEvidence> {
    this.requests.push(target);
    return {
      ...target,
      status: "success",
      matchedRuns: 1,
      runs: [{ id: 1, name: "ci", status: "completed", conclusion: "success", url: "mock://checks/1" }],
      nextStep: "Review the PR."
    };
  }
}

describe("T-019 credential-free Repository Ready workflow", () => {
  for (const kind of ["node", "generic"] as const) {
    it(`runs preview -> saved artifact -> branch -> PR -> checks for a ${kind} fixture`, async () => {
      const fixture = createFixture(kind);
      const pullRequests = new MockPullRequests();
      const checks = new SuccessfulChecks();
      try {
        const context = await detectRepositoryContext(fixture.root);
        const local = await analyzeLocalRepository(fixture.root);
        const prepared = await prepareRepositoryReadyWorkflow({
          profile: "library",
          context,
          local,
          existingPaths: new Set(["README.md"]),
          projectName: `${kind}-fixture`,
          planStore: fixture.store,
          now: new Date("2026-07-11T08:30:00Z")
        });
        const artifact = await loadPlanArtifact(prepared.artifactPath, fixture.store);

        assert.equal(prepared.preview.items.find((item) => item.id === "readme")?.action, "manual_review");
        assert.equal(prepared.preview.items.find((item) => item.id === "ci")?.action, kind === "node" ? "create" : "unknown");
        assert.deepEqual(artifact.effects.map((effect) => effect.operationId).sort(), prepared.confirmations.slice().sort());
        assert.equal(artifact.effects.every((effect) => effect.requiresConfirmation && effect.content.length > 0), true);
        assert.equal(artifact.effects.some((effect) => effect.operationId === "readme"), false);
        assert.equal(artifact.effects.some((effect) => effect.operationId === "ci"), kind === "node");
        assert.equal(prepared.artifactPath.startsWith(fixture.root), false);

        const mainSha = git(fixture.root, ["rev-parse", "main"]);
        const branchName = `gh-polish/t019-${kind}`;
        const first = await executeSavedRepositoryReadyWorkflow({
          artifactReference: prepared.artifactPath,
          planStore: fixture.store,
          branchName,
          confirmations: prepared.confirmations,
          pullRequest: { title: "Repository Ready", body: `Apply ${prepared.artifactId}` },
          now: new Date("2026-07-11T08:31:00Z")
        }, createLocalGitExecutor(fixture.root), pullRequests, checks);

        assert.equal(first.status, "completed");
        assert.equal(first.pullRequest.status, "created");
        assert.equal(first.checks.status, "success");
        assert.equal(first.mergeDecision.status, "ready-for-review");
        assert.equal(git(fixture.root, ["rev-parse", "main"]), mainSha);
        assert.equal(git(fixture.remote, ["rev-parse", `refs/heads/${branchName}`]), first.pullRequest.headSha);

        const commitCount = git(fixture.root, ["rev-list", "--count", branchName]);
        const retry = await executeSavedRepositoryReadyWorkflow({
          artifactReference: prepared.artifactId,
          planStore: fixture.store,
          branchName,
          confirmations: prepared.confirmations,
          pullRequest: { title: "Repository Ready", body: `Apply ${prepared.artifactId}` },
          previousEvidence: first,
          now: new Date("2026-07-11T08:31:00Z")
        }, createLocalGitExecutor(fixture.root), pullRequests, checks);

        assert.equal(retry.status, "completed");
        assert.equal(retry.pullRequest.status, "existing");
        assert.equal(git(fixture.root, ["rev-list", "--count", branchName]), commitCount);
        assert.equal(pullRequests.size, 1);
      } finally {
        fixture.dispose();
      }
    });
  }

  it("rejects missing confirmation and a tampered saved artifact before adapters", async () => {
    const fixture = createFixture("node");
    const pullRequests = new MockPullRequests();
    const checks = new SuccessfulChecks();
    try {
      const prepared = await prepareRepositoryReadyWorkflow({
        profile: "demo",
        context: await detectRepositoryContext(fixture.root),
        local: await analyzeLocalRepository(fixture.root),
        existingPaths: new Set(["README.md"]),
        projectName: "node-fixture",
        planStore: fixture.store,
        now: new Date("2026-07-11T08:30:00Z")
      });
      const request = {
        artifactReference: prepared.artifactPath,
        planStore: fixture.store,
        branchName: "gh-polish/t019-guard",
        confirmations: [] as string[],
        pullRequest: { title: "Guard", body: "Guard" },
        now: new Date("2026-07-11T08:31:00Z")
      };

      await assert.rejects(() => executeSavedRepositoryReadyWorkflow(
        request,
        createLocalGitExecutor(fixture.root),
        pullRequests,
        checks
      ), /confirmation/i);

      const saved = JSON.parse(readFileSync(prepared.artifactPath, "utf8")) as { effects: Array<{ content: string }> };
      saved.effects[0].content = "tampered\n";
      writeFileSync(prepared.artifactPath, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
      await assert.rejects(() => executeSavedRepositoryReadyWorkflow(
        { ...request, confirmations: prepared.confirmations },
        createLocalGitExecutor(fixture.root),
        pullRequests,
        checks
      ), /digest/i);
      assert.equal(pullRequests.requests.length, 0);
      assert.equal(checks.requests.length, 0);
    } finally {
      fixture.dispose();
    }
  });

  it("rejects repository content drift before local, PR, or check effects", async () => {
    const fixture = createFixture("node");
    const pullRequests = new MockPullRequests();
    const checks = new SuccessfulChecks();
    try {
      const context = await detectRepositoryContext(fixture.root);
      const local = await analyzeLocalRepository(fixture.root);
      await assert.rejects(() => prepareRepositoryReadyWorkflow({
        profile: "demo",
        context,
        local,
        existingPaths: new Set(["README.md"]),
        projectName: "node-fixture",
        planStore: join(fixture.root, ".plans"),
        now: new Date("2026-07-11T08:30:00Z")
      }), /outside/i);
      const prepared = await prepareRepositoryReadyWorkflow({
        profile: "demo",
        context,
        local,
        existingPaths: new Set(["README.md"]),
        projectName: "node-fixture",
        planStore: fixture.store,
        now: new Date("2026-07-11T08:30:00Z")
      });
      writeFileSync(join(fixture.root, "README.md"), "# uncommitted drift\n", "utf8");

      await assert.rejects(() => executeSavedRepositoryReadyWorkflow({
        artifactReference: prepared.artifactPath,
        planStore: fixture.store,
        branchName: "gh-polish/t019-stale",
        confirmations: prepared.confirmations,
        pullRequest: { title: "Stale", body: "must not execute" },
        now: new Date("2026-07-11T08:31:00Z")
      }, createLocalGitExecutor(fixture.root), pullRequests, checks), /stale|changed/i);
      assert.equal(pullRequests.requests.length, 0);
      assert.equal(checks.requests.length, 0);
    } finally {
      fixture.dispose();
    }
  });
});

function createFixture(kind: "node" | "generic"): { root: string; remote: string; store: string; dispose(): void } {
  const root = mkdtempSync(join(tmpdir(), `gh-polish-t019-${kind}-`));
  const remote = mkdtempSync(join(tmpdir(), "gh-polish-t019-remote-"));
  const store = mkdtempSync(join(tmpdir(), "gh-polish-t019-store-"));
  git(root, ["init", "-b", "main"]);
  writeFileSync(join(root, "README.md"), "# customized fixture\n", "utf8");
  if (kind === "node") {
    writeFileSync(join(root, "package.json"), "{\"name\":\"fixture\",\"scripts\":{\"test\":\"node --test\"}}\n", "utf8");
  }
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
