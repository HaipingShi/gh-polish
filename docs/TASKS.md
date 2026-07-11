# Tasks

## Status Legend

- `[ ]` todo
- `[~]` doing
- `[!]` blocked
- `[x]` done
- `[f]` failed
- `[r]` reopened

Task result at closeout may be `done`, `stage-complete`, `blocked`, `failed`, or `deferred`. `stage-complete` usually keeps Status as `[~]`.

## Active Task Chain

## T-000 Initial product design and CodeRail alignment

Status: [x]
Type: docs
Rail: light
Priority: P1
Owner: project maintainer
Branch: none

### CodeRail Coordinate

G — Goal:
- North Star: Establish a credible, safe post-push GitHub repository polish workflow before implementation.
- Outcome served: The MVP can start from a shared PRD, architecture, capability matrix, harness, decisions, and CodeRail governance state.

T — Task:
- Produce design-phase documents for gh-polish and align the repository with CodeRail v0.7.3 governance templates from `https://github.com/HaipingShi/coderail.git`.

S — Scope:
- Allowed:
  - `README.md`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `docs/*.md`
  - `docs/TRACELOG.jsonl`
- Forbidden:
  - Business code directories.
  - Real GitHub mutation.
  - Default-branch mutation workflows.

V — Verify:
- TDD mode: waived
- Red check: not applicable; design-only Light Rail task.
- Green check: required documents exist and Mermaid fences are balanced.
- Refactor check: docs are split by durable concern, not a single dump.
- Regression check: no business code directories created.
- CI check: CodeRail doctor from the referenced repository can inspect governance files.
- Waiver reason: This is product/design/ADR work.
- Harness:
  - File existence check.
  - Mermaid fence check.
  - CodeRail doctor check.
- Manual acceptance:
  - User reviews design docs and confirms the next implementation slice.

X — Stop:
- CodeRail reference repository is unavailable.
- Requested changes require business code implementation.
- A high-risk GitHub mutation is requested before a plan/apply policy exists.

P — Persist:
- TASKS: this task card.
- HANDOFF: current resume anchor and next executable step.
- DECISIONS: ADRs for architecture and governance.
- LESSONS: none yet.
- ASSETS: CodeRail reference source.
- TRACE: trace event for design and governance alignment.

### Task Contract

Depends on:
- User request defining gh-polish project positioning and design deliverables.
- CodeRail repository URL from user.

Blocks:
- MVP-001 implementation until the user accepts the design direction.

Acceptance:
- [x] PRD, North Star, Architecture, GitHub Capabilities, MVP Tasks, Harness Spec, Decisions, and README exist.
- [x] CodeRail runtime files are present for repo-local governance.
- [x] Architecture includes renderable Mermaid diagrams.
- [x] Next implementation task is identified.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V can verify the change or manual acceptance is explicit.
- [x] P was synced, at least TASKS and TRACE.

### Completion

Task result: stage-complete
Done gate: warning
Completed at: 2026-07-09
Commit: none
Harness result: local document checks and CodeRail doctor usable with warnings
Manual acceptance: pending user review
Handoff level: H1
Handoff updated: yes
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: T-001
Next executable step: Start T-001 by choosing the implementation stack and creating the minimal CLI contract.
Auto commit:
- Eligible: no
- Action: skipped
- Commit:
- Exact files staged:
- Safe to stage: design and governance docs only
- Do not stage: none identified
- Ignored/generated artifacts: temporary CodeRail clone outside repository
- Avoid git add .: yes
Notes: Repository is not initialized as a git repo in this workspace.

## T-001 Project skeleton and CLI contract

Status: [x]
Type: harness
Rail: full
Priority: P1
Owner: project maintainer
Branch: none; workspace is not a git repository

### CodeRail Coordinate

G — Goal:
- North Star: Start the CLI-first MVP while preserving inspect/plan read-only safety.
- Outcome served: A user can invoke stable CLI commands before any GitHub mutation code exists.

T — Task:
- Establish the minimal executable CLI shape without implementing polish logic.

