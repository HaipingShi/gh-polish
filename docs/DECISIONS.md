# Decisions

This file records meaningful product and architecture decisions. New decisions should be appended as ADRs and linked from tasks when relevant.

## ADR-001: CLI-first instead of GitHub App first

- Status: Accepted
- Date: 2026-07-09

### Context

gh-polish needs to inspect both local project files and GitHub repository state. The target users are solo builders, vibe coders, and small teams that can run a local command more easily than installing and configuring a GitHub App.

### Decision

Start with a local CLI. The CLI will authenticate with `gh auth token` or `GITHUB_TOKEN`, inspect the local checkout, call GitHub APIs through an adapter, generate plans, and apply approved changes through branch and pull request workflows.

### Consequences

- Faster MVP iteration.
- No hosted service or installation flow required.
- Easier access to local files and git state.
- Users must run the tool locally or in CI.
- A future GitHub App can reuse analyzer, planner, policy, adapter, and template layers.

## ADR-002: Plan/apply separation

- Status: Accepted
- Date: 2026-07-09

### Context

Repository polish can include low-risk files and high-risk GitHub settings. Users need to understand proposed changes before the agent mutates anything.

### Decision

Separate `plan` from `apply`. `inspect` and `plan` are read-only. `plan` produces a saved dry-run artifact with operation list, risks, confirmations, verification steps, and evidence targets. `apply` executes only a saved and approved plan.

### Consequences

- Users can review changes before execution.
- Plans become testable snapshots.
- Applies can be traced to a specific plan.
- Implementation must handle stale plans and confirmation state.

## ADR-003: Default PR-based mutation instead of direct main mutation

- Status: Accepted
- Date: 2026-07-09

### Context

Direct mutation of the default branch is risky and surprising. The product's target users need safety without heavy process.

### Decision

Default apply behavior creates a branch, commits file changes, pushes the branch, and opens a pull request. Direct default-branch mutation is not part of MVP behavior.

### Consequences

- Changes are reviewable in GitHub.
- GitHub Actions and required checks can run naturally.
- Users can edit or close the generated PR.
- The tool must manage branch naming, stale branches, and PR evidence.

## ADR-004: Adapter layer for GitHub API

- Status: Accepted
- Date: 2026-07-09

### Context

GitHub integration includes many surfaces: repository metadata, topics, contents, pull requests, Actions, checks, labels, milestones, rulesets, Pages, releases, and security features. Token permissions and API behavior vary.

### Decision

All GitHub API calls must go through a dedicated adapter layer. Core modules receive normalized domain objects and typed degraded states rather than raw API responses.

### Consequences

- Analyzer, planner, applier, and monitor stay testable.
- Mocked API integration tests can cover permissions and failure modes.
- Future support for GraphQL, REST, `gh` CLI fallback, or GitHub App auth can be added behind the boundary.
- The adapter must maintain clear contracts and fixtures.

## ADR-005: Adopt CodeRail v0.7.3 as repo-local governance

- Status: Accepted
- Date: 2026-07-09

### Context

The project requires CodeRail discipline: align to North Star before coding, keep task contracts explicit, record decisions, define verification gates, and prevent agent drift. The user provided the canonical CodeRail repository at `https://github.com/HaipingShi/coderail.git`.

### Decision

Use CodeRail v0.7.3 concepts and templates as the repository-local governance layer. Add the CodeRail runtime entry files, task contracts, blueprint index, handoff/status files, trace files, and asset boundary docs. Treat design/ADR work as Light Rail and implementation/API/harness work as Full Rail.

### Consequences

- Every non-trivial task must map to G/T/S/V/X/P.
- Architecture and lifecycle complexity must be reflected in `docs/BLUEPRINTS.md`.
- Correctness-sensitive implementation tasks require TDD evidence or an explicit waiver.
- Completion claims need verification or manual acceptance.
- Additional governance docs exist before business code, but they make future agent work resumable and auditable.

## ADR-006: Keep CodeRail scripts external until implementation stack is chosen

- Status: Accepted
- Date: 2026-07-09

### Context

CodeRail provides Python scripts for doctor, blueprint, trace, TDD, done, CI, inspect, and closeout checks. gh-polish has not yet chosen its implementation language or package layout.

### Decision

For the design phase, reference the cloned CodeRail scripts as an external governance tool and do not vendor them into the repository. Revisit this during MVP-001 when the implementation stack and dev dependency strategy are chosen.

### Consequences

- The repository stays focused on product/design artifacts for now.
- Governance checks can still be run from the CodeRail reference clone.
- MVP-001 must decide whether to vendor CodeRail scripts, install from Git URL, or document an external CodeRail dependency.

