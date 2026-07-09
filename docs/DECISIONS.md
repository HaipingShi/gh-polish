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
