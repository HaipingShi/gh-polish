# gh-polish

gh-polish is an agent-driven GitHub repository polish workflow for turning a freshly pushed project into a cleaner, more professional, and more maintainable repository.

Status: MVP CLI skeleton.

## Who It Is For

- Vibe coders who ship quickly and want their GitHub projects to look credible.
- Solo builders who need repeatable repository cleanup after pushing code.
- Small teams that want lightweight hygiene without a platform team.
- Open-source maintainers who want safer defaults for docs, templates, CI, and repository settings.

## MVP Goal

The MVP is a CLI-first workflow that inspects local project files and GitHub repository state, generates a reviewable plan, applies approved changes through a branch and pull request, and monitors the resulting GitHub Actions/checks.

The MVP focuses on:

- Repository metadata: description, homepage, topics, license, README, badges.
- Hygiene files: `.gitignore`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue templates, PR template.
- Engineering readiness: CI workflow, test/lint/build detection, Dependabot, CodeQL.
- GitHub features: Actions/check monitoring, labels/milestones read, branch ruleset recommendations, Pages/release/security status where permitted.

## Example Commands

```bash
gh-polish inspect
gh-polish plan
gh-polish apply --plan <plan-id>
gh-polish monitor --pr <number>
```

The current T-001 implementation supports these command names as safe stubs. `apply` only supports non-mutating dry-run behavior.

## Safety Principles

- `inspect` and `plan` are read-only.
- Every change starts as a dry-run plan.
- High-risk GitHub settings require explicit confirmation.
- File changes are applied through a branch and pull request by default.
- gh-polish does not directly edit the default branch in the MVP.
- GitHub API access is isolated behind an adapter.
- Tests must prevent real GitHub mutation unless an explicit environment flag is set.

## Current Design Docs

- [PRD](docs/PRD.md)
- [North Star](docs/NORTH_STAR.md)
- [Architecture](docs/ARCHITECTURE.md)
- [GitHub Capabilities](docs/GITHUB_CAPABILITIES.md)
- [MVP Tasks](docs/MVP_TASKS.md)
- [CodeRail Tasks](docs/TASKS.md)
- [Blueprint Index](docs/BLUEPRINTS.md)
- [Harness Spec](docs/HARNESS_SPEC.md)
- [Decisions](docs/DECISIONS.md)

## Development Governance

This repository uses CodeRail as its repo-local governance rail. Non-trivial work must start from a task coordinate in `docs/TASKS.md`:

- G: Goal mapped to `docs/NORTH_STAR.md`
- T: exact task
- S: allowed and forbidden scope
- V: verification evidence or explicit manual acceptance
- X: stop conditions
- P: persistence and trace targets

Design and ADR work uses Light Rail. Code, API, runner, schema, dependency, release, and external integration work uses Full Rail.

## Next Implementation Slice

The first implementation task should be MVP-001: create the minimal CLI contract, command help, exit codes, and a no-mutation test harness foundation.