S — Scope:
- Allowed:
  - Project package/config files chosen for the implementation stack.
  - CLI entrypoint.
  - Initial test harness.
  - README command examples if the command contract changes.
  - `docs/HARNESS_SPEC.md`, `docs/TASKS.md`, `docs/DECISIONS.md`, `docs/TRACELOG.jsonl`.
- Forbidden:
  - Real GitHub API writes.
  - Analyzer/planner/applier business logic beyond no-op stubs.
  - Direct mutation of default branch workflows.

V — Verify:
- TDD mode: optional
- Red check: not run; TDD mode optional for scaffold and no prior failing harness existed.
- Green check: CLI help, unknown command, dry no-op, and mutation guard tests pass.
- Refactor check: command definitions are contained in `src/cli.ts`; mutation policy stub is isolated in `src/mutationGuard.ts`.
- Regression check: `inspect` and `plan` no-op paths perform no file or network mutation.
- CI check: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run ci` pass.
- Waiver reason:
- Harness:
  - Unit/smoke tests for `--help`, unknown command, dry no-op.
  - Mutation guard test proving write operations are unavailable.
- Manual acceptance:
  - User approves command names and stack choice if a tradeoff remains.

X — Stop:
- Implementation stack choice conflicts with packaging or distribution goals.
- CLI contract requires real GitHub access before adapter policy is designed.
- Test harness cannot prove no-mutation behavior.

P — Persist:
- TASKS: update T-001 status and completion evidence.
- HARNESS_SPEC: record actual commands.
- DECISIONS: record implementation stack decision.
- TRACE: append task start and verification events.

### Task Contract

Depends on:
- T-000 design stage.

Blocks:
- MVP-002 repository context detection.
- MVP-003 GitHub API adapter read layer.

Acceptance:
- [x] CLI prints stable help.
- [x] Unknown commands fail with non-zero exit.
- [x] Dry no-op invocation succeeds without GitHub mutation.
- [x] No GitHub write code exists.
- [x] Tests can run locally without credentials.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V can verify the change or manual acceptance is explicit.
- [x] P was synced, at least TASKS and TRACE.

### Completion

Task result: done
Done gate: pass
Completed at: 2026-07-09
Commit: none; workspace is not a git repository
Harness result: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run ci`, CodeRail doctor, and done gate passed; closeout check returned warning because the newly initialized repository has prior untracked files outside T-002.
Manual acceptance: not required for scaffold; user explicitly requested T-001 execution
Handoff level: H1
Handoff updated: yes
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: MVP-002
Next executable step: Start MVP-002 Repository Context Detection.
Auto commit:
- Eligible: no
- Action: skipped
- Commit:
- Exact files staged:
- Safe to stage: `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`, `src/`, `test/`, and updated docs
- Do not stage: none identified
- Ignored/generated artifacts: `node_modules/`, `dist/`
- Avoid git add .: yes
Notes: Implementation stack selected as Node.js 22 + TypeScript + Node built-in test runner. T-001 intentionally contains no real GitHub API adapter or write endpoint.

## T-002 Repository context detection

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: main

### CodeRail Coordinate

G — Goal:
- North Star: Identify the local repository and remote GitHub target safely while preserving read-only inspect/plan behavior.
- Outcome served: gh-polish can understand the local git context before analyzer and GitHub adapter work begins.

T — Task:
- Implement MVP-002 Repository Context Detection.

S — Scope:
- Allowed:
  - Repository context module.
  - Git command wrapper or injected git runner abstraction.
  - Unit tests with mocked git outputs.
  - Temporary git repo smoke test.
  - Minimal CLI wiring only if needed to surface read-only context.
  - `docs/TASKS.md`, `docs/HARNESS_SPEC.md`, `docs/TRACELOG.jsonl`.
- Forbidden:
  - GitHub API calls.
  - Network access.
  - File writes outside temporary test repositories.
  - Analyzer, planner, applier, monitor, or template business logic.
  - Real GitHub mutation.

