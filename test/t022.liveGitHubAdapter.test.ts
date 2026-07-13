import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  authorizeLiveGitHubMutation,
  resolveLiveGitHubCredential,
  type LiveMutationAuthorization,
  type LiveMutationAuthorizationRequest
} from "../src/liveGitHubAuthorization.js";
import {
  GitHubLivePullRequestAdapter,
  GitHubLiveRepositoryAdapter,
  createPullRequestMarker,
  type LiveGitHubFetch,
  type LivePullRequestInput
} from "../src/liveGitHubAdapter.js";
import {
  GitHubLiveGitPushAdapter,
  type LiveGitInvocation,
  type LiveGitRunner
} from "../src/liveGitPushAdapter.js";
import {
  detectRemoteLocalVersion,
  type RepositoryVersionGitRunner
} from "../src/repositoryVersion.js";

const TOKEN = "github_pat_NEVER_PERSIST_T022";

describe("T-022 live GitHub adapter non-live contract", () => {
  it("accepts only GH_TOKEN or an explicit injected token and keeps the secret non-serializable", () => {
    const credential = resolveLiveGitHubCredential({ GH_TOKEN: TOKEN });

    assert.equal(credential.source, "GH_TOKEN");
    assert.equal(credential.authorizationHeader(), `Bearer ${TOKEN}`);
    assert.doesNotMatch(JSON.stringify(credential), new RegExp(TOKEN));
    assert.throws(
      () => resolveLiveGitHubCredential({ GITHUB_TOKEN: "ambient-token-must-not-work" }),
      /GH_TOKEN|credential/i
    );
    assert.throws(() => resolveLiveGitHubCredential({}), /GH_TOKEN|credential/i);
  });

  it("fails closed unless enable flag, exact allowlist, identity, base, permissions, review token, and effects agree", () => {
    const valid = makeAuthorizationRequest();
    const authorization = authorizeLiveGitHubMutation(valid);

    assert.equal(authorization.repositoryId, 12345);
    assert.equal(authorization.repository, "HaipingShi/coderail");
    assert.equal(authorization.headBranch, `gh-polish/live/${valid.planDigest.slice(0, 12)}`);

    const invalid: Array<[string, LiveMutationAuthorizationRequest, RegExp]> = [
      ["enable flag", { ...valid, enableMutation: false }, /enable/i],
      ["allowlist", { ...valid, allowlistedRepository: "HaipingShi/other" }, /allowlist/i],
      ["canonical name", { ...valid, fetchedRepository: { ...valid.fetchedRepository, fullName: "HaipingShi/other" } }, /identity|repository/i],
      ["numeric id", { ...valid, expectedRepositoryId: 999 }, /identity|repository/i],
      ["default branch", { ...valid, fetchedRepository: { ...valid.fetchedRepository, defaultBranch: "trunk" } }, /default branch|base/i],
      ["base SHA", { ...valid, fetchedRepository: { ...valid.fetchedRepository, baseSha: "c".repeat(40) } }, /base sha|stale/i],
      ["contents permission", { ...valid, fetchedRepository: { ...valid.fetchedRepository, permissions: { ...valid.fetchedRepository.permissions, contents: "read" } } }, /contents.*write|permission/i],
      ["pull request permission", { ...valid, fetchedRepository: { ...valid.fetchedRepository, permissions: { ...valid.fetchedRepository.permissions, pullRequests: "read" } } }, /pull requests.*write|permission/i],
      ["actions permission", { ...valid, fetchedRepository: { ...valid.fetchedRepository, permissions: { ...valid.fetchedRepository.permissions, actions: "none" } } }, /actions.*read|permission/i],
      ["review token", { ...valid, suppliedReviewToken: "wrong" }, /review token/i],
      ["exact effects", { ...valid, confirmedEffectIds: [] }, /effect|confirmation/i],
      ["forbidden workflow", { ...valid, effects: [{ id: "workflow", path: ".github/workflows/ci.yml", mode: "create" }] }, /forbidden|workflow|path/i]
    ];

    for (const [label, request, pattern] of invalid) {
      assert.throws(() => authorizeLiveGitHubMutation(request), pattern, label);
    }
  });

  it("reuses one exact matching draft PR and refuses mismatched or multiple candidates", async () => {
    const input = makePullRequestInput();
    const marker = createPullRequestMarker(input);
    const exact = pullRequest(7, input, marker);
    const exactFetch = createFetch([response(200, [exact])]);
    const adapter = new GitHubLivePullRequestAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization: makeAuthorization(),
      fetch: exactFetch.fetch,
      baseUrl: "https://mock.github.invalid"
    });

    assert.deepEqual(await adapter.ensureDraftPullRequest(input), {
      id: "7",
      url: "https://github.invalid/pull/7",
      created: false
    });
    assert.deepEqual(exactFetch.methods, ["GET"]);

    const mismatched = pullRequest(8, input, "<!-- gh-polish:other-plan -->");
    const conflictAdapter = new GitHubLivePullRequestAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization: makeAuthorization(),
      fetch: createFetch([response(200, [mismatched])]).fetch,
      baseUrl: "https://mock.github.invalid"
    });
    await assert.rejects(() => conflictAdapter.ensureDraftPullRequest(input), /conflict|marker/i);

    const multipleAdapter = new GitHubLivePullRequestAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization: makeAuthorization(),
      fetch: createFetch([response(200, [exact, { ...(exact as Record<string, unknown>), number: 9 }])]).fetch,
      baseUrl: "https://mock.github.invalid"
    });
    await assert.rejects(() => multipleAdapter.ensureDraftPullRequest(input), /multiple|conflict/i);
  });

  it("reconciles a 422 with read-after-write and retry never creates a duplicate PR", async () => {
    const input = makePullRequestInput();
    const exact = pullRequest(11, input, createPullRequestMarker(input));
    const mock = createFetch([
      response(200, []),
      response(422, { message: "Validation Failed" }),
      response(200, [exact]),
      response(200, [exact])
    ]);
    const adapter = new GitHubLivePullRequestAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization: makeAuthorization(),
      fetch: mock.fetch,
      baseUrl: "https://mock.github.invalid"
    });

    const first = await adapter.ensureDraftPullRequest(input);
    const retry = await adapter.ensureDraftPullRequest(input);

    assert.equal(first.created, false);
    assert.equal(retry.id, first.id);
    assert.equal(mock.methods.filter((method) => method === "POST").length, 1);
  });

  it("redacts the token from network and API failures", async () => {
    const networkAdapter = new GitHubLivePullRequestAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization: makeAuthorization(),
      fetch: async () => { throw new Error(`socket failed with ${TOKEN}`); },
      baseUrl: "https://mock.github.invalid"
    });
    const networkError = await captureError(() => networkAdapter.ensureDraftPullRequest(makePullRequestInput()));
    assert.doesNotMatch(networkError.message, new RegExp(TOKEN));
    assert.match(networkError.message, /network|request/i);

    const apiAdapter = new GitHubLivePullRequestAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization: makeAuthorization(),
      fetch: createFetch([response(403, { message: `denied ${TOKEN}` })]).fetch,
      baseUrl: "https://mock.github.invalid"
    });
    const apiError = await captureError(() => apiAdapter.ensureDraftPullRequest(makePullRequestInput()));
    assert.doesNotMatch(apiError.message, new RegExp(TOKEN));
    assert.match(apiError.message, /403|permission/i);
  });

  it("preflights canonical repository identity/base and reads checks only for the exact head SHA", async () => {
    const mock = createFetch([
      response(200, { id: 12345, full_name: "HaipingShi/coderail", default_branch: "main" }),
      response(200, { object: { sha: "b".repeat(40) } }),
      response(200, { workflow_runs: [
        workflowRun(1, "gh-polish/live/aaaaaaaaaaaa", "c".repeat(40), "completed", "success"),
        workflowRun(2, "gh-polish/live/aaaaaaaaaaaa", "d".repeat(40), "completed", "failure")
      ] })
    ]);
    const adapter = new GitHubLiveRepositoryAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      fetch: mock.fetch,
      baseUrl: "https://mock.github.invalid"
    });
    const repository = await adapter.preflightRepository({
      owner: "HaipingShi",
      repo: "coderail",
      expectedRepositoryId: 12345,
      expectedFullName: "HaipingShi/coderail",
      baseBranch: "main",
      baseSha: "b".repeat(40)
    });
    const checks = await adapter.verifyExactRevision({
      owner: "HaipingShi",
      repo: "coderail",
      planId: "plan-t022",
      branch: "gh-polish/live/aaaaaaaaaaaa",
      sha: "c".repeat(40)
    });

    assert.deepEqual(repository, {
      id: 12345,
      fullName: "HaipingShi/coderail",
      defaultBranch: "main",
      baseSha: "b".repeat(40)
    });
    assert.equal(checks.status, "success");
    assert.equal(checks.matchedRuns, 1);
    assert.deepEqual(mock.methods, ["GET", "GET", "GET"]);
  });

  it("pushes only the deterministic non-default branch and reuses its exact SHA on retry", async () => {
    const invocations: LiveGitInvocation[] = [];
    const branch = "gh-polish/live/aaaaaaaaaaaa";
    const headSha = "c".repeat(40);
    let remoteSha: string | undefined;
    const runner: LiveGitRunner = async (invocation) => {
      invocations.push(invocation);
      if (invocation.args[0] === "ls-remote") {
        return { stdout: remoteSha ? `${remoteSha}\trefs/heads/${branch}\n` : "", stderr: "" };
      }
      remoteSha = headSha;
      return { stdout: "pushed\n", stderr: "" };
    };
    const adapter = new GitHubLiveGitPushAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization: makeAuthorization(),
      runner
    });
    const input = {
      repositoryRoot: "test-owned-repository",
      repository: "HaipingShi/coderail",
      remoteUrl: "https://github.com/HaipingShi/coderail.git",
      baseBranch: "main",
      headBranch: branch,
      headSha
    };

    assert.equal((await adapter.ensurePushedBranch(input)).created, true);
    assert.equal((await adapter.ensurePushedBranch(input)).created, false);
    assert.equal(invocations.filter((call) => call.args[0] === "push").length, 1);
    assert.ok(invocations.every((call) => !call.args.join(" ").includes(TOKEN)));
    assert.ok(invocations.every((call) => call.env.GIT_TERMINAL_PROMPT === "0"));
    await assert.rejects(() => adapter.ensurePushedBranch({ ...input, headBranch: "main" }), /default|branch/i);
    await assert.rejects(() => adapter.ensurePushedBranch({ ...input, remoteUrl: "https://github.com/HaipingShi/other.git" }), /remote|allowlist/i);
  });

  it("binds every write adapter request to the exact authorization result", async () => {
    const authorization = makeAuthorization();
    const prAdapter = new GitHubLivePullRequestAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization,
      fetch: createFetch([]).fetch,
      baseUrl: "https://mock.github.invalid"
    });
    await assert.rejects(() => prAdapter.ensureDraftPullRequest({
      ...makePullRequestInput(),
      repository: { id: 999, owner: "HaipingShi", repo: "coderail" }
    }), /authorization|identity/i);
    await assert.rejects(() => prAdapter.ensureDraftPullRequest({
      ...makePullRequestInput(),
      effectIds: ["readme"]
    }), /authorization|effect/i);

    const pushAdapter = new GitHubLiveGitPushAdapter({
      credential: resolveLiveGitHubCredential({}, TOKEN),
      authorization,
      runner: async () => { throw new Error("must not run"); }
    });
    await assert.rejects(() => pushAdapter.ensurePushedBranch({
      repositoryRoot: "test-owned-repository",
      repository: "HaipingShi/coderail",
      remoteUrl: "https://github.com/HaipingShi/coderail.git",
      baseBranch: "main",
      headBranch: "gh-polish/live/bbbbbbbbbbbb",
      headSha: "c".repeat(40)
    }), /authorization|branch/i);
  });

  it("classifies synchronized, ahead, behind, and diverged histories without fetch or mutation", async () => {
    const localSha = "a".repeat(40);
    const remoteSha = "b".repeat(40);
    const cases = [
      { counts: "0 0\n", relation: "synchronized", aheadBy: 0, behindBy: 0 },
      { counts: "2 0\n", relation: "local-ahead", aheadBy: 2, behindBy: 0 },
      { counts: "0 3\n", relation: "local-behind", aheadBy: 0, behindBy: 3 },
      { counts: "2 3\n", relation: "diverged", aheadBy: 2, behindBy: 3 }
    ] as const;

    for (const expected of cases) {
      const invocations: readonly string[][] = [];
      const mutableInvocations = invocations as string[][];
      const runner: RepositoryVersionGitRunner = async ({ args }) => {
        mutableInvocations.push([...args]);
        if (args[0] === "remote") return { stdout: "git@github.com:HaipingShi/stakespeak.git\n", stderr: "" };
        if (args[0] === "branch") return { stdout: "main\n", stderr: "" };
        if (args[0] === "rev-parse") return { stdout: `${localSha}\n`, stderr: "" };
        if (args[0] === "cat-file") return { stdout: "", stderr: "" };
        return { stdout: expected.counts, stderr: "" };
      };

      const result = await detectRemoteLocalVersion({
        repositoryRoot: "stakespeak-checkout",
        expectedRepository: "HaipingShi/stakespeak",
        baseBranch: "main",
        remoteSha,
        runner
      });

      assert.equal(result.relation, expected.relation);
      assert.equal(result.aheadBy, expected.aheadBy);
      assert.equal(result.behindBy, expected.behindBy);
      assert.equal(result.safeToExecute, expected.relation === "synchronized");
      assert.ok(invocations.every((args) => !["fetch", "pull", "push", "checkout", "reset"].includes(args[0] ?? "")));
    }
  });

  it("fails closed when remote history is unavailable and rejects identity or branch drift", async () => {
    const remoteSha = "b".repeat(40);
    const calls: string[][] = [];
    const unavailableRunner: RepositoryVersionGitRunner = async ({ args }) => {
      calls.push([...args]);
      if (args[0] === "remote") return { stdout: "https://github.com/HaipingShi/stakespeak.git\n", stderr: "" };
      if (args[0] === "branch") return { stdout: "main\n", stderr: "" };
      if (args[0] === "rev-parse") return { stdout: `${"a".repeat(40)}\n`, stderr: "" };
      throw new Error("unknown revision");
    };
    const unavailable = await detectRemoteLocalVersion({
      repositoryRoot: "stakespeak-checkout",
      expectedRepository: "HaipingShi/stakespeak",
      baseBranch: "main",
      remoteSha,
      runner: unavailableRunner
    });

    assert.equal(unavailable.relation, "history-unavailable");
    assert.equal(unavailable.safeToExecute, false);
    assert.ok(calls.every((args) => args[0] !== "fetch" && args[0] !== "rev-list"));

    const identityRunner = versionRunner({ remote: "https://github.com/HaipingShi/other.git" });
    await assert.rejects(() => detectRemoteLocalVersion({
      repositoryRoot: "stakespeak-checkout",
      expectedRepository: "HaipingShi/stakespeak",
      baseBranch: "main",
      remoteSha,
      runner: identityRunner
    }), /remote|repository|identity/i);

    const branchRunner = versionRunner({ branch: "trunk" });
    await assert.rejects(() => detectRemoteLocalVersion({
      repositoryRoot: "stakespeak-checkout",
      expectedRepository: "HaipingShi/stakespeak",
      baseBranch: "main",
      remoteSha,
      runner: branchRunner
    }), /branch/i);
  });
});

