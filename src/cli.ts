#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeLocalRepository, type LocalAnalysis } from "./localAnalyzer.js";
import { resolveLiveGitHubCredential } from "./liveGitHubAuthorization.js";
import { composeLiveExecution } from "./liveGitHubComposition.js";
import {
  createPlanArtifact,
  defaultPlanStore,
  loadPlanArtifact,
  savePlanArtifact,
  validatePlanForRepository
} from "./planArtifact.js";
import { createPolishPlan } from "./planner.js";
import { failureEnvelope, ProtocolError, serializeEnvelope, successEnvelope, type ProtocolCommand } from "./protocol.js";
import {
  executeAgentRepositoryReady,
  prepareAgentRepositoryReady,
  reviewAgentRepositoryReady
} from "./repositoryReadyAgentProtocol.js";
import type { RepositoryReadyExecutionEvidence } from "./repositoryReadyExecution.js";
import { repositoryProfiles, type RepositoryProfile } from "./repositoryProfile.js";
import { detectRepositoryContext, type RepositoryContext } from "./repositoryContext.js";
import { registry } from "./templateRegistry.js";

const COMMANDS = ["inspect", "plan", "apply", "verify", "ready"] as const;
type Command = (typeof COMMANDS)[number];

const READY_SUBCOMMANDS = ["prepare", "review", "execute"] as const;
type ReadySubcommand = (typeof READY_SUBCOMMANDS)[number];

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
  confirmations: string[];
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
    "  inspect          Inspect local repository state",
    "  plan             Create a persisted, repository-bound read-only plan",
    "  apply            Validate a saved plan; only --dry-run is available in M0",
    "  verify           Verify saved-plan evidence against current repository state",
    "  ready prepare    Persist a Repository Ready plan with executable create effects",
    "  ready review     Confirm effects and mint the execution review token",
    "  ready execute    Execute a reviewed plan against live GitHub (requires --live)",
    "",
    "Options:",
    "  --json                     Emit the stable JSON protocol envelope",
    "  --profile <name>           Plan profile (currently public-project only)",
    "  --dry-run                  Required for M0 apply",
    "  --plan <id-or-path>        Plan identifier or path",
    "  --confirm <effect-id>      Confirm one create effect (repeatable)",
    "  --review-token <token>     Review token minted by ready review",
    "  --live                     Enable live GitHub mutation (fail-closed default: off)",
    "  --repo <owner/name>        Exact live repository allowlist entry",
    "  --repo-id <number>         Expected numeric GitHub repository id",
    "  --project-name <name>      Project name for generated content (prepare)",
    "  --pr-title <title>         Pull request title (execute)",
    "  --pr-body <body>           Pull request body (execute)",
    "  --previous-evidence <path> Resume execute from saved evidence JSON",
    "  --help, -h                 Show help",
    "  --version, -v              Show version",
    ""
  ].join("\n");
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = argv[0]?.startsWith("-") ? undefined : argv[0];
  const rest = command ? argv.slice(1) : argv;
  const flags = new Map<string, string | boolean>();
  const confirmations: string[] = [];
  const positionals: string[] = [];
  const valuedFlags = new Set([
    "plan",
    "profile",
    "review-token",
    "repo",
    "repo-id",
    "project-name",
    "pr-title",
    "pr-body",
    "previous-evidence"
  ]);

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
    if (name === "confirm") {
      const next = rest[index + 1];
      if (next && !next.startsWith("-")) {
        confirmations.push(next);
        index += 1;
      }
      continue;
    }
    if (valuedFlags.has(name)) {
      const next = rest[index + 1];
      flags.set(name, !next || next.startsWith("-") ? "" : next);
      if (next && !next.startsWith("-")) index += 1;
      continue;
    }
    flags.set(name, true);
  }

  return { command, flags, confirmations, positionals };
}

function isCommand(value: string | undefined): value is Command {
  return typeof value === "string" && COMMANDS.includes(value as Command);
}

