# gh-polish

gh-polish is an agent-native project launch and stewardship workflow for people who build with AI but do not want to become GitHub experts first.

It is designed to help an AI coding agent move a working idea toward a credible repository, a visible and verifiable launch, and eventually continuous maintenance. The builder supplies product intent; the coding agent explains and drafts; the deterministic gh-polish kernel owns inspection, plans, policy, mutation gates, and evidence.

## Product Path

1. **M0 Agent-Native Deterministic Kernel:** inspect, plan, apply, verify, evidence, and recovery.
2. **M1 Repository Ready:** understandable, runnable, and professionally presented repository basics.
3. **M2 Trust Ready:** explicit license, support, security, CI, dependency, and permission evidence.
4. **M3 Demo and Launch Ready:** verified demo, visuals, release, launch preview, and feedback path.
5. **M4 Web Workspace:** human-oriented decisions, previews, diffs, evidence, and project control.
6. **M5 GitHub App Continuous Stewardship:** installation-scoped, event-driven, and scheduled maintenance.
7. **M6 Growth, Portfolio, and Team:** distribution, feedback, multi-project, and organization stewardship.

Later stages are deliberately planned even though the current implementation remains focused on M0.

## Current State

Status: M0 module prototype, not yet an end-to-end MVP.

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
