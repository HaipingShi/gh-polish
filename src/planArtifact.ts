import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, isAbsolute, join } from "node:path";
import { defaultGitRunner } from "./git.js";
import type { LocalAnalysis } from "./localAnalyzer.js";
import type { PolishPlan } from "./planner.js";
import { ProtocolError } from "./protocol.js";
import type { RepositoryContext } from "./repositoryContext.js";

export const PLAN_SCHEMA_VERSION = "1";
const PLAN_TTL_MS = 24 * 60 * 60 * 1000;

export interface RepositoryIdentity {
  root: string;
  defaultBranch: string;
  remotes: RepositoryContext["remotes"];
}

export interface PlanArtifact {
  schemaVersion: typeof PLAN_SCHEMA_VERSION;
  id: string;
  repository: RepositoryIdentity;
  baseSha: string;
  contentHashes: Record<string, string>;
  createdAt: string;
  expiresAt: string;
  operations: PolishPlan["operations"];
  effects: EffectPayload[];
  risk: {
    highest: PolishPlan["operations"][number]["risk"];
    confirmations: string[];
  };
  verification: string[];
  evidence: {
    localAnalysis: Pick<LocalAnalysis, "stacks" | "manifests" | "commands">;
    operationCount: number;
  };
  recovery: Array<{ action: string; command?: string }>;
  digest: string;
}

export interface EffectPayload {
  operationId: string;
  path: string;
  content: string;
  contentSha256: string;
  requiresConfirmation: boolean;
}

export interface PlanArtifactInput {
  context: RepositoryContext;
  local: LocalAnalysis;
  plan: PolishPlan;
  effects?: EffectPayload[];
  now?: Date;
}

export async function createPlanArtifact(input: PlanArtifactInput): Promise<PlanArtifact> {
  const now = input.now ?? new Date();
  const baseSha = await readRevision(input.context.root);
  const contentHashes = await hashRelevantContent(input.context.root, input.local);
  const confirmations = input.plan.operations.filter((operation) => operation.requiresConfirmation).map((operation) => operation.id);
  const highest = highestRisk(input.plan.operations.map((operation) => operation.risk));
  const unsigned: Omit<PlanArtifact, "digest"> = {
    schemaVersion: PLAN_SCHEMA_VERSION,
    id: input.plan.id,
    repository: {
      root: input.context.root,
      defaultBranch: input.context.defaultBranch,
      remotes: input.context.remotes
    },
    baseSha,
    contentHashes,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PLAN_TTL_MS).toISOString(),
    operations: input.plan.operations,
    effects: input.effects ?? [],
    risk: { highest, confirmations },
    verification: input.plan.operations.map((operation) => operation.verification),
    evidence: {
      localAnalysis: {
        stacks: input.local.stacks,
        manifests: input.local.manifests,
        commands: input.local.commands
      },
      operationCount: input.plan.operations.length
    },
    recovery: [
      { action: "Run inspect again if the repository state changed.", command: "gh-polish inspect --json" },
      { action: "Generate a replacement plan when this plan expires.", command: "gh-polish plan --json" }
    ]
  };

  return { ...unsigned, digest: digest(unsigned) };
}

export function defaultPlanStore(env: NodeJS.ProcessEnv): string {
  const configured = env.GH_POLISH_PLAN_STORE_DIR;
  if (configured) return configured;
  const base = env.LOCALAPPDATA ?? join(tmpdir(), "gh-polish");
  return join(base, "gh-polish", "plans");
}