function versionRunner(overrides: { remote?: string; branch?: string } = {}): RepositoryVersionGitRunner {
  return async ({ args }) => {
    if (args[0] === "remote") return { stdout: `${overrides.remote ?? "https://github.com/HaipingShi/stakespeak.git"}\n`, stderr: "" };
    if (args[0] === "branch") return { stdout: `${overrides.branch ?? "main"}\n`, stderr: "" };
    if (args[0] === "rev-parse") return { stdout: `${"a".repeat(40)}\n`, stderr: "" };
    if (args[0] === "cat-file") return { stdout: "", stderr: "" };
    return { stdout: "0 1\n", stderr: "" };
  };
}

function makeAuthorizationRequest(): LiveMutationAuthorizationRequest {
  return {
    enableMutation: true,
    requestedRepository: "HaipingShi/coderail",
    allowlistedRepository: "HaipingShi/coderail",
    localRemoteRepository: "HaipingShi/coderail",
    artifactRepository: "HaipingShi/coderail",
    expectedRepositoryId: 12345,
    fetchedRepository: {
      id: 12345,
      fullName: "HaipingShi/coderail",
      defaultBranch: "main",
      baseSha: "b".repeat(40),
      permissions: { contents: "write", pullRequests: "write", actions: "read" }
    },
    baseBranch: "main",
    baseSha: "b".repeat(40),
    planDigest: "a".repeat(64),
    expectedReviewToken: "review-token",
    suppliedReviewToken: "review-token",
    effects: [{ id: "contributing", path: "CONTRIBUTING.md", mode: "create" }],
    confirmedEffectIds: ["contributing"]
  };
}