V — Verify:
- TDD mode: optional
- Red check: not run; TDD mode optional and implementation was scaffolded with tests in the same batch.
- Green check: HTTPS and SSH GitHub remotes parse correctly; outside-git error is clear; dirty state/default branch are reported.
- Refactor check: git command execution is injectable through `GitRunner`.
- Regression check: CLI skeleton still passes and no mutation guard is weakened.
- CI check: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run ci` pass.
- Waiver reason:
- Harness:
  - Unit tests with mocked git output.
  - Smoke test in a temporary git repository.
- Manual acceptance:
  - not required unless remote parsing ambiguity changes product behavior.

X — Stop:
- Git remote parsing is ambiguous and cannot be resolved safely.
- Implementation requires network calls or GitHub API access.
- Tests need to mutate the user's working tree.

P — Persist:
- TASKS: update T-002 status and completion evidence.
- HARNESS_SPEC: add repository context test commands if new commands are introduced.
- TRACE: append task start and verification events.

### Task Contract

Depends on:
- T-001 Project skeleton and CLI contract.

Blocks:
- MVP-003 GitHub API Adapter Read Layer.
- MVP-004 Local Analyzer.

Acceptance:
- [x] Works for HTTPS GitHub remotes.
- [x] Works for SSH GitHub remotes.
- [x] Reports clear error outside git.
- [x] Does not mutate files or GitHub state.
- [x] Tests run locally without credentials.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V can verify the change or manual acceptance is explicit.
- [x] P was synced, at least TASKS and TRACE.

### Completion

Task result: done
Done gate: pass
Completed at: 2026-07-09
Commit: none
Harness result: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run ci`, CodeRail doctor, done gate, and closeout check passed
Manual acceptance: not required
Handoff level: H1
Handoff updated: yes
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: MVP-003
Next executable step: Start MVP-003 GitHub API Adapter Read Layer.
Auto commit:
- Eligible: no
- Action: skipped
- Commit:
- Exact files staged:
- Safe to stage: `src/git.ts`, `src/repositoryContext.ts`, `test/repositoryContext.test.ts`, updated docs
- Do not stage: none identified
- Ignored/generated artifacts: `node_modules/`, `dist/`
- Avoid git add .: yes
Notes: Repository context detection is local and read-only. It does not call GitHub APIs and does not perform network operations. Temporary test repositories are created under the OS temp directory and removed after the smoke test. Closeout warning is staging-boundary noise from the newly initialized git repository, not a T-002 correctness failure.

## T-003 GitHub API adapter read layer

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: main

### CodeRail Coordinate

G — Goal:
- North Star: Encapsulate GitHub reads behind a testable adapter while preserving plan/apply safety.
- Outcome served: Analyzer and monitor work can consume normalized repository state without direct GitHub API calls.

T — Task:
- Implement MVP-003 GitHub API Adapter Read Layer.

S — Scope:
- Allowed:
  - Read-only GitHub adapter module.
  - Token resolution from environment variables.
  - Mocked fetch tests for repository metadata, topics, workflows, workflow runs, labels, milestones, and degraded errors.
  - No-write-endpoint guard tests.
  - `docs/TASKS.md`, `docs/HARNESS_SPEC.md`, `docs/DECISIONS.md`, `docs/TRACELOG.jsonl`.
- Forbidden:
  - GitHub write endpoints.
  - Real GitHub network tests.
  - Planner, analyzer, applier, monitor, or template business logic.
  - `gh auth token` subprocess integration unless separately contracted.