export async function savePlanArtifact(artifact: PlanArtifact, store: string): Promise<string> {
  validateArtifactIntegrity(artifact);
  await mkdir(store, { recursive: true });
  const path = join(store, `${artifact.id}.json`);
  await writeFile(path, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return path;
}

export async function loadPlanArtifact(reference: string, store: string): Promise<PlanArtifact> {
  const path = isAbsolute(reference) || reference.includes("/") || reference.includes("\\")
    ? reference
    : join(store, `${basename(reference, ".json")}.json`);
  try {
    const artifact = JSON.parse(await readFile(path, "utf8")) as PlanArtifact;
    validateArtifactIntegrity(artifact);
    return artifact;
  } catch (error) {
    if (error instanceof ProtocolError) throw error;
    throw new ProtocolError("PLAN_NOT_FOUND", `Unable to load plan '${reference}'.`, [
      { action: "Generate a new plan for this repository.", command: "gh-polish plan --json" }
    ]);
  }
}

export async function validatePlanForRepository(artifact: PlanArtifact, context: RepositoryContext, local: LocalAnalysis, now: Date = new Date()): Promise<void> {
  validateArtifactIntegrity(artifact);
  if (artifact.expiresAt <= now.toISOString()) {
    throw new ProtocolError("PLAN_EXPIRED", `Plan '${artifact.id}' has expired.`, artifact.recovery);
  }
  if (artifact.repository.root !== context.root) {
    throw new ProtocolError("PLAN_REPOSITORY_MISMATCH", "Plan belongs to a different repository.", artifact.recovery);
  }
  if (artifact.baseSha !== await readRevision(context.root)) {
    throw new ProtocolError("PLAN_STALE", "Repository revision changed after the plan was created.", artifact.recovery);
  }
  const currentHashes = await hashRelevantContent(context.root, local);
  if (canonicalJson(artifact.contentHashes) !== canonicalJson(currentHashes)) {
    throw new ProtocolError("PLAN_STALE", "Relevant repository content changed after the plan was created.", artifact.recovery);
  }
}

export function validateArtifactIntegrity(artifact: PlanArtifact): void {
  if (!artifact || artifact.schemaVersion !== PLAN_SCHEMA_VERSION || !artifact.id || !artifact.repository?.root || !artifact.baseSha || !artifact.digest || !Array.isArray(artifact.effects)) {
    throw new ProtocolError("PLAN_INVALID", "Plan does not match the supported schema.");
  }
  const { digest: actual, ...unsigned } = artifact;
  if (actual !== digest(unsigned)) {
    throw new ProtocolError("PLAN_TAMPERED", "Plan digest does not match its immutable contents.", [
      { action: "Generate a replacement plan.", command: "gh-polish plan --json" }
    ]);
  }
  for (const effect of artifact.effects) {
    if (!artifact.operations.some((operation) => operation.id === effect.operationId) || effect.contentSha256 !== createHash("sha256").update(effect.content).digest("hex")) {
      throw new ProtocolError("PLAN_TAMPERED", "Plan effect payload does not match its immutable contents.");
    }
  }
}

async function readRevision(root: string): Promise<string> {
  try {
    const result = await defaultGitRunner(["rev-parse", "HEAD"], { cwd: root });
    return result.stdout.trim();
  } catch {
    throw new ProtocolError("REPOSITORY_UNBORN", "Repository needs an initial commit before a trusted plan can be created.", [
      { action: "Create the repository's initial commit, then inspect again." }
    ]);
  }
}

async function hashRelevantContent(root: string, local: LocalAnalysis): Promise<Record<string, string>> {
  const candidates = [...local.manifests, "README.md", "README", ".gitignore"].sort();
  const hashes: Record<string, string> = {};
  for (const candidate of candidates) {
    try {
      hashes[candidate] = createHash("sha256").update(await readFile(join(root, candidate))).digest("hex");
    } catch {
      // The absence of an analyzed file is represented by omitting its hash.
    }
  }
  return hashes;
}

function highestRisk(risks: PlanArtifact["operations"][number]["risk"][]): PlanArtifact["risk"]["highest"] {
  const order: PlanArtifact["risk"]["highest"][] = ["read", "low", "medium", "high", "refused"];
  return risks.reduce((highest, risk) => order.indexOf(risk) > order.indexOf(highest) ? risk : highest, "read");
}

function digest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).filter((key) => record[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  return value === undefined ? "null" : JSON.stringify(value);
}