## ADR-007: Node.js and TypeScript for the CLI skeleton

- Status: Accepted
- Date: 2026-07-09

### Context

gh-polish is CLI-first and likely to be distributed to builders who already use GitHub, npm, and local developer tooling. T-001 needs a small command skeleton, test harness, and mutation guard without pulling in unnecessary framework weight.

### Decision

Use Node.js 22, TypeScript, and Node's built-in test runner. Do not add a runtime CLI framework in T-001. Keep the command parser tiny until real planner/analyzer boundaries require more structure.

### Consequences

- The package can later be distributed through npm with a `gh-polish` binary.
- TypeScript gives strict contracts for the CLI result and mutation guard.
- The test harness can run without credentials or external services.
- The project currently has zero runtime dependencies and two dev dependencies: TypeScript and Node type definitions.
- CLI parsing may need to be replaced or wrapped when command complexity grows.

## ADR-008: Repository context uses local git CLI with injected runner

- Status: Accepted
- Date: 2026-07-09

### Context

MVP-002 needs to identify the local repository root, current/default branch, dirty state, and GitHub remotes without contacting GitHub. The tool must stay read-only and testable with mocked git output.

### Decision

Use the local `git` executable for repository context detection, isolated behind an injectable `GitRunner`. Parse GitHub remote URLs locally and support HTTPS, SCP-like SSH, and `ssh://` GitHub URL forms. Keep GitHub API access out of this layer.

### Consequences

- Repository detection works without credentials or network access.
- Tests can mock git output and also smoke-test a temporary git repository.
- Git behavior remains close to what users already have locally.
- Future code must keep remote API inspection in the GitHub adapter, not in repository context detection.

## ADR-009: GitHub adapter read layer is fetch-injected and GET-only

- Status: Accepted
- Date: 2026-07-09

### Context

The remote analyzer and monitor need GitHub repository state, but the product safety model forbids accidental mutation during inspect and plan. MVP-003 must be testable without credentials or live network access.

### Decision

Implement a `GitHubReadAdapter` that accepts an injected fetch implementation and exposes only read methods. The adapter sends GitHub REST headers, including `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2026-03-10`, matching the current GitHub REST documentation. Token resolution is limited to explicit token, `GH_TOKEN`, and `GITHUB_TOKEN`; `gh auth token` subprocess integration is deferred to a separate task.

### Consequences

- Tests can fully mock GitHub API responses without credentials.
- Permission failures, missing resources, rate limits, network failures, and invalid responses become typed degraded states.
- No write endpoint is available from the adapter in MVP-003.
- Future write behavior must use a separate policy-gated adapter surface or a clearly named mutation layer.

## ADR-010: Serve the builder through an external AI coding agent

- Status: Accepted
- Date: 2026-07-11

### Context

The target builder may have no development experience and may delegate even basic Git and GitHub operations to an AI coding agent. A conventional expert-facing CLI would require the user to learn the infrastructure that the product is meant to hide safely.

### Decision

Treat the builder as the beneficiary and decision owner, the external AI coding agent as the primary operator and explainer, and gh-polish as the deterministic execution kernel. The first CLI is an agent-facing structured interface, not the final human user interface. Do not build a competing general-purpose agent loop in M0.

### Consequences

- Structured JSON, stable exit behavior, capability discovery, and actionable degraded states are primary CLI requirements.
- The coding agent may interpret context and draft content, but authorization, plan validation, mutation, and evidence remain deterministic.
- Builder questions should concern product intent rather than GitHub mechanics whenever policy can choose a safe default.
- Future Web UI and GitHub App adapters must use the same core contracts rather than reimplementing product rules.

## ADR-011: Expand the outcome from repository polish to launch and stewardship

- Status: Accepted
- Date: 2026-07-11

### Context

AI coding has shifted the builder constraint from implementing an idea toward making the idea understandable, credible, visible, usable, and maintained. Repository hygiene is necessary but does not by itself help another person discover or try the project.

### Decision

Define the durable product outcome as the path from AI-built working code through Repository Ready, Launch Ready, Web Workspace, GitHub App Stewardship, Growth Loop, and Portfolio/Team stages. Retain the gh-polish name and safe repository workflow as the entry point, while treating visibility and ongoing stewardship as explicit later-stage outcomes.

### Consequences

- README, repository configuration, CI, launch assets, demos, releases, feedback, maintenance, and growth are connected by one maturity path.
- Product success is measured by stage progression and evidence, not only file presence or an opaque score.
- Later stages must be planned now but cannot enter implementation before their entry gates and contracts.
- The product category is an AI-native project launch and stewardship workflow rather than a generic GitHub wrapper.

## ADR-012: Deferred stages remain planned architecture runway