function isReadySubcommand(value: string | undefined): value is ReadySubcommand {
  return typeof value === "string" && READY_SUBCOMMANDS.includes(value as ReadySubcommand);
}

export async function runCli(argv: readonly string[], env: NodeJS.ProcessEnv = process.env, runtime: CliRuntime = {}): Promise<CliResult> {
  const parsed = parseArgs(argv);
  if (!parsed.command || parsed.flags.get("help")) return { code: 0, stdout: usage(), stderr: "" };
  if (parsed.flags.get("version")) return { code: 0, stdout: "0.0.0\n", stderr: "" };
  if (!isCommand(parsed.command)) return { code: 1, stdout: "", stderr: `Unknown command: ${parsed.command}\n\n${usage()}` };

  const command = parsed.command;
  const protocolCommand = toProtocolCommand(command, parsed.positionals[0]);
  try {
    const cwd = runtime.cwd ?? process.cwd();
    const now = runtime.now?.() ?? new Date();
    const store = runtime.planStore ?? defaultPlanStore(env);

    if (command === "ready") {
      return await runReadyCommand(parsed, env, { cwd, now, store });
    }

    const planReference = parsed.flags.get("plan");
    if ((command === "apply" || command === "verify") && (typeof planReference !== "string" || planReference.length === 0)) {
      throw new ProtocolError("PLAN_REFERENCE_REQUIRED", `Command '${command}' requires --plan <id-or-path>.`, [
        { action: "Generate a plan first.", command: "gh-polish plan --json" }
      ]);
    }
    if (command === "apply" && parsed.flags.get("dry-run") !== true) {
      throw new ProtocolError("DRY_RUN_REQUIRED", "M0 apply is validation-only and requires --dry-run.", [
        { action: "Re-run apply in validation-only mode.", command: `gh-polish apply --plan ${planReference} --dry-run --json` },
        { action: "Execute reviewed live effects through the Repository Ready protocol.", command: "gh-polish ready prepare --json" }
      ]);
    }
    if (command === "plan" && parsed.flags.has("profile") && parsed.flags.get("profile") !== "public-project") {
      throw new ProtocolError("PROFILE_UNSUPPORTED", "M0 currently supports only the public-project plan profile.", [
        { action: "Use the supported M0 profile.", command: "gh-polish plan --profile public-project --json" }
      ]);
    }

    const state = await readLocalState(cwd);
    if (command === "inspect") {
      return jsonResult(successEnvelope(protocolCommand, {
        mutation: "none",
        repository: state.context,
        analysis: state.local
      }));
    }
    if (command === "plan") {
      const plan = createPolishPlan(state.local, undefined, now);
      const artifact = await createPlanArtifact({ context: state.context, local: state.local, plan, now });
      const planPath = await savePlanArtifact(artifact, store);
      return jsonResult(successEnvelope(protocolCommand, { mutation: "none", plan: artifact, planPath }));
    }

    const artifact = await loadPlanArtifact(planReference as string, store);
    await validatePlanForRepository(artifact, state.context, state.local, now);
    if (command === "apply") {
      return jsonResult(successEnvelope(protocolCommand, {
        mutation: "none",
        planId: artifact.id,
        dryRun: true,
        operations: artifact.operations.map((operation) => operation.id),
        evidence: artifact.evidence
      }, [], artifact.recovery));
    }
    return jsonResult(successEnvelope(protocolCommand, {
      mutation: "none",
      planId: artifact.id,
      verifiedAt: now.toISOString(),
      baseSha: artifact.baseSha,
      evidence: artifact.evidence,
      nextStep: "gh-polish apply --plan <plan-id> --dry-run --json"
    }, [], artifact.recovery));
  } catch (error) {
    const protocolError = toProtocolError(error);
    return { code: 2, stdout: serializeEnvelope(failureEnvelope(protocolCommand, protocolError)), stderr: "" };
  }
}

