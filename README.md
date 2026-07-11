# gh-polish

gh-polish is an agent-native project launch and stewardship workflow for people who build with AI but do not want to become GitHub experts first.

It is designed to help an AI coding agent move a working idea toward a credible repository, a visible and verifiable launch, and eventually continuous maintenance. The builder supplies product intent; the coding agent explains and drafts; the deterministic gh-polish kernel owns inspection, plans, policy, mutation gates, and evidence.

## Product Path

1. **P0 Deterministic Foundation:** inspect, plan, apply, verify, evidence, and recovery.
2. **P1 Repository Ready:** understandable, runnable, trustworthy repository presentation and engineering basics.
3. **P2 Launch Ready:** verified demo, visuals, release, launch preview, and feedback path.
4. **P3 Web Workspace:** human-oriented decisions, previews, diffs, evidence, and project control.
5. **P4 GitHub App Stewardship:** installation-scoped, event-driven, and scheduled maintenance.
6. **P5 Growth Loop:** launch distribution, feedback signals, and evidence-backed improvement cycles.
7. **P6 Portfolio and Team:** multi-project and organization stewardship.

Later stages are deliberately planned even though the current implementation remains focused on P0.

## Current State

Status: P0 module prototype, not yet an end-to-end MVP.

The repository contains first-pass TypeScript modules and tests for:

- local repository context;
- read-only GitHub access;
- local and remote analysis;
- operation policy and dry-run planning;
- template selection;
- guarded apply interfaces;
- workflow-run summaries;
- no-real-mutation harness checks.

The public CLI still exposes stub behavior and is not wired into the implemented modules. Plans are not yet durable, identity-bound execution artifacts, and no real-repository read-only dogfood has been recorded.

## Intended Agent Interface

```bash
gh-polish inspect --json
gh-polish plan --profile public-project --json
gh-polish apply --plan .gh-polish/plans/<plan-id>.json
gh-polish verify --plan <plan-id>
```

These commands describe the intended contract, not the currently completed CLI behavior.

## Safety Principles

- `inspect` and `plan` are read-only.
- Mutation starts from a repository-bound saved plan.
- High-impact changes require explicit confirmation and plain-language impact.
- File changes use a branch and pull request by default.
- Existing project work is preserved unless replacement is explicitly approved.
- AI may draft content, but deterministic policy owns authorization and completion claims.
- Generated tests, workflows, deployments, and product claims require evidence.

## Development

```bash
npm run typecheck
npm test
npm run build
npm run ci
```

The implementation uses Node.js 22, TypeScript, and Node's built-in test runner.

## Project Documents

- [North Star](docs/NORTH_STAR.md)
- [Product Requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Product Roadmap](docs/MVP_TASKS.md)
- [Task Graph](docs/TASK_GRAPH.md)
- [GitHub Capabilities](docs/GITHUB_CAPABILITIES.md)
- [CodeRail Tasks](docs/TASKS.md)
- [Blueprint Index](docs/BLUEPRINTS.md)
- [Harness Specification](docs/HARNESS_SPEC.md)
- [Decisions](docs/DECISIONS.md)

## Governance

This repository uses the local CodeRail runtime at `G:\codeRail\coderail`. Product and design work uses Light Rail; implementation, schema, API, dependency, persistence, runner, release, and external-integration work uses Full Rail.

The next executable slice is T-014: wire agent-native read-only `inspect` and `plan`, define the versioned repository-bound plan artifact, and complete a no-mutation dogfood run.
