# North Star

Status: current
Last reviewed: 2026-07-09
Owner: project maintainer

## Outcome

- gh-polish helps builders turn a freshly pushed GitHub repository into a credible, maintainable, and safer project without making surprising changes.
- The durable outcome is a repeatable post-push workflow that produces a readable plan, applies approved improvements through a pull request, and reports whether the repository is healthier after checks run.

## Current Bet

- A local CLI with strong plan/apply separation delivers more trust and faster iteration than starting with a hosted GitHub App.
- Most target users already have a local checkout, a GitHub remote, and either `gh auth token` or `GITHUB_TOKEN`.
- A CLI can inspect local files and remote state together, then create a branch and PR with minimal setup.

## Invariants

- The user must be able to see a dry-run plan before mutation.
- High-risk GitHub settings must require explicit confirmation.
- The default mutation path is branch plus pull request, not direct default-branch edits.
- Existing repository-specific files and settings must be preserved unless the user approves a replacement.
- Every meaningful change must include verification steps and evidence.
- GitHub API access must be isolated behind an adapter.
- Analyzer, planner, applier, monitor, and policy responsibilities must remain separate.
- The product should degrade gracefully when token permissions are missing.
- Local and remote mutations must be traceable to a saved plan.
- CodeRail is the project governance rail: non-trivial work must map to G/T/S/V/X/P before implementation.
- Light Rail is valid for product/design/ADR work; Full Rail is required for code, API, runners, persistence, release, and external integration work.

## Current Slice

Milestone: MVP first implementation track.

Execution Batch: MVP roadmap T-001 through T-012 is implemented at first-pass test-covered depth.

Active Task: Wire CLI inspect/plan to implemented modules and run a read-only dogfood pass.

- CLI-first workflow.
- Local repository and GitHub remote inspection.
- Structured plan generation.
- Template-backed file changes for repository docs, hygiene files, and basic workflows.
- Conservative GitHub API changes for metadata and topics.
- Pull-request-based apply.
- Actions/check monitoring.
- Verification harness that blocks unintended real GitHub mutation.

## Non-Goals

- Do not build a Web UI before the CLI proves the workflow.
- Do not implement a hosted GitHub App in the MVP.
- Do not mutate GitHub settings during `inspect` or `plan`.
- Do not directly edit the default branch by default.
- Do not treat gh-polish as a general code refactoring agent.

## Known Unknowns

- Final implementation language and packaging format.
- Exact GitHub token permission behavior across fine-grained tokens, classic tokens, GitHub Apps, and `GITHUB_TOKEN`.
- How much README/template customization is useful before it becomes noisy.
- Which stack-specific CI templates produce the highest success rate across real projects.

## Decision Debt

- Choose implementation stack after MVP-001 framing.
- Decide whether CodeRail scripts are vendored, referenced as an external tool, or installed as a dev dependency.
- Define the saved plan schema before planner implementation.
- Define the minimum supported GitHub token scopes for MVP apply.

## First Principles

Agents can suggest, draft, and automate, but they must not surprise the owner of the repository.

Repository polish includes low-risk file generation and high-risk GitHub settings. Low-risk file changes still need a visible plan, but they can usually be applied through a branch and PR. High-risk GitHub settings, including branch rulesets, required checks, security feature toggles, Pages changes, Actions policy changes, and release automation, must always be dry-run plus explicit user confirmation before any real mutation.

The agent is a steward, not an owner. It should make the professional path easy while keeping the user in control.

## Coordinate Rule

Every active task must map to this North Star through its G field. If G cannot identify an Outcome, Current Bet, Invariant, or Current Slice, the task is not ready for implementation.

## Stop Triggers

- A task cannot map to the North Star.
- A code change has no task or trace link.
- Handoff introduces a new direction but this file is unchanged.
- A done task lacks verification evidence or manual acceptance.
- User intent changes Outcome, Current Bet, or Invariants.
- A high-risk GitHub mutation is requested without dry-run and confirmation.

## Drift Signals

- A task has T/S/V but no meaningful G.
- S expands repeatedly without X triggering.
- V passes but P is not synced.
- `plan` and `apply` responsibilities start blending.
- GitHub API calls appear outside the adapter layer.
- High-risk settings are implemented before policy gates.
