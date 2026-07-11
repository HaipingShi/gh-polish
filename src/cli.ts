#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { analyzeLocalRepository, type LocalAnalysis } from "./localAnalyzer.js";
import {
  createPlanArtifact,
  defaultPlanStore,
  loadPlanArtifact,
  savePlanArtifact,
  validatePlanForRepository
} from "./planArtifact.js";
import { createPolishPlan } from "./planner.js";
import { failureEnvelope, ProtocolError, serializeEnvelope, successEnvelope } from "./protocol.js";
import { detectRepositoryContext, type RepositoryContext } from "./repositoryContext.js";

const COMMANDS = ["inspect", "plan", "apply", "verify"] as const;
type Command = (typeof COMMANDS)[number];

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface CliRuntime {
  cwd?: string;
  now?: () => Date;
  planStore?: string;
}

interface ParsedArgs {
  command?: string;
  flags: Map<string, string | boolean>;
  positionals: string[];
}

function usage(): string {
  return [
    "gh-polish",
    "",
    "Agent-driven GitHub repository polish workflow.",
    "",
    "Usage:",
    "  gh-polish <command> [options]",
    "",
    "Commands:",
    "  inspect   Inspect local repository state",
    "  plan      Create a persisted, repository-bound read-only plan",
    "  apply     Validate a saved plan; only --dry-run is available in M0",
    "  verify    Verify saved-plan evidence against current repository state",
    "",
    "Options:",
    "  --json                 Emit the stable JSON protocol envelope",
    "  --profile <name>       Plan profile (currently public-project only)",
    "  --dry-run              Required for M0 apply",
    "  --plan <id-or-path>    Plan identifier or path for apply and verify",
    "  --help, -h             Show help",
    "  --version, -v          Show version",
    ""
  ].join("\n");
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = argv[0]?.startsWith("-") ? undefined : argv[0];
  const rest = command ? argv.slice(1) : argv;
  const flags = new Map<string, string | boolean>();
  const positionals: string[] = [];
  const valuedFlags = new Set(["plan", "profile"]);

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith("-")) {
      positionals.push(value);
      continue;
    }
    if (value === "--help" || value === "-h") {
      flags.set("help", true);
      continue;
    }
    if (value === "--version" || value === "-v") {
      flags.set("version", true);
      continue;
    }
    const name = value.replace(/^--/, "");
    if (valuedFlags.has(name)) {
      const next = rest[index + 1];
      flags.set(name, !next || next.startsWith("-") ? "" : next);
      if (next && !next.startsWith("-")) index += 1;
      continue;
    }
    flags.set(name, true);
  }

  return { command, flags, positionals };
}

function isCommand(value: string | undefined): value is Command {
  return typeof value === "string" && COMMANDS.includes(value as Command);
}

export async function runCli(argv: readonly string[], env: NodeJS.ProcessEnv = process.env, runtime: CliRuntime = {}): Promise<CliResult> {
  const parsed = parseArgs(argv);
  if (!parsed.command || parsed.flags.get("help")) return { code: 0, stdout: usage(), stderr: "" };
  if (parsed.flags.get("version")) return { code: 0, stdout: "0.0.0\n", stderr: "" };
  if (!isCommand(parsed.command)) return { code: 1, stdout: "", stderr: `Unknown command: ${parsed.command}\n\n${usage()}` };

  const command = parsed.command;
  try {
    const cwd = runtime.cwd ?? process.cwd();
    const now = runtime.now?.() ?? new Date();
    const store = runtime.planStore ?? defaultPlanStore(env);
    const planReference = parsed.flags.get("plan");

    if ((command === "apply" || command === "verify") && (typeof planReference !== "string" || planReference.length === 0)) {
      throw new ProtocolError("PLAN_REFERENCE_REQUIRED", `Command '${command}' requires --plan <id-or-path>.`, [
        { action: "Generate a plan first.", command: "gh-polish plan --json" }
      ]);
    }
    if (command === "apply" && parsed.flags.get("dry-run") !== true) {
      throw new ProtocolError("DRY_RUN_REQUIRED", "M0 apply is validation-only and requires --dry-run.", [
        { action: "Re-run apply in validation-only mode.", command: `gh-polish apply --plan ${planReference} --dry-run --json` }
      ]);
    }
    if (command === "plan" && parsed.flags.has("profile") && parsed.flags.get("profile") !== "public-project") {
      throw new ProtocolError("PROFILE_UNSUPPORTED", "M0 currently supports only the public-project plan profile.", [
        { action: "Use the supported M0 profile.", command: "gh-polish plan --profile public-project --json" }
      ]);
    }

    const state = await readLocalState(cwd);
    if (command === "inspect") {
      return jsonResult(successEnvelope(command, {
        mutation: "none",
        repository: state.context,
        analysis: state.local
      }));
    }
    if (command === "plan") {
      const plan = createPolishPlan(state.local, undefined, now);
      const artifact = await createPlanArtifact({ context: state.context, local: state.local, plan, now });
      const planPath = await savePlanArtifact(artifact, store);
      return jsonResult(successEnvelope(command, { mutation: "none", plan: artifact, planPath }));
    }

    const artifact = await loadPlanArtifact(planReference as string, store);
    await validatePlanForRepository(artifact, state.context, state.local, now);
    if (command === "apply") {
      return jsonResult(successEnvelope(command, {
        mutation: "none",
        planId: artifact.id,
        dryRun: true,
        operations: artifact.operations.map((operation) => operation.id),
        evidence: artifact.evidence
      }, [], artifact.recovery));
    }
    return jsonResult(successEnvelope(command, {
      mutation: "none",
      planId: artifact.id,
      verifiedAt: now.toISOString(),
      baseSha: artifact.baseSha,
      evidence: artifact.evidence,
      nextStep: "gh-polish apply --plan <plan-id> --dry-run --json"
    }, [], artifact.recovery));
  } catch (error) {
    const protocolError = toProtocolError(error);
    return { code: 2, stdout: serializeEnvelope(failureEnvelope(command, protocolError)), stderr: "" };
  }
}

async function readLocalState(cwd: string): Promise<{ context: RepositoryContext; local: LocalAnalysis }> {
  const context = await detectRepositoryContext(cwd);
  const local = await analyzeLocalRepository(context.root);
  return { context, local };
}

function jsonResult(envelope: ReturnType<typeof successEnvelope>): CliResult {
  return { code: 0, stdout: serializeEnvelope(envelope), stderr: "" };
}

function toProtocolError(error: unknown): ProtocolError {
  if (error instanceof ProtocolError) return error;
  if (error instanceof Error && error.name === "RepositoryContextError") {
    return new ProtocolError("REPOSITORY_CONTEXT_UNAVAILABLE", error.message, [
      { action: "Run gh-polish from a local Git repository." }
    ]);
  }
  return new ProtocolError("INSPECTION_FAILED", error instanceof Error ? error.message : "Unable to complete the command.");
}

export async function main(): Promise<void> {
  const result = await runCli(process.argv.slice(2));
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.code;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main();
}
