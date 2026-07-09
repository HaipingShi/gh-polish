#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { assertRealGitHubMutationAllowed } from "./mutationGuard.js";

const COMMANDS = ["inspect", "plan", "apply", "monitor"] as const;
type Command = (typeof COMMANDS)[number];

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
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
    "  inspect   Inspect local and GitHub repository state (stubbed in T-001)",
    "  plan      Generate a dry-run polish plan (stubbed in T-001)",
    "  apply     Apply an approved plan; only --dry-run is available in T-001",
    "  monitor   Monitor pull request checks (stubbed in T-001)",
    "",
    "Options:",
    "  --dry-run       Do not mutate local files or GitHub state",
    "  --plan <id>     Plan identifier or path for apply dry-run",
    "  --help, -h      Show help",
    "  --version, -v   Show version",
    ""
  ].join("\n");
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = argv[0]?.startsWith("-") ? undefined : argv[0];
  const rest = command ? argv.slice(1) : argv;
  const flags = new Map<string, string | boolean>();
  const positionals: string[] = [];

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith("--") && !value.startsWith("-")) {
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

    if (value === "--dry-run") {
      flags.set("dry-run", true);
      continue;
    }

    if (value === "--plan") {
      const next = rest[index + 1];
      if (!next || next.startsWith("-")) {
        flags.set("plan", "");
      } else {
        flags.set("plan", next);
        index += 1;
      }
      continue;
    }

    flags.set(value.replace(/^-+/, ""), true);
  }

  return { command, flags, positionals };
}

function isCommand(value: string | undefined): value is Command {
  return typeof value === "string" && COMMANDS.includes(value as Command);
}

function commandSummary(command: Command, dryRun: boolean): string {
  const mode = dryRun ? "dry-run" : "read-only stub";
  return [
    `command: ${command}`,
    `mode: ${mode}`,
    "status: not implemented in T-001",
    "mutation: none"
  ].join("\n");
}

export function runCli(argv: readonly string[], env: NodeJS.ProcessEnv = process.env): CliResult {
  const parsed = parseArgs(argv);

  if (!parsed.command || parsed.flags.get("help")) {
    return { code: 0, stdout: usage(), stderr: "" };
  }

  if (parsed.flags.get("version")) {
    return { code: 0, stdout: "0.0.0\n", stderr: "" };
  }

  if (!isCommand(parsed.command)) {
    return {
      code: 1,
      stdout: "",
      stderr: `Unknown command: ${parsed.command}\n\n${usage()}`
    };
  }

  const dryRun = parsed.flags.get("dry-run") === true;

  if (parsed.command === "apply") {
    if (parsed.flags.has("plan") && parsed.flags.get("plan") === "") {
      return { code: 2, stdout: "", stderr: "Missing value for --plan\n" };
    }

    if (!dryRun) {
      const guard = assertRealGitHubMutationAllowed(env);
      return {
        code: 2,
        stdout: "",
        stderr: `${guard.reason}\nUse --dry-run for the T-001 CLI skeleton.\n`
      };
    }
  }

  return { code: 0, stdout: `${commandSummary(parsed.command, dryRun)}\n`, stderr: "" };
}

export function main(): void {
  const result = runCli(process.argv.slice(2));
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  process.exitCode = result.code;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