interface ReadyRuntime {
  cwd: string;
  now: Date;
  store: string;
}

async function runReadyCommand(parsed: ParsedArgs, env: NodeJS.ProcessEnv, runtime: ReadyRuntime): Promise<CliResult> {
  const subcommand = parsed.positionals[0];
  if (!isReadySubcommand(subcommand)) {
    throw new ProtocolError("READY_SUBCOMMAND_REQUIRED", "Command 'ready' requires a subcommand: prepare, review, or execute.", [
      { action: "Start the Repository Ready workflow.", command: "gh-polish ready prepare --json" }
    ]);
  }

  if (subcommand === "prepare") {
    const profile = readProfileFlag(parsed);
    const context = await detectRepositoryContext(runtime.cwd);
    const local = await analyzeLocalRepository(context.root);
    const existingPaths = await scanExistingTemplatePaths(context.root);
    const projectName = readStringFlag(parsed, "project-name") ?? basename(context.root);
    const prepared = await prepareAgentRepositoryReady({
      profile,
      context,
      local,
      existingPaths,
      projectName,
      planStore: runtime.store,
      now: runtime.now
    });
    return jsonResult(successEnvelope("ready.prepare", { mutation: "plan-store-write", ...prepared }));
  }

  const planReference = readStringFlag(parsed, "plan");
  if (!planReference) {
    throw new ProtocolError("PLAN_REFERENCE_REQUIRED", `Command 'ready ${subcommand}' requires --plan <id-or-path>.`, [
      { action: "Prepare a Repository Ready plan first.", command: "gh-polish ready prepare --json" }
    ]);
  }
  if (parsed.confirmations.length === 0) {
    throw new ProtocolError("CONFIRMATION_REQUIRED", `Command 'ready ${subcommand}' requires --confirm <effect-id> for every create effect.`, [
      { action: "List the plan's confirmation-gated effects.", command: `gh-polish ready review --plan ${planReference} --json` }
    ]);
  }

  if (subcommand === "review") {
    const review = await reviewAgentRepositoryReady({
      artifactReference: planReference,
      planStore: runtime.store,
      confirmations: parsed.confirmations
    });
    return jsonResult(successEnvelope("ready.review", { mutation: "none", ...review }));
  }

  const reviewToken = readStringFlag(parsed, "review-token");
  if (!reviewToken) {
    throw new ProtocolError("REVIEW_TOKEN_REQUIRED", "Command 'ready execute' requires --review-token from ready review.", [
      { action: "Mint the review token with the exact confirmations.", command: `gh-polish ready review --plan ${planReference} --confirm <effect-id> --json` }
    ]);
  }
  if (parsed.flags.get("live") !== true) {
    throw new ProtocolError("LIVE_FLAG_REQUIRED", "Command 'ready execute' mutates live GitHub and requires the explicit --live flag.", [
      { action: "Re-run with the explicit live mutation opt-in and exact repository allowlist." }
    ]);
  }
  const repository = readStringFlag(parsed, "repo");
  if (!repository) {
    throw new ProtocolError("REPOSITORY_ALLOWLIST_REQUIRED", "Command 'ready execute' requires --repo <owner/name> as the exact allowlist entry.", [
      { action: "Re-run with the exact repository allowlist entry." }
    ]);
  }
  const repositoryId = Number(readStringFlag(parsed, "repo-id"));
  if (!Number.isSafeInteger(repositoryId) || repositoryId <= 0) {
    throw new ProtocolError("REPOSITORY_ID_REQUIRED", "Command 'ready execute' requires --repo-id <number> matching the fetched GitHub repository id.", [
      { action: "Fetch the repository id first.", command: `gh api repos/${repository} --jq .id` }
    ]);
  }

  const credential = resolveLiveGitHubCredential(env);
  const artifact = await loadPlanArtifact(planReference, runtime.store);
  const context = await detectRepositoryContext(artifact.repository.root);
  const review = await reviewAgentRepositoryReady({
    artifactReference: planReference,
    planStore: runtime.store,
    confirmations: parsed.confirmations
  });
  const previousEvidence = await readPreviousEvidence(readStringFlag(parsed, "previous-evidence"));

  const composition = await composeLiveExecution({
    credential,
    artifact,
    context,
    enableMutation: true,
    requestedRepository: repository,
    allowlistedRepository: repository,
    expectedRepositoryId: repositoryId,
    expectedReviewToken: review.review.token,
    suppliedReviewToken: reviewToken,
    confirmations: parsed.confirmations
  });

  const result = await executeAgentRepositoryReady({
    artifactReference: planReference,
    planStore: runtime.store,
    branchName: composition.authorization.headBranch,
    confirmations: parsed.confirmations,
    reviewToken,
    pullRequest: {
      title: readStringFlag(parsed, "pr-title") ?? `chore: repository ready (gh-polish plan ${artifact.id})`,
      body: readStringFlag(parsed, "pr-body") ?? defaultPullRequestBody(artifact.id, parsed.confirmations)
    },
    ...(previousEvidence ? { previousEvidence } : {}),
    now: runtime.now
  }, composition.executor, composition.pullRequests, composition.revisionChecks);

  return jsonResult(successEnvelope("ready.execute", {
    mutation: "live-github",
    live: {
      repository: composition.authorization.repository,
      repositoryId: composition.authorization.repositoryId,
      branch: composition.authorization.headBranch,
      credentialSource: credential.source
    },
    ...result
  }));
}

