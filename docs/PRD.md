# gh-polish Product Requirements

## Product Definition

gh-polish is an agent-native project launch and stewardship workflow. It helps non-technical vibe coders take software created with AI coding agents from working code to a credible GitHub repository, a visible and verifiable launch, and eventually continuous maintenance.

The first product surface is a local CLI operated by an AI coding agent. Later delivery surfaces include a human-oriented Web workspace and an installation-scoped GitHub App. All surfaces share the same plan, policy, artifact, evidence, and lifecycle contracts.

## Problem

AI coding agents reduce the expertise required to implement an idea, but publishing and maintaining the result still assumes knowledge of Git, GitHub, CI, pull requests, permissions, releases, deployment, documentation, security posture, and distribution.

The target user often delegates `git push` to an agent and does not understand the GitHub UI or service model. Existing linters, checklists, templates, security scorecards, and GitHub APIs solve isolated technical tasks. They do not guide a novice from "the code works" to "other people can understand, trust, try, and discover it."

## User and Operator Model

| Role | Responsibility |
|---|---|
| Builder | States the idea, audience, visibility, ownership, and launch intent; approves consequential product decisions. |
| AI coding agent | Reads the project, invokes gh-polish, drafts contextual assets, explains choices, and carries the conversation. |
| gh-polish kernel | Inspects evidence, classifies risk, creates and validates plans, executes approved operations, and records results. |
| GitHub | Hosts source, pull requests, checks, releases, project metadata, and later App installation events. |
| Web workspace | Later human control plane for decisions, previews, plans, evidence, and multiple projects. |

The Builder is the user even when the AI coding agent performs every command.

## Jobs To Be Done

- When my AI-built project works locally, help me publish it professionally without requiring me to learn GitHub first.
- Tell me what is missing in ordinary language and choose safe defaults where my intent is clear.
- Ask me only the product questions that cannot be inferred safely.
- Show what will change before changing it, and make risky actions difficult to perform accidentally.
- Help people understand, trust, try, and share the project.
- Continue to tell me when the project needs attention after launch.

## Product Promise

The builder can say, "Help me publish and prepare this project," and the coding agent can use gh-polish to:

1. establish repository and permission context;
2. inspect code, project metadata, documentation, workflows, and remote state;
3. classify the current maturity stage with evidence;
4. ask a small number of plain-language product questions;
5. produce a reviewable plan and previews;
6. apply approved file changes through a pull request and separately gate immediate remote changes;
7. monitor verification and explain failures;
8. request final approval when a merge, release, deployment, or launch action is ready;
9. report the achieved stage and next meaningful step.

## Maturity Model

### M0 Agent-Native Deterministic Kernel

- Agent-facing CLI with stable JSON and exit codes.
- Local and GitHub context preflight.
- Versioned, repository-bound, stale-detecting plans.
- Policy and confirmation gates.
- Idempotent apply, per-operation evidence, recovery, and verification.
- Read-only dogfood and then allowlisted mutation dogfood.

### M1 Repository Ready

- Project-type profiles: public project, private project, demo, library, application, and commercial product.
- Context-aware README and repository metadata.
- Accurate install, run, test, build, contribution, and project-status information.
- Community, issue, and pull-request entry points appropriate to the project profile.
- Guided pull-request checks and merge completion.

### M2 Trust Ready

- License intent and selection are explicit rather than silently generated.
- Support, security contact, privacy, and contribution expectations are usable and do not leak private data.
- CI, dependency automation, permissions, and supply-chain recommendations are evidence-backed.
- No fake-green workflow, invented test, unverified badge, or unsupported security claim.
- Risk and recovery explanations are understandable without GitHub expertise.

### M3 Demo and Launch Ready

- Verified demo or deployment URL.
- Screenshots, short demo media, social preview, and project visuals.
- Release readiness and release notes.
- Value proposition, target audience, known limitations, roadmap, and feedback path.
- Launch Pack with channel-specific drafts and a fact/evidence ledger.
- Launch preview that distinguishes verified claims from drafts requiring approval.

### M4 Web Workspace

- GitHub sign-in and repository selection.
- Maturity-stage view with evidence and next actions.
- Plain-language decision wizard.
- Plan, diff, README, screenshot, demo, release, and social-card previews.
- Execution state, checks, recovery, and confirmation controls.
- Initial multi-project workspace without organization-wide automation.

### M5 GitHub App Continuous Stewardship

- Least-privilege installation and repository selection.
- Webhook-triggered and scheduled inspection.
- Pull-request comments, Checks, suggested plans, and maintenance PRs.
- Drift detection for documentation, commands, demos, dependencies, releases, and repository policy.
- Installation-scoped evidence, audit, retry, and recovery.
- Explicit confirmation remains mandatory for high-impact changes.