V — Verify:
- TDD mode: optional
- Red check: not run; TDD mode optional and adapter tests were introduced with implementation.
- Green check: mocked API tests cover successful reads and typed degraded states.
- Refactor check: GitHub API calls are isolated behind an injected fetch client.
- Regression check: CLI and repository context tests still pass; no write method or mutation endpoint exists.
- CI check: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run ci` pass.
- Waiver reason:
- Harness:
  - Unit tests with mocked fetch.
  - No-write-endpoint scan.
- Manual acceptance:
  - not required unless endpoint scope changes.

X — Stop:
- Adapter requires real credentials or live network access.
- Read layer needs write permissions.
- Endpoint scope expands into mutation or planner/applier behavior.

P — Persist:
- TASKS: update T-003 status and completion evidence.
- HARNESS_SPEC: record adapter read-layer test coverage.
- DECISIONS: record adapter read-only shape if needed.
- TRACE: append task start and verification events.

### Task Contract

Depends on:
- T-001 Project skeleton and CLI contract.
- T-002 Repository context detection.

Blocks:
- MVP-004 Local Analyzer.
- MVP-005 Remote Analyzer.
- MVP-011 Monitor Checks.

Acceptance:
- [x] No direct GitHub API calls outside adapter.
- [x] Token resolution supports environment tokens without credentials in tests.
- [x] Repository metadata read is supported.
- [x] Topics read is supported.
- [x] Actions workflows/runs reads are supported.
- [x] Labels and milestones reads are supported.
- [x] Permission/not-found/rate-limit errors return typed degraded states.
- [x] Tests run locally without credentials or live network.
- [x] No GitHub write endpoint or non-GET request is implemented.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V can verify the change or manual acceptance is explicit.
- [x] P was synced, at least TASKS and TRACE.

### Completion

Task result: done
Done gate: pass
Completed at: 2026-07-09
Commit: none
Harness result: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run ci`, CodeRail doctor, and done gate passed; closeout check returned warning because the newly initialized repository has prior untracked files outside T-003.
Manual acceptance: not required
Handoff level: H1
Handoff updated: yes
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: T-004
Next executable step: Start T-004 Local Analyzer.
Auto commit:
- Eligible: no
- Action: skipped
- Commit:
- Exact files staged:
- Safe to stage: `src/githubAdapter.ts`, `test/githubAdapter.test.ts`, updated docs
- Do not stage: none identified
- Ignored/generated artifacts: `node_modules/`, `dist/`
- Avoid git add .: yes
Notes: Adapter uses only GET requests and injected fetch in tests. Live GitHub calls are not exercised by the test suite. Official GitHub REST docs were checked for versioned headers and read endpoint surfaces. Closeout warning is staging-boundary noise from the newly initialized git repository, not a T-003 correctness failure.

## T-004 Local analyzer

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: main

### CodeRail Coordinate

G — Goal:
- North Star: Detect local repository hygiene and project stack before generating any polish plan.
- Outcome served: gh-polish can produce local findings for docs, templates, workflows, and stack signals without mutating files.

T — Task:
- Implement MVP-004 Local Analyzer.

S — Scope:
- Allowed:
  - Local analyzer module.
  - Read-only filesystem inspection helpers.
  - Fixture repositories under test fixtures.
  - Unit tests for Node, Python, Go, Rust, and generic signals.
  - `docs/TASKS.md`, `docs/HARNESS_SPEC.md`, `docs/TRACELOG.jsonl`.
- Forbidden:
  - GitHub API calls.
  - File writes outside test fixtures.
  - Planner/applier/template rendering behavior.
  - Real GitHub mutation.