function toProtocolCommand(command: Command, subcommand: string | undefined): ProtocolCommand {
  if (command !== "ready") return command;
  return isReadySubcommand(subcommand) ? (`ready.${subcommand}` as ProtocolCommand) : "ready.prepare";
}

function readProfileFlag(parsed: ParsedArgs): RepositoryProfile {
  const value = parsed.flags.has("profile") ? parsed.flags.get("profile") : "public-project";
  if (value !== "public-project") {
    throw new ProtocolError("PROFILE_UNSUPPORTED", "Repository Ready currently supports only the public-project profile.", [
      { action: "Use the supported profile.", command: "gh-polish ready prepare --profile public-project --json" }
    ]);
  }
  if (!repositoryProfiles.includes(value)) {
    throw new ProtocolError("PROFILE_UNSUPPORTED", `Unknown profile '${String(value)}'.`);
  }
  return value;
}

function readStringFlag(parsed: ParsedArgs, name: string): string | undefined {
  const value = parsed.flags.get(name);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function scanExistingTemplatePaths(root: string): Promise<Set<string>> {
  const targets = [...new Set(registry.map((template) => template.targetPath))];
  const existing = new Set<string>();
  await Promise.all(targets.map(async (target) => {
    try {
      await access(join(root, target));
      existing.add(target);
    } catch {
      // A missing file is simply not part of the existing-path set.
    }
  }));
  return existing;
}

async function readPreviousEvidence(path: string | undefined): Promise<RepositoryReadyExecutionEvidence | undefined> {
  if (!path) return undefined;
  try {
    return JSON.parse(await readFile(path, "utf8")) as RepositoryReadyExecutionEvidence;
  } catch {
    throw new ProtocolError("PREVIOUS_EVIDENCE_INVALID", `Unable to read previous execution evidence from '${path}'.`, [
      { action: "Re-run execute without --previous-evidence to start from the reviewed plan." }
    ]);
  }
}

function defaultPullRequestBody(planId: string, confirmations: readonly string[]): string {
  return [
    "## Summary",
    "",
    `Repository Ready effects executed by gh-polish for plan \`${planId}\`.`,
    "",
    "## Verification",
    "",
    `Confirmed effects: ${confirmations.map((id) => `\`${id}\``).join(", ")}.`,
    "Exact-revision checks are bound to this branch and SHA; merge remains an explicit human decision.",
    ""
  ].join("\n");
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
