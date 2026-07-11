import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCli } from "../src/cli.js";

const NOW = new Date("2026-07-11T03:00:00.000Z");

describe("T-014 read-only thin slice", () => {
  for (const fixture of ["node", "generic"] as const) {
    it(`runs inspect -> plan -> apply --dry-run -> verify for a ${fixture} fixture without project mutation`, async () => {
      const root = createFixture(fixture);
      const store = mkdtempSync(join(tmpdir(), "gh-polish-plan-store-"));
      try {
        const runtime = { cwd: root, planStore: store, now: () => NOW };
        const beforeStatus = git(root, ["status", "--porcelain"]);
        const beforeReadme = readFileSync(join(root, "README.md"), "utf8");

        const inspect = await runCli(["inspect", "--json"], {}, runtime);
        const inspectEnvelope = parse(inspect);
        assert.equal(inspectEnvelope.data.analysis.stacks[0], fixture === "node" ? "node" : "generic");

        const plan = await runCli(["plan", "--profile", "public-project", "--json"], {}, runtime);
        const planEnvelope = parse(plan);
        assert.equal(planEnvelope.data.plan.schemaVersion, "1");
        assert.equal(normalizePath(planEnvelope.data.plan.repository.root), normalizePath(root));
        assert.equal(typeof planEnvelope.data.plan.baseSha, "string");
        assert.equal(typeof planEnvelope.data.plan.digest, "string");
        assert.equal(Array.isArray(planEnvelope.data.plan.risk.confirmations), true);

        const apply = await runCli(["apply", "--plan", planEnvelope.data.planPath, "--dry-run", "--json"], {}, runtime);
        assert.equal(parse(apply).data.mutation, "none");

        const verify = await runCli(["verify", "--plan", planEnvelope.data.plan.id, "--json"], {}, runtime);
        assert.match(parse(verify).data.nextStep, /^gh-polish apply/);

        assert.equal(git(root, ["status", "--porcelain"]), beforeStatus);
        assert.equal(readFileSync(join(root, "README.md"), "utf8"), beforeReadme);
      } finally {
        rmSync(root, { recursive: true, force: true });
        rmSync(store, { recursive: true, force: true });
      }
    });
  }

  it("rejects a tampered plan before dry-run validation", async () => {
    const root = createFixture("node");
    const store = mkdtempSync(join(tmpdir(), "gh-polish-plan-store-"));
    try {
      const runtime = { cwd: root, planStore: store, now: () => NOW };
      const plan = parse(await runCli(["plan", "--json"], {}, runtime));
      const artifact = JSON.parse(readFileSync(plan.data.planPath, "utf8")) as { operations: Array<{ title: string }> };
      artifact.operations[0].title = "tampered";
      writeFileSync(plan.data.planPath, `${JSON.stringify(artifact)}\n`, "utf8");

      const apply = parse(await runCli(["apply", "--plan", plan.data.planPath, "--dry-run", "--json"], {}, runtime));
      assert.equal(apply.ok, false);
      assert.equal(apply.error.code, "PLAN_TAMPERED");
      assert.equal(git(root, ["status", "--porcelain"]), "");
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(store, { recursive: true, force: true });
    }
  });

  it("rejects a stale plan after the relevant content changes", async () => {
    const root = createFixture("node");
    const store = mkdtempSync(join(tmpdir(), "gh-polish-plan-store-"));
    try {
      const runtime = { cwd: root, planStore: store, now: () => NOW };
      const plan = parse(await runCli(["plan", "--json"], {}, runtime));
      writeFileSync(join(root, "README.md"), "# changed\n", "utf8");
      git(root, ["add", "README.md"]);
      git(root, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.com", "commit", "-m", "change"]);

      const verify = parse(await runCli(["verify", "--plan", plan.data.plan.id, "--json"], {}, runtime));
      assert.equal(verify.ok, false);
      assert.equal(verify.error.code, "PLAN_STALE");
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(store, { recursive: true, force: true });
    }
  });

  it("rejects an expired plan before dry-run validation", async () => {
    const root = createFixture("generic");
    const store = mkdtempSync(join(tmpdir(), "gh-polish-plan-store-"));
    try {
      const plan = parse(await runCli(["plan", "--json"], {}, { cwd: root, planStore: store, now: () => NOW }));
      const apply = parse(await runCli(
        ["apply", "--plan", plan.data.plan.id, "--dry-run", "--json"],
        {},
        { cwd: root, planStore: store, now: () => new Date("2026-07-13T03:00:00.000Z") }
      ));

      assert.equal(apply.ok, false);
      assert.equal(apply.error.code, "PLAN_EXPIRED");
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(store, { recursive: true, force: true });
    }
  });

  it("rejects a plan for a different repository before dry-run validation", async () => {
    const source = createFixture("node");
    const target = createFixture("generic");
    const store = mkdtempSync(join(tmpdir(), "gh-polish-plan-store-"));
    try {
      const plan = parse(await runCli(["plan", "--json"], {}, { cwd: source, planStore: store, now: () => NOW }));
      const apply = parse(await runCli(
        ["apply", "--plan", plan.data.planPath, "--dry-run", "--json"],
        {},
        { cwd: target, planStore: store, now: () => NOW }
      ));

      assert.equal(apply.ok, false);
      assert.equal(apply.error.code, "PLAN_REPOSITORY_MISMATCH");
      assert.equal(git(target, ["status", "--porcelain"]), "");
    } finally {
      rmSync(source, { recursive: true, force: true });
      rmSync(target, { recursive: true, force: true });
      rmSync(store, { recursive: true, force: true });
    }
  });
});

function createFixture(kind: "node" | "generic"): string {
  const root = mkdtempSync(join(tmpdir(), `gh-polish-${kind}-`));
  git(root, ["init"]);
  writeFileSync(join(root, "README.md"), "# fixture\n", "utf8");
  if (kind === "node") {
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "fixture", scripts: { test: "node --test" } }), "utf8");
  }
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.com", "commit", "-m", "initial"]);
  return root;
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true }).trim();
}

function parse(result: Awaited<ReturnType<typeof runCli>>): any {
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}