V — Verify:
- TDD mode: optional
- Red check: not run; TDD mode optional and fixture tests were introduced with implementation.
- Green check: README, license, `.gitignore`, `.github` templates, workflows, Dependabot, CodeQL, manifests, and likely scripts are detected.
- Refactor check: analyzer returns deterministic findings and does not mutate.
- Regression check: CLI, repository context, and GitHub adapter tests still pass.
- CI check: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run ci` pass.
- Waiver reason:
- Harness:
  - Unit tests over fixture repositories.
- Manual acceptance:
  - not required unless detection scope changes.

X — Stop:
- Analyzer needs remote GitHub state.
- Analyzer needs to write files or render templates.
- Stack detection becomes speculative beyond fixture-backed evidence.

P — Persist:
- TASKS: update T-004 status and completion evidence.
- HARNESS_SPEC: record local analyzer fixture coverage.
- TRACE: append task start and verification events.

### Task Contract

Depends on:
- T-002 Repository context detection.

Blocks:
- MVP-007 Planner and Plan Schema.
- MVP-008 Template Registry.

Acceptance:
- [x] Detects common hygiene files.
- [x] Detects common GitHub workflow/config files.
- [x] Detects Node, Python, Go, Rust, and generic project signals.
- [x] Produces deterministic findings.
- [x] Does not mutate files.
- [x] Tests run locally without credentials.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V can verify the change or manual acceptance is explicit.
- [x] P was synced, at least TASKS and TRACE.

### Completion

Task result: done
Done gate: pass
Completed at: 2026-07-09
Commit: initial roadmap commit
Harness result: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run ci` pass
Manual acceptance: not required
Handoff level: H1
Handoff updated: yes
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: T-005-012
Next executable step: Complete closeout and commit the roadmap batch.
Auto commit:
- Eligible: yes
- Action: committed
- Commit: initial roadmap commit
- Exact files staged:
- Safe to stage: `src/localAnalyzer.ts`, `test/localAnalyzer.test.ts`, updated docs
- Do not stage: `node_modules/`, `dist/`
- Ignored/generated artifacts: `node_modules/`, `dist/`
- Avoid git add .: yes
Notes: Local analyzer is read-only and fixture-backed.

## T-005-012 Roadmap implementation batch

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: main

### CodeRail Coordinate

G — Goal:
- North Star: Complete the MVP roadmap surfaces while preserving dry-run, confirmation, adapter, and no-real-mutation invariants.
- Outcome served: gh-polish has test-covered remote analysis, policy, planning, templates, guarded apply, confirmed metadata apply surface, monitor summary, and harness gates.

T — Task:
- Execute MVP-005 through MVP-012 without stopping unless a decision-grade blocker appears.

S — Scope:
- Allowed:
  - Remote analyzer.
  - Policy engine.
  - Planner and plan schema helpers.
  - Template registry.
  - Guarded applier and confirmed metadata/topics apply interfaces.
  - Monitor summary.
  - Harness self-tests.
  - Unit tests and CodeRail docs.
- Forbidden:
  - Live GitHub mutation.
  - Unguarded write endpoints.
  - Direct default-branch mutation.
  - Planner/applier behavior that bypasses policy.

V — Verify:
- TDD mode: optional
- Red check: not run; tests were added with implementation.
- Green check: 28 Node tests pass across CLI, context, GitHub adapter, local/remote analyzer, policy, planner, templates, applier, monitor, and harness.
- Refactor check: read, plan, policy, template, apply, and monitor concerns are split into separate modules.
- Regression check: mutation guard remains closed by default and GitHub read adapter remains GET-only.
- CI check: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run ci` pass.
- Waiver reason:
- Harness:
  - Unit tests.
  - No-real-mutation guard tests.
  - GET-only GitHub read adapter test.
- Manual acceptance:
  - not required.

X — Stop:
- A task requires live GitHub credentials or real mutation.
- A task requires choosing a hosted service, database, or distribution policy.
- A high-risk GitHub setting would be mutated without dry-run and explicit confirmation.

P — Persist:
- TASKS: this batch summary.
- HARNESS_SPEC: roadmap coverage.
- DECISIONS: no new durable architecture decision required beyond existing ADRs.
- TRACE: implementation batch event.

### Task Contract

Depends on:
- T-001 through T-004.

Blocks:
- Real-world dogfood run against a sample repository.

Acceptance:
- [x] MVP-005 Remote Analyzer implemented with typed warnings.
- [x] MVP-006 Policy Engine implemented.
- [x] MVP-007 Planner and Plan Schema implemented.
- [x] MVP-008 Template Registry implemented with overwrite protection.
- [x] MVP-009 guarded Branch and PR apply flow implemented through injected clients.
- [x] MVP-010 confirmed metadata/topics apply surface implemented through injected client and env guard.
- [x] MVP-011 monitor summary implemented.
- [x] MVP-012 harness self-tests implemented.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V can verify the change or manual acceptance is explicit.
- [x] P was synced, at least TASKS and TRACE.

### Completion

Task result: done
Done gate: pass
Completed at: 2026-07-09
Commit: initial roadmap commit
Harness result: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run ci` pass
Manual acceptance: not required
Handoff level: H1
Handoff updated: yes
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: dogfood-readonly
Next executable step: Run a read-only dogfood pass on this repository or a fixture repository.
Auto commit:
- Eligible: yes
- Action: committed
- Commit: initial roadmap commit
- Exact files staged:
- Safe to stage: roadmap source, tests, package files, docs, CodeRail files
- Do not stage: `node_modules/`, `dist/`
- Ignored/generated artifacts: `node_modules/`, `dist/`
- Avoid git add .: yes
Notes: The apply flow can call injected mutation clients only when `GH_POLISH_ALLOW_REAL_GITHUB_MUTATION=1` is set and policy/confirmation checks pass. No live GitHub mutation was performed.