- Status: Accepted
- Date: 2026-07-11

### Context

Calling Web UI, GitHub App, growth, or portfolio capabilities "deferred" can accidentally erase them from design decisions. Implementing their infrastructure during M0 would create premature complexity, but ignoring them could bind the core to local files and one CLI process.

### Decision

Use ports for interaction, auth, events, artifacts, plans, evidence, GitHub operations, and storage where they represent an explicit staged need. Implement only local M0 adapters now. Require new architecture, threat, persistence, tenancy, and vendor decisions before hosted or App work.

### Consequences

- M0 avoids databases, queues, hosted identity, billing, and App infrastructure.
- Domain records must carry repository identity and execution context rather than assuming a local path is sufficient.
- Web UI and GitHub App are delivery adapters over shared plans and policy.
- Blueprint gates make future infrastructure requirements visible without claiming current implementation.

## ADR-013: Use evidence-backed maturity instead of a single repository score

- Status: Accepted
- Date: 2026-07-11

### Context

A single score is easy to display but can reward superficial checklist completion, treat unlike projects identically, and hide what a novice builder should do next.

### Decision

Report named maturity stages with evidence, unmet outcomes, and one meaningful next action. Profiles may vary requirements by project type and visibility. Component-level diagnostics may use measurements, but the primary builder experience must not collapse the project into one unexplained number.

### Consequences

- A demo, private tool, public library, and commercial application can have different readiness evidence.
- The Web workspace can show progress without gamifying unverified artifacts.
- Recommendations must explain why they matter and what evidence completes them.

## ADR-014: Make Trust Ready an explicit maturity gate

- Status: Accepted
- Date: 2026-07-11

### Context

Repository presentation and launch visibility are different from trust. A project can look polished or have a working demo while its license, support path, security contact, CI claims, dependency posture, or permissions remain ambiguous. Folding trust into a generic repository or launch stage makes false confidence more likely.

### Decision

Extend ADR-011 with the explicit sequence: M0 Agent-Native Deterministic Kernel, M1 Repository Ready, M2 Trust Ready, M3 Demo and Launch Ready, M4 Web Workspace, M5 GitHub App Continuous Stewardship, and M6 Growth/Portfolio/Team. Each stage has evidence-backed entry and exit conditions in the roadmap and harness.

### Consequences

- Repository readiness no longer implies legal, security, CI, or maintenance trust.
- Launch work cannot begin from presentation alone; M2 evidence must be reliable first.
- Web UI and GitHub App move to M4 and M5 without changing their planned responsibilities.
- Growth, multi-project, team, and organization capabilities share M6 but must still receive separate implementation contracts when activated.

## ADR-015: Keep M0 plan artifacts outside the inspected repository

- Status: Accepted
- Date: 2026-07-11

### Context

T-014 must persist a versioned, reloadable plan while keeping `inspect`, `plan`, validation-only `apply`, `verify`, and repository dogfood free of project-file writes. A repository-local `.gh-polish/plans` store would make a read-only command alter the project it is inspecting.

### Decision

Store M0 plan artifacts in a local application-data directory outside the repository. The CLI returns the plan ID and resolved path; `apply` and `verify` accept either. `GH_POLISH_PLAN_STORE_DIR` provides a deterministic local override for tests and controlled environments. The artifact binds its schema, repository identity, base SHA, relevant content hashes, expiry, immutable payload, and digest.

### Consequences

- M0 commands leave the inspected project and GitHub state untouched while still supporting save/reload across processes.
- A caller may retain the returned path without committing plan state to the repository.
- Later repository-local or hosted plan storage requires a new contract because it changes the persistence and mutation boundary.

## ADR-016: Prove Repository Ready PR execution without live GitHub credentials

- Status: Accepted
- Date: 2026-07-11

### Context

T-017 proved truthful read-only previews. The next lifecycle step needs real Git branch and push behavior plus a pull-request boundary, but a production GitHub adapter would introduce credential, permission, and user-repository risk before the execution contract is proven.

### Decision

T-018 uses a digest-validated saved PlanArtifact, temporary repositories, local bare remotes, an injected idempotent PR adapter, and an exact-revision check adapter. The coordinator derives only explicitly confirmed file effects and binds repository, plan, base branch, head branch, pushed head SHA, PR, and checks; it records local, PR, and check stages separately. Successful exact-revision checks mean `ready-for-review`, never automatic merge. No live GitHub adapter or credential path is added.

### Consequences

- Branch isolation, overwrite refusal, partial failure, recovery, and deduplication are executable without network access.
- A mocked PR result is verification evidence for the port contract, not evidence that a live GitHub PR exists.
- Live GitHub dogfood remains a separate approval boundary requiring a named repository and credential authority.