### M6 Growth, Portfolio, and Team

- Reusable launch campaigns and channel-specific publishing assistance.
- Visibility and feedback signals connected to improvement suggestions.
- Evidence-backed project updates, changelogs, and relaunch workflows.
- Clear separation between assistance, preview, and external publication.
- Multi-repository portfolio and health views.
- Shared templates, brand assets, and policy profiles.
- Collaborator roles, approval boundaries, and organization stewardship.
- Batch recommendations with repository-specific plans and evidence.

## M0 Functional Requirements

### Inspect

- Detect repository root, remotes, owner/name, current/default branch, dirty state, and base revision.
- Detect project stacks, package managers, lockfiles, monorepo signals, existing assets, and supported commands.
- Read normalized GitHub metadata and capability state through an adapter.
- Return typed degraded states with actionable recovery instructions.

### Plan

- Produce human-readable and machine-readable representations of one plan.
- Bind the plan to repository identity, base revision, relevant file hashes, tool/schema version, and expiry policy.
- Record assumptions, operations, risk, confirmation, verification, expected evidence, and recovery behavior.
- Distinguish create, patch, replace-with-confirmation, remote mutation, and manual recommendation.
- Refuse to represent unsupported or unverified actions as ready.

### Apply

- Load rather than reconstruct the saved plan.
- Reject mismatched repository identity, stale base state, altered operation payloads, and missing confirmations.
- Separate pull-request file changes from immediate GitHub setting mutations.
- Record per-operation state and partial-failure recovery.
- Be idempotent and resumable where possible.

### Verify

- Bind checks to the target pull request and revision rather than repository-wide workflow history.
- Summarize success, pending, failure, missing evidence, and permission limitations.
- Never claim a test, workflow, deployment, or generated asset succeeded without evidence.
- Return one executable recovery or next step.

## Builder Experience Requirements

- Prefer product questions such as project visibility, intended audience, contribution intent, support contact, and launch goal.
- Avoid asking users to choose GitHub permissions, rulesets, workflow syntax, or branch policy when a safe profile can decide.
- Translate technical failures into impact, required owner action, and an agent-executable recovery step.
- Preserve an advanced diagnostic view for the coding agent without exposing it as the primary builder experience.

## Reuse Strategy

gh-polish should orchestrate rather than replace commodity capabilities:

- use `git` for local repository operations;
- use GitHub CLI and GitHub APIs for authentication, repository state, pull requests, and checks behind adapters;
- use official GitHub workflow and community-health sources where appropriate;
- integrate mature repository and security inspectors when their contracts are reliable;
- let the calling AI agent create contextual prose and visuals, while gh-polish validates placement, claims, evidence, and authorization.

## Safety and Trust Requirements

- `inspect` and `plan` are read-only.
- Mutation requires an identity-bound saved plan.
- High-impact operations require explicit confirmation and plain-language impact.
- File changes default to branch and pull request.
- Existing content is preserved by default.
- Generated commands and workflows must be derived from detected evidence or blocked for review.
- Secrets, private paths, service names, and hidden environment data must not leak into public artifacts.
- Each operation records evidence and a recoverable next action.
- Hosted and App stages must retain the same safety guarantees as the CLI stage.

## Success Metrics

### M0/M1 Activation

- A coding agent can complete read-only inspect and plan on a supported repository without undocumented manual setup.
- A builder can understand the proposed outcome and required decisions within five minutes through the agent explanation.
- A first Repository Ready pull request can be produced within fifteen minutes for a supported project.
- No mutation occurs during inspect or plan.
- Every executed operation maps to a saved plan and per-operation evidence.

### Product Outcome

- Builders progress from working code to Repository Ready and then Launch Ready.
- A launch-ready project has a verified way to try it, truthful presentation assets, and a feedback path.
- Users return because stewardship finds meaningful drift and produces useful, reviewable fixes.
- Later Web and App adoption reuses the same plans and evidence rather than creating an opaque automation path.

## Risks

- A broad vision can hide an unwired core; each stage requires explicit entry evidence.
- AI-generated polish can overstate product capability; claims need evidence and previews.
- Novice-friendly defaults can become patronizing or wrong; retain explanations and reversible plans.
- Hosted services introduce tenancy, privacy, installation, billing, and reliability concerns; defer vendor commitments until contracted.
- Distribution assistance can become spam; external publication must remain explicit and channel-aware.
- Repository maturity is contextual; avoid universal checklists and opaque scores.

## Current Release Boundary

The repository currently contains test-covered prototype modules, not a user-complete MVP. T-014 must prove the trusted M0 thin slice before M1 feature breadth, M4 Web UI, or M5 GitHub App implementation expands.