## T-013 Agent-native product direction refactor

Status: [x]
Type: design
Rail: light
Priority: P1
Owner: project maintainer
Branch: master

### CodeRail Coordinate

G — Goal:
- North Star: Evolve gh-polish into an agent-native project launch and stewardship workflow for non-technical vibe coders.
- Outcome served: Preserve the safe repository-polish kernel while planning the path from AI-built code to credible GitHub presence, Web visibility, launch readiness, continuous GitHub App stewardship, and later growth workflows.

T — Task:
- Normalize the current repository with the local CodeRail runtime and refactor the durable product direction, architecture evolution, capability stages, and roadmap.

S — Scope:
- Allowed:
  - README.md
  - docs/**
- Forbidden:
  - src/**
  - test/**
  - package.json
  - package-lock.json
  - tsconfig.json
  - dist/**
  - node_modules/**
  - G:\codeRail\coderail/**
  - real GitHub mutation

V — Verify:
- TDD mode: waived
- Verification result: passed through document consistency, scope, CodeRail, trace, and regression-CI evidence recorded for T-013.
- Red check: not applicable for a docs-only Light Rail refactor.
- Green check: durable documents agree on the new audience, outcome, maturity model, delivery surfaces, current slice, boundaries, and next executable Full Rail task.
- Refactor check: P0 is retained as the foundation; later Web UI, GitHub App, visibility, maintenance, and growth stages are explicitly planned without being implemented prematurely.
- Regression check: `npm run ci` passes and git diff contains no implementation changes.
- CI check: local CodeRail doctor, contract, coordinate, blueprint, trace, done, inspect, and closeout gates pass or report only documented warnings.
- Waiver reason: This task changes product direction and documents only.
- Harness:
  - Document consistency and Mermaid fence checks.
  - `python G:\codeRail\coderail\scripts\doctor.py --target .`
  - `npm run ci`
- Manual acceptance:
  - The user can revise the persisted direction; automated document and governance checks are accepted as completion evidence for this task.

X — Stop:
- Business code, package dependencies, real GitHub state, or local CodeRail source must change.
- The design requires selecting hosting, billing, identity, database, or queue vendors now.
- The AI coding agent and deterministic execution-kernel boundary cannot be stated clearly.

P — Persist:
- TASKS: T-013 coordinate and closeout.
- HANDOFF: new product direction and next implementation anchor.
- DECISIONS: agent-native product, maturity roadmap, and delivery-surface boundaries.
- LESSONS: only if a reusable failure appears.
- ASSETS: canonical document and local CodeRail reference updates.
- TRACE: T-013 intent, changes, verification, and generated trace index.

### Task Contract

Depends on:
- User clarification that gh-polish serves non-technical vibe coders through AI coding agents and must progress from P0 repository readiness toward Web UI, GitHub App, visibility, launch, and growth stages.

Blocks:
- T-014 agent-native CLI inspect/plan wiring and read-only dogfood.
- Later Web UI and GitHub App blueprint tasks.

Acceptance:
- [x] North Star expresses the path from AI-built idea to credible, visible, and maintained project.
- [x] PRD distinguishes user, operator, deterministic kernel, GitHub, and delivery surfaces.
- [x] Architecture preserves reusable core boundaries for CLI, Web UI, and GitHub App adapters.
- [x] Roadmap includes repository, launch, Web UI, GitHub App, growth, and portfolio/team stages.
- [x] Current implementation is described honestly as a test-covered module prototype with an unwired CLI.
- [x] Local CodeRail gates and regression CI provide fresh evidence.

### Critical Check

- [x] G maps to the revised product intent supplied by the user.
- [x] S explicitly protects implementation, dependencies, live GitHub state, and local CodeRail source.
- [x] V uses Light Rail document/governance checks without pretending a code TDD loop ran.
- [x] P includes TASKS, decisions, handoff, assets, and TRACE.

### Completion

Task result: done
Done gate: pass
Completed at: 2026-07-11
Commit: task-scoped closeout commit
Harness result: scope scan passed; Mermaid fences balanced; P0-P6 terminology consistent; contract/coordinate/blueprint checks healthy; `npm run ci` passed with 28 tests
Manual acceptance: automated Light Rail evidence accepted; user revision remains available
Handoff level: H1
Handoff updated: yes
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: T-014-contract
Next executable step: Create and accept the T-014 Full Rail contract for agent-native CLI wiring, versioned repository-bound plans, and read-only dogfood.
Auto commit:
- Eligible: yes
- Action: committed by CodeRail closeout check
- Commit: task-scoped closeout commit
- Exact files staged:
- Safe to stage: T-013-scoped product and CodeRail state documents only
- Do not stage: `src/**`, `test/**`, package files, generated output, and unrelated user changes
- Ignored/generated artifacts: `node_modules/`, `dist/`
- Avoid git add .: yes
Notes:
- Local CodeRail standard initialization skipped existing files and doctor reported healthy before this task began.
- T-013 used the local runtime at `G:\codeRail\coderail`; no clone, package installation, wholesale copy, or local CodeRail source modification occurred.

## Task Template

Copy this block and rename the heading to a real task ID when creating a real task.

```markdown
\## T-002 Short task title

Status: [ ]
Type: feature | bug | refactor | docs | harness | chore
Rail: full | light
Priority: P1 | P2 | P3
Owner:
Branch:

### CodeRail Coordinate

G — Goal:
- North Star:
- Outcome served:

T — Task:
-

S — Scope:
- Allowed:
  -
- Forbidden:
  - none

V — Verify:
- TDD mode: required | optional | waived
- Red check:
- Green check:
- Refactor check:
- Regression check:
- CI check:
- Waiver reason:
- Harness:
  -
- Manual acceptance:
  -

X — Stop:
- forbidden files needed
- harness fails twice with unclear root cause

P — Persist:
- TASKS:
- HANDOFF:
- DECISIONS:
- LESSONS:
- ASSETS:
- TRACE:

### Task Contract

Depends on:
-

Blocks:
-

Acceptance:
- [ ]
- [ ]

### Critical Check

- [ ] G maps to `docs/NORTH_STAR.md`.
- [ ] Changes stayed inside S.
- [ ] V can verify the change or manual acceptance is explicit.
- [ ] P was synced, at least TASKS and TRACE.

### Completion

Task result: done | stage-complete | blocked | failed | deferred
Done gate: pass | blocked | warning
Completed at:
Commit:
Harness result:
Manual acceptance:
Handoff level: H0 | H1 | H2 | H3
Handoff updated: yes | no
Trace:
Inspect status:
Resume anchor:
Next executable step:
Auto commit:
- Eligible: yes | no
- Action: committed | skipped | blocked | failed
- Commit:
- Exact files staged:
- Safe to stage:
- Do not stage:
- Ignored/generated artifacts:
- Avoid git add .: yes | no
Notes:
```

## Compact Summary Policy

When a completed chain becomes long, keep only status, key result, completion evidence, and trace backlink in TASKS. Move detailed logs, failed attempts, terminal output, and long rationale to TRACE_INDEX, RUNLOG, DECISIONS, or an archive. TASKS should stay fast to scan during recovery.