function makeAuthorization(): LiveMutationAuthorization {
  return authorizeLiveGitHubMutation(makeAuthorizationRequest());
}

function makePullRequestInput(): LivePullRequestInput {
  return {
    repository: { id: 12345, owner: "HaipingShi", repo: "coderail" },
    planId: "plan-t022",
    planDigest: "a".repeat(64),
    baseBranch: "main",
    baseSha: "b".repeat(40),
    headBranch: "gh-polish/live/aaaaaaaaaaaa",
    headSha: "c".repeat(40),
    title: "Repository Ready",
    body: "Create reviewed repository files.",
    effectIds: ["contributing"]
  };
}

function pullRequest(number: number, input: LivePullRequestInput, marker: string): unknown {
  return {
    number,
    html_url: `https://github.invalid/pull/${number}`,
    state: "open",
    draft: true,
    base: { ref: input.baseBranch },
    head: { ref: input.headBranch, sha: input.headSha },
    body: `${input.body}\n\n${marker}`
  };
}

function workflowRun(
  id: number,
  branch: string,
  sha: string,
  status: string,
  conclusion: string | null
): unknown {
  return {
    id,
    name: "ci",
    status,
    conclusion,
    head_branch: branch,
    head_sha: sha,
    html_url: `https://github.invalid/actions/runs/${id}`
  };
}

function response(status: number, body: unknown): Awaited<ReturnType<LiveGitHubFetch>> {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 422 ? "Unprocessable Entity" : status === 403 ? "Forbidden" : "OK",
    async json() { return body; }
  };
}

function createFetch(responses: Array<Awaited<ReturnType<LiveGitHubFetch>>>): {
  fetch: LiveGitHubFetch;
  methods: string[];
} {
  const methods: string[] = [];
  return {
    methods,
    async fetch(_url, init) {
      methods.push(init.method);
      const next = responses.shift();
      if (!next) throw new Error("Unexpected mock request.");
      return next;
    }
  };
}

async function captureError(action: () => Promise<unknown>): Promise<Error> {
  try {
    await action();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  throw new Error("Expected action to fail.");
}
