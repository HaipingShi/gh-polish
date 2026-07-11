# North Star

Status: current
Last reviewed: 2026-07-11
Owner: project maintainer

## Drive Contract

- Mode: continuous
- Next-task mode: activate
- Terminal condition: T-016 is done with M0 completion evidence and M1 Repository Ready has an accepted executable contract.
- Progress signal: active-task acceptance items and passing fresh verification increase without scope violations.
- Retry budget: 3
- No-progress limit: 2
- Human gates: only CodeRail Stop conditions or decision-grade product/security/persistence/API changes.

## Outcome

gh-polish helps people with little or no software-development or GitHub knowledge move an AI-built idea from working code to a credible, visible, launch-ready, and sustainably maintained project.

The durable result is not merely a cleaner repository. People can understand the project, trust it, try it, see that it is maintained, and know how to respond.

## Product Thesis

AI coding agents have made implementation accessible, but launch and stewardship still assume expertise in GitHub, CI, documentation, releases, deployment, security, and distribution. gh-polish supplies that missing workflow.

- **Builder:** owns product intent and consequential decisions; may not understand GitHub mechanics.
- **AI coding agent:** operates gh-polish, drafts contextual assets, and explains state in ordinary language.
- **gh-polish kernel:** deterministically inspects, plans, gates, executes, verifies, and records evidence.
- **GitHub and Web platforms:** infrastructure and later delivery surfaces.

## Current Bet

- Start with an agent-native local CLI because target builders already rely on coding agents.
- Treat the CLI as a stable machine interface, not the final human experience.
- Reuse `git`, GitHub CLI/APIs, official sources, and mature inspectors behind adapters.
- Prove one trustworthy repository workflow before adding hosted state, Web UI, or GitHub App execution.
- Keep shared plan, policy, artifact, evidence, and lifecycle contracts portable across future delivery adapters.

## Maturity Path

1. **M0 Agent-Native Deterministic Kernel:** safe inspect, plan, apply, verify, evidence, and recovery.
2. **M1 Repository Ready:** understandable, runnable, and professionally presented repository basics.
3. **M2 Trust Ready:** explicit license, support, security, CI, dependency, and permission evidence.
4. **M3 Demo and Launch Ready:** verified demo, visuals, release, feedback path, and truthful launch assets.
5. **M4 Web Workspace:** novice-friendly decisions, previews, plans, evidence, and execution control.
6. **M5 GitHub App Continuous Stewardship:** installation-scoped event and scheduled maintenance through plans and PRs.
7. **M6 Growth, Portfolio, and Team:** distribution, feedback, multi-project, collaborator, policy, and organization stewardship.

Later stages are planned but not authorized in the current implementation slice. Deferred means sequenced, not removed.

## Invariants

- The builder owns product decisions; technical defaults must not masquerade as user intent.
- Ask product-level questions instead of GitHub implementation questions when safe defaults exist.
- `inspect` and `plan` are read-only; mutation begins from a visible, repository-bound saved plan.
- High-impact operations require explicit confirmation and plain-language impact.
- File changes use a branch and pull request by default; direct default-branch edits are initially refused.
- Preserve repository-specific work unless replacement is explicitly approved.
- Link each operation to repository identity, lifecycle state, verification evidence, and recovery.
- AI may draft, but deterministic policy owns authorization, staleness, scope, and completion claims.
- Never imply a test, workflow, deployment, screenshot, badge, or feature has evidence when it does not.
- GitHub access stays behind adapters and degrades with actionable permission/authentication guidance.
- CLI, Web UI, and GitHub App share domain contracts rather than duplicating behavior.
- CodeRail governs non-trivial work through explicit rail, coordinate, verification, persistence, and trace.

## Current Slice

Milestone: M0 Agent-Native Deterministic Kernel, integration and dogfood track.

- First-pass modules exist for repository context, GitHub reads, analysis, policy, planning, templates, guarded apply, monitoring, and tests.
- The public CLI now provides the versioned read-only `inspect -> plan -> apply --dry-run -> verify` path over local context and analysis.
- Plans are durable, identity-bound local artifacts; the M0 public CLI remains validation-only.
- Read-only dogfood evidence exists for this repository.
- T-015 and T-016 complete the executable M0 kernel evidence. The next authorized step is an M1 Repository Ready contract; M1 implementation must remain profile-aware and evidence-backed.

## Legacy Cutoff

- Enforcement starts at: T-013

Earlier tasks remain historical evidence. T-013 is the first task verified against the current local CodeRail runtime at `G:\codeRail\coderail`.

## Current Non-Goals

- No hosted service, Web UI, or GitHub App before M0 is trustworthy, and no hosted-vendor decision in the current Light Rail work.
- No competing general-purpose agent loop, code-refactoring platform, or proprietary replacement for commodity GitHub tooling.
- No automatic high-risk ruleset, Actions-policy, Pages, security, release, or default-branch mutation in M0.
- No single opaque repository score as the primary builder experience.

## Known Unknowns and Decision Debt

- Best coding-agent integration/discovery format and boundary between agent creation and kernel validation.
- Evidence that reliably defines Repository Ready and Launch Ready for different project profiles.
- Trusted permission/confirmation experience and hosted persistence, tenancy, billing, and vendors, deferred to M4/M5 contracts.

## First Principles

- A working project is not yet a launchable project.
- Visibility without credibility disappoints; credibility without visibility stays obscure.
- The workflow ends when the builder understands the result and next action, not when an API returns.
- The agent explains and creates; the kernel authorizes and proves.
- Recommendations must fit the project profile and be earned by evidence.
- Reuse infrastructure; differentiate through orchestration, safe judgment boundaries, and the path to launch.

## Stop and Drift Signals

- Stop when work cannot map to maturity/evidence, or a later stage enters without prerequisites and a new contract.
- Stop when mutation lacks plan identity, confirmation, or recovery, or generated claims lack evidence.
- Drift exists when the product becomes only a linter/template/API wrapper, claims hosted capability before M0, or makes users configure routine GitHub mechanics.
- Drift exists when delivery adapters duplicate policy, deferred stages disappear, or `plan` and `apply` blend.
