import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GitHubReadAdapter, resolveGitHubToken } from "../src/githubAdapter.js";

interface RequestRecord {
  url: string;
  method: string;
  headers: Record<string, string>;
}

function createJsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {
      get(name: string): string | null {
        return headers[name.toLowerCase()] ?? null;
      }
    },
    async json(): Promise<unknown> {
      return body;
    }
  };
}

function createFetch(bodyByPath: Map<string, unknown>, records: RequestRecord[]) {
  return async (url: string, init: { method: "GET"; headers: Record<string, string> }) => {
    const parsed = new URL(url);
    records.push({ url, method: init.method, headers: init.headers });
    return createJsonResponse(200, bodyByPath.get(`${parsed.pathname}${parsed.search}`) ?? {});
  };
}

describe("GitHubReadAdapter", () => {
  it("resolves tokens from explicit value and environment", () => {
    assert.deepEqual(resolveGitHubToken({ GH_TOKEN: "gh", GITHUB_TOKEN: "github" }, "explicit"), {
      token: "explicit",
      source: "explicit"
    });
    assert.deepEqual(resolveGitHubToken({ GH_TOKEN: "gh", GITHUB_TOKEN: "github" }), {
      token: "gh",
      source: "GH_TOKEN"
    });
    assert.deepEqual(resolveGitHubToken({ GITHUB_TOKEN: "github" }), {
      token: "github",
      source: "GITHUB_TOKEN"
    });
    assert.deepEqual(resolveGitHubToken({}), { source: "none" });
  });

  it("reads repository metadata and sends versioned read-only headers", async () => {
    const records: RequestRecord[] = [];
    const adapter = new GitHubReadAdapter({
      token: "token",
      baseUrl: "https://api.test",
      fetch: createFetch(
        new Map([
          [
            "/repos/owner/repo",
            {
              name: "repo",
              full_name: "owner/repo",
              private: false,
              description: "demo",
              homepage: null,
              default_branch: "main",
              has_issues: true,
              has_projects: true,
              has_wiki: false,
              has_pages: false,
              archived: false,
              disabled: false,
              license: { key: "mit", name: "MIT License", spdx_id: "MIT" }
            }
          ]
        ]),
        records
      )
    });

    const result = await adapter.getRepository({ owner: "owner", repo: "repo" });

    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value.fullName, "owner/repo");
    assert.equal(records[0].method, "GET");
    assert.equal(records[0].headers.Authorization, "Bearer token");
    assert.equal(records[0].headers.Accept, "application/vnd.github+json");
    assert.equal(records[0].headers["X-GitHub-Api-Version"], "2026-03-10");
  });

  it("reads topics, workflows, workflow runs, labels, and milestones", async () => {
    const records: RequestRecord[] = [];
    const adapter = new GitHubReadAdapter({
      baseUrl: "https://api.test",
      fetch: createFetch(
        new Map<string, unknown>([
          ["/repos/owner/repo/topics", { names: ["typescript", "cli"] }],
          ["/repos/owner/repo/actions/workflows?per_page=100", { workflows: [{ id: 1, name: "CI", path: ".github/workflows/ci.yml", state: "active" }] }],
          ["/repos/owner/repo/actions/runs?per_page=30", { workflow_runs: [{ id: 2, name: "CI", status: "completed", conclusion: "success", head_branch: "main", head_sha: "abc", html_url: "https://github.com/owner/repo/actions/runs/2" }] }],
          ["/repos/owner/repo/labels?per_page=100", [{ name: "bug", color: "d73a4a", description: "Bug" }]],
          ["/repos/owner/repo/milestones?state=all&per_page=100", [{ number: 1, title: "v1", state: "open", description: null }]]
        ]),
        records
      )
    });

    assert.deepEqual(await adapter.getTopics({ owner: "owner", repo: "repo" }), { ok: true, value: ["cli", "typescript"] });
    assert.equal((await adapter.listWorkflows({ owner: "owner", repo: "repo" })).ok, true);
    assert.equal((await adapter.listWorkflowRuns({ owner: "owner", repo: "repo" })).ok, true);
    assert.equal((await adapter.listLabels({ owner: "owner", repo: "repo" })).ok, true);
    assert.equal((await adapter.listMilestones({ owner: "owner", repo: "repo" })).ok, true);
    assert.deepEqual(records.map((record) => record.method), ["GET", "GET", "GET", "GET", "GET"]);
  });

  it("returns typed degraded states for permission and visibility failures", async () => {
    const forbidden = new GitHubReadAdapter({
      fetch: async () => createJsonResponse(403, { message: "Forbidden" })
    });
    const rateLimited = new GitHubReadAdapter({
      fetch: async () => createJsonResponse(403, { message: "Rate limit" }, { "x-ratelimit-remaining": "0" })
    });
    const notFound = new GitHubReadAdapter({
      fetch: async () => createJsonResponse(404, { message: "Not Found" })
    });

    assert.deepEqual(await forbidden.getTopics({ owner: "owner", repo: "repo" }), {
      ok: false,
      warning: { kind: "forbidden", status: 403, message: "GitHub token lacks permission for this read." }
    });
    assert.deepEqual(await rateLimited.getTopics({ owner: "owner", repo: "repo" }), {
      ok: false,
      warning: { kind: "rate_limited", status: 403, message: "GitHub API rate limit exceeded." }
    });
    assert.deepEqual(await notFound.getTopics({ owner: "owner", repo: "repo" }), {
      ok: false,
      warning: { kind: "not_found", status: 404, message: "GitHub resource was not found or is not visible." }
    });
  });

  it("returns typed degraded states for invalid responses and network errors", async () => {
    const invalid = new GitHubReadAdapter({
      fetch: async () => createJsonResponse(200, { names: "not-array" })
    });
    const network = new GitHubReadAdapter({
      fetch: async () => {
        throw new Error("offline");
      }
    });

    const invalidResult = await invalid.getTopics({ owner: "owner", repo: "repo" });
    const networkResult = await network.getTopics({ owner: "owner", repo: "repo" });

    assert.equal(invalidResult.ok, false);
    assert.equal(!invalidResult.ok && invalidResult.warning.kind, "invalid_response");
    assert.deepEqual(networkResult, {
      ok: false,
      warning: { kind: "network_error", message: "offline" }
    });
  });

  it("does not expose mutation methods", () => {
    const adapter = new GitHubReadAdapter({ fetch: async () => createJsonResponse(200, {}) });
    const keys = new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(adapter)));

    for (const forbidden of ["post", "put", "patch", "delete", "createPullRequest", "updateRepository", "replaceTopics"]) {
      assert.equal(keys.has(forbidden), false);
    }
  });
});
