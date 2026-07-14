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

## T-013F Residual Light Rail normalization

Status: [x]
Type: design
Rail: light
Priority: P1
Owner: project maintainer
Branch: master

### CodeRail Coordinate

G — Goal:
- North Star: Complete the unfulfilled parts of the merged product-direction Prompt without repeating T-013.
- Outcome served: Align the current CodeRail standard, maturity model, staged harness, governance metrics, and next Full Rail contract with the agent-native launch and stewardship direction.

T — Task:
- Incrementally merge missing local-standard entry rules, add the Trust Ready maturity boundary, evolve Harness/Metrics for CLI-to-Web/App stages, and create but do not execute the next Full Rail M0 contract.

S — Scope:
- Allowed:
  - AGENTS.md
  - CLAUDE.md
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
  - .github/**
  - G:\codeRail\coderail/**
  - real GitHub mutation

V — Verify:
- TDD mode: waived
- Red check: not applicable for Light Rail documents and governance entries.
- Green check: compatibility evidence, M0-M6 maturity, staged Harness, measurable Metrics, and unexecuted T-014 Full Rail contract are complete and consistent.
- Refactor check: T-013 work is not repeated and future delivery surfaces remain planned rather than implemented.
- Regression check: no implementation/config changes and `npm run ci` passes.
- CI check: local CodeRail doctor, contract, coordinate, blueprint, trace, done, inspect, CI, and closeout gates.
- Waiver reason: No code path, schema, dependency, runner, or external interface changes.
- Harness:
  - Template semantic diff, terminology scan, Mermaid/scope check, `npm run ci`, and local CodeRail scripts.
- Manual acceptance:
  - Automated Light Rail evidence accepted; T-014 execution requires its own Full Rail start.

X — Stop:
- Compatibility needs destructive overwrite or local CodeRail source changes.
- Work expands into implementation, dependencies, workflows, live GitHub state, or hosted-vendor selection.
- Target documents contain conflicting user changes that cannot be merged safely.

P — Persist:
- TASKS: T-013F closeout and T-014 future task anchor.
- HANDOFF: resume at T-014 activation.
- DECISIONS: only if a new durable decision appears.
- LESSONS: only for reusable failure evidence.
- ASSETS: retain the local CodeRail boundary.
- TRACE: T-013F intent/change/verify and refreshed index.

### Acceptance

- [x] Local standard entry differences are reviewed and missing Drive rules are incrementally merged.
- [x] Maturity stages explicitly distinguish Repository Ready, Trust Ready, and Demo/Launch Ready.
- [x] Harness covers current CLI kernel plus entry gates for future Web UI and GitHub App stages.
- [x] Metrics contain concrete current values and staged product/governance measures.
- [x] T-014 Full Rail Coordinate/Contract Draft is complete and explicitly unexecuted.
- [x] CodeRail and project-native verification evidence is fresh.

### Completion

Task result: done
Done gate: pass
Completed at: 2026-07-11
Commit: task-scoped closeout commit
Harness result: passed template compatibility, M0-M6 terminology, scope, code-fence, project CI, contract, coordinate, blueprint, and preliminary doctor checks
Manual acceptance: automated Light Rail evidence accepted
Handoff level: H1
Handoff updated: yes
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: T-014-start-gate
Next executable step: In a new Full Rail turn, inspect state, confirm CD-003/T-014, append the T-014 intent trace, and capture Red evidence before implementation.
Auto commit:
- Eligible: yes
- Action: committed by CodeRail closeout check
- Commit: task-scoped closeout commit
- Exact files staged:
- Safe to stage: T-013F-scoped governance and product documents only
- Do not stage: implementation, tests, package/build/workflow files, local CodeRail source, or unrelated changes
- Ignored/generated artifacts: `node_modules/`, `dist/`
- Avoid git add .: yes

## T-014 Trusted agent-native M0 thin slice

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: master
Execution state: completed with Red/Green, fixture, dogfood, CI, and Full Rail gate evidence.

### CodeRail Coordinate

G — Goal:
- North Star: Prove the M0 Agent-Native Deterministic Kernel through a trusted `inspect -> plan -> apply -> verify` path.
- Outcome served: Let a coding agent operate and explain a repository-bound workflow with deterministic plans, errors, recovery, and evidence while real GitHub mutation stays impossible.

T — Task:
- Wire the CLI to real context/analyzer modules, implement a versioned persisted plan contract, load and validate it in dry-run apply, and return plan-bound read-only verification for Node/generic fixtures and repository dogfood.

S — Scope:
- Allowed:
  - existing M0 CLI, context, GitHub-read, analyzer, planner, policy, applier, and monitor modules under src/**
  - new narrowly scoped M0 protocol, plan, error, evidence, store, and verification modules under src/**
  - corresponding tests and Node/generic fixtures under test/**
  - T-014-relevant README/docs and append-only trace
- Forbidden:
  - real GitHub mutation and write endpoints
  - writes to the user's project during inspect, plan, dry-run apply, verify, or dogfood
  - M1-M6 feature expansion
  - Web UI, GitHub App, hosted persistence, database, queue, billing, tenancy, OAuth, or deployment implementation
  - dependency/package/build/TypeScript/workflow changes without a revised contract
  - G:\codeRail\coderail/**

V — Verify:
- TDD mode: required
- Red check: failing tests for CLI integration, versioned plan schema/store, identity/base SHA/content hashes/digest/expiry, tamper/mismatch/stale rejection, JSON/exit contracts, and no-mutation dogfood.
- Green check: Node and generic fixtures complete `inspect -> plan -> apply --dry-run -> verify` deterministically with actionable errors and recovery.
- Refactor check: protocol, validation, persistence, verification, and orchestration ownership remain separate.
- Regression check: existing tests remain green, read adapter stays GET-only, mutation guard stays closed, and public protocol snapshots are reviewed.
- CI check: project-native lint/typecheck/test/build/ci plus local CodeRail TDD, CI, Done, Inspect, Trace, and Closeout gates.
- Waiver reason: none.
- Harness:
  - Unit, CLI integration/snapshot, temporary repository, local bare remote, Node/generic fixture, and read-only dogfood evidence defined in `docs/HARNESS_SPEC.md`.
- Manual acceptance:
  - Only for unresolved public command/JSON product tradeoffs; otherwise executable evidence is required.

X — Stop:
- Schema, persistence, or public protocol needs a new product decision.
- Required work crosses into mutation, dependencies/build, hosted infrastructure, M1-M6 breadth, or high-risk permissions.
- No-mutation dogfood cannot be proven or repeated gate failures have no clear cause.
- User changes conflict with required files and cannot be safely merged.

P — Persist:
- TASKS: Red/Green/Refactor evidence, acceptance, closeout, and next hardening step.
- HANDOFF: exact H1/H2/H3 resume anchor.
- DECISIONS: only durable plan/protocol/persistence decisions.
- LESSONS: repeated correctness or safety failures.
- ASSETS: schema/protocol/fixture inventory and generated boundary.
- TRACE: intent, Red, Green, change, dogfood, verify, and closeout events plus regenerated index.

### Task Contract

Depends on:
- T-013 agent-native product direction.
- T-013F staged harness, metrics, standard compatibility, and CD-003.

Blocks:
- T-015 effectful apply/evidence hardening.
- T-016 remote plan-bound verification and completion.
- M1 Repository Ready feature work.

Acceptance:
- [x] Stable agent-facing JSON envelope and exit-code contract for all four commands.
- [x] Versioned plan includes repository identity, base SHA, relevant content hashes, created/expiry data, immutable operation payloads/digest, risk, confirmations, verification, evidence, and recovery.
- [x] Plan is saved and reloaded rather than reconstructed for apply.
- [x] Dry-run apply rejects stale, tampered, expired, or repository-mismatched plans before effects.
- [x] Verify reports plan-bound read-only evidence and one executable next step.
- [x] Node and generic fixtures complete the thin slice with Red/Green evidence.
- [x] Read-only dogfood on this repository proves no project or GitHub mutation.
- [x] Project CI and CodeRail Full Rail gates pass.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V has executable Red/Green, fixture, dogfood, and project CI evidence.
- [x] P is synced through TASKS, DECISIONS, ASSETS, and append-only TRACE; index/status refresh is pending final gate.

### Completion

Task result: done
Done gate: pass
Completed at: 2026-07-11T03:09:19Z
Commit: task-scoped T-014 closeout commit
Harness result: Red test failed as expected; 6 focused T-014 fixture tests passed; `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run ci` passed with 35 tests; CodeRail TDD, CI, Contract, Coordinate, Blueprint, and Done gates passed.
Manual acceptance: not required; executable evidence governs the accepted M0 thin slice.
Handoff level: H1
Handoff updated: yes
Trace: TR-20260711-025814-t014, TR-20260711-030000-t014r, TR-20260711-030724-t014g, TR-20260711-030724-t014d, and final verify trace
Inspect status: pending final refresh
Resume anchor: T-015-contract-draft
Next executable step: Draft T-015 Trustworthy apply and evidence hardening; do not enable real mutation without a new Full Rail contract.
Auto commit:
- Eligible: yes
- Action: committed with manual exact-path staging after the Closeout scope parser warning
- Commit: task-scoped T-014 closeout commit
- Exact files staged: README, T-014 docs, `src/cli.ts`, `src/protocol.ts`, `src/planArtifact.ts`, `test/cli.test.ts`, and `test/t014.thinSlice.test.ts`
- Safe to stage: T-014-scoped source, tests, README, and docs
- Do not stage: `dist/`, `node_modules/`, external local plan artifacts, and unrelated changes
- Ignored/generated artifacts: `dist/`, `node_modules/`, local application-data plan store, generated trace/status files
- Avoid git add .: yes
Notes: M0 plan artifacts deliberately live outside the inspected repository under ADR-015.

### Start Gate

- Execution is intentionally not started by T-013F.
- A future turn must inspect current state, confirm CD-003/T-014 scope, record a T-014 intent trace, and capture Red evidence before implementation.

## T-015 Mutation-ready apply and evidence hardening

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: master
Autonomy: allowed
Execution state: CD-004 accepted; artifact-bound execution, retry/idempotency, local bare-remote isolation, read-only dogfood, and project CI pass. Final CodeRail finish/closeout is running.

### CodeRail Coordinate

G — Goal:
- North Star: Make M0 apply trustworthy through explicit authorization, branch isolation, per-operation evidence, and recoverable partial failure.
- Outcome served: An agent can report what an approved plan attempted and what happened without overstating execution or bypassing the builder's decisions.

T — Task:
- Build and locally prove a mutation-ready executor/evidence lifecycle for saved plans, limited to temporary repositories and local bare remotes; preserve the public CLI's validation-only behavior.

S — Scope:
- Allowed:
  - `src/localApply.ts`, `src/localGitExecutor.ts`, `src/planArtifact.ts`.
  - `test/t015.*.test.ts`.
  - `.coderail/coderail.py`, `.coderail/config.json` created by standard initialization.
  - T-015-relevant `docs/*.md` and append-only `docs/TRACELOG.jsonl` / generated index.
- Forbidden:
  - live GitHub or user-repository mutation, default-branch writes, user-facing execution, new dependencies/build changes, hosted infrastructure, M1-M6 work, and `G:\codeRail\coderail/**`.

V — Verify:
- TDD mode: required
- Red check: authorization, lifecycle, evidence, partial-failure, retry, and branch-isolation tests fail before implementation.
- Green check: Node/generic local fixtures execute only confirmed file operations on non-default branches against a local bare remote, with plan-bound evidence and recovery.
- Refactor check: validation, policy, execution, lifecycle, evidence, and CLI refusal stay separated.
- Regression check: T-014 remains read-only; GitHub adapter remains GET-only; mutation guard remains closed.
- CI check: project CI plus CodeRail Full Rail gates and a user-worktree before/after check pass.
- Waiver reason: none.
- Harness:
  - CD-004 local temporary-repository, bare-remote, fault-injection, and dogfood evidence.
- Manual acceptance:
  - Required only before a follow-on contract enables user-facing or live GitHub execution.

X — Stop:
- Stop if effect payload/digest/retry semantics become ambiguous, operations would be reconstructed, or any forbidden effect/dependency/hosted scope is required.

P — Persist:
- TASKS, HANDOFF, DECISIONS if durable, LESSONS if repeated, ASSETS, and append-only TRACE/index.

### Task Contract

Depends on:
- T-014 trusted agent-native M0 thin slice.
- CD-004 acceptance.

Blocks:
- T-016 remote plan-bound verification and completion hardening.
- M1 Repository Ready feature work.

Acceptance:
- [x] Saved-plan validation precedes every local effect.
- [x] Each effect needs explicit operation-level confirmation and is refused on the default branch.
- [x] Per-operation lifecycle/evidence and recovery remain plan/repository/branch/revision bound.
- [x] Partial failure does not report false completion and has a safe retry/recovery result.
- [x] Node/generic fixtures prove branch/file/push behavior only through local bare remotes.
- [x] Public CLI and this repository remain free of effectful apply and live GitHub mutation.
- [x] Project CI and CodeRail Full Rail gates pass.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V has Red/Green, artifact, retry/idempotency, bare-remote, dogfood, CI, and CodeRail evidence.
- [x] P is synced through TASKS, HANDOFF, CONTRACTS, NORTH_STAR, ASSETS/TRACE, and generated state.

### Start Gate

- CD-004 is accepted by the user.
- This execution turn must capture Red evidence before implementation and keep all effects inside test-owned temporary repositories.


Task result: done

Harness result: passed

Handoff level: H0

Handoff updated: no

Inspect status: refreshed

Drive decision: BLOCKED_DECISION

Resume anchor: docs/TASKS.md#T-015

Next executable step: Authorize a ready task or provide terminal evidence; do not invent backlog work.

Auto commit: requested
## T-016 Remote verification and completion hardening

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: master
Autonomy: allowed
Execution state: CD-005 accepted; Red TR-20260711-074000-t016r and Green TR-20260711-074229-t016g captured; state matrix, CI, and read-only dogfood pass. Final CodeRail closeout is running.

### CodeRail Coordinate

G — Goal:
- North Star: Complete M0 with remote evidence bound to the target plan, branch, and revision.
- Outcome served: Report truthful check state and one repair/next action without relying on unrelated workflow history.

T — Task:
- Implement and prove read-only target-bound remote verification and define M0 exit/M1 entry evidence.

S — Scope:
- Allowed:
  - `src/monitor.ts`, `src/githubAdapter.ts`, `src/protocol.ts`, new read-only verification modules, `test/t016*.test.ts`, minimal monitor/adapter tests, and T-016-relevant docs/trace/state.
- Forbidden:
  - GitHub writes, PR creation/merge, user-repository effects, live credentials in mandatory tests, dependencies/build/workflow changes, hosted or M1-M6 implementation, `G:\codeRail\coderail/**`.

V — Verify:
- TDD mode: required
- Red check: exact branch/SHA and state classification tests fail before implementation.
- Green check: mocked runs yield deterministic pending/success/failure/missing/permission-limited plan-bound evidence.
- Refactor check: transport, filtering, classification, and protocol remain separate.
- Regression check: GET-only adapter and all M0 safety tests remain green.
- CI check: project CI and CodeRail Full Rail gates plus read-only dogfood.
- Waiver reason: none.

X — Stop:
- Required mutation, live credentials, dependency changes, or ambiguous completion semantics.

P — Persist:
- TASKS, HANDOFF, NORTH_STAR/HARNESS/METRICS as needed, ASSETS, TRACE/index/status.

### Task Contract

Depends on:
- T-015 done.
- CD-005 accepted.

Blocks:
- M0 completion.
- M1 Repository Ready contract activation.

Acceptance:
- [x] Evidence filters runs by exact target branch and SHA.
- [x] Pending, success, failure, missing, and permission-limited states are deterministic.
- [x] Unrelated runs cannot satisfy completion.
- [x] Every non-success result includes one executable repair/next action.
- [x] GitHub adapter remains GET-only and mandatory tests need no credentials/network.
- [x] M0 exit and M1 entry evidence are persisted.
- [x] Project CI and CodeRail Full Rail gates pass.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V has Red/Green, state-matrix, regression CI, and no-mutation dogfood evidence.
- [x] P is synced through TASKS, HANDOFF, NORTH_STAR, HARNESS, ASSETS, and TRACE/index/status.

### Start Gate

- Continuous roadmap goal authorizes this read-only task.
- Capture Red evidence before implementation.


Task result: done

Harness result: passed

Handoff level: H0

Handoff updated: no

Inspect status: refreshed

Drive decision: BLOCKED_DECISION

Resume anchor: docs/TASKS.md#T-016

Next executable step: Authorize a ready task or provide terminal evidence; do not invent backlog work.

Auto commit: requested
## T-017 M1 profile-aware Repository Ready preview

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: master
Autonomy: allowed
Execution state: CD-006 accepted; Red TR-20260711-074600-t017r and Green TR-20260711-074800-t017g captured; CI and public-project no-mutation dogfood pass. Final closeout is running.

### CodeRail Coordinate

G — Goal:
- North Star: Produce a truthful profile-aware Repository Ready plan/preview before any PR mutation.
- Outcome served: Builders see appropriate repository artifacts and preserved custom work without invented facts.

T — Task:
- Implement six profiles and deterministic create/manual-review/unknown artifact previews for Node/generic fixtures.

S — Scope:
- Allowed:
  - new `src/repositoryProfile.ts`, `src/artifactPreview.ts`, minimal template-registry reuse, `test/t017*.test.ts`, and T-017 docs/trace/state.
- Forbidden:
  - repository/GitHub writes, PR creation, dependencies/build/workflow changes, invented commands/contacts/licenses, M2-M6 implementation, `G:\codeRail\coderail/**`.

V — Verify:
- TDD mode: required
- Red check: profile, preservation, observed-command, and unknown-evidence tests fail before implementation.
- Green check: Node/generic fixtures produce deterministic previews with no writes.
- Refactor check: profile policy, evidence, template rendering, and preview remain separate.
- Regression check: M0 safety and GET-only tests remain green.
- CI check: project CI and CodeRail Full Rail gates plus dogfood.
- Waiver reason: none.

X — Stop:
- Required builder intent cannot be defaulted safely, or any mutation/license/security/dependency/hosted scope appears.

P — Persist:
- TASKS, HANDOFF, NORTH_STAR/HARNESS/METRICS, ASSETS, TRACE/index/status.

### Task Contract

Depends on:
- T-016 done and M0 exit evidence.
- CD-006 accepted.

Blocks:
- Effectful Repository Ready PR contract.
- M2 Trust Ready.

Acceptance:
- [x] Six profiles have explicit artifact requirements.
- [x] Existing customized files always produce manual review, never overwrite.
- [x] Commands are observed from analysis or marked unknown.
- [x] Node/generic previews are deterministic and contain no invented facts.
- [x] Public-project dogfood produces no repository/GitHub mutation.
- [x] Project CI and CodeRail Full Rail gates pass.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes stayed inside S.
- [x] V has Red/Green, six-profile, preservation, command-evidence, CI, and dogfood evidence.
- [x] P is synced through TASKS, HANDOFF, NORTH_STAR/HARNESS/METRICS, ASSETS, and TRACE/index/status.

### Start Gate

- Continuous roadmap goal authorizes this read-only M1 slice.
- Capture Red evidence before implementation.


Task result: done

Harness result: passed

Handoff level: H0

Handoff updated: no

Inspect status: refreshed

Drive decision: BLOCKED_DECISION

Resume anchor: docs/TASKS.md#T-017

Next executable step: Authorize a ready task or provide terminal evidence; do not invent backlog work.

Auto commit: requested
## T-018 Effectful Repository Ready PR execution

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: master
Autonomy: allowed
Execution state: Final artifact-bound gap closed with third Red TR-20260711-082100-t018r and Green TR-20260711-082400-t018g; focused 9/9 and full CI 58/58 pass.

### CodeRail Coordinate

G — Goal:
- North Star: Turn an accepted Repository Ready preview into one reviewable branch and PR without overwriting customized work or bypassing confirmation.
- Outcome served: The builder receives plan-bound execution evidence and one truthful merge decision.

T — Task:
- Apply confirmed preview effects on a non-default branch, push to a local bare remote, create one PR through a mocked adapter, bind evidence, and remain idempotent.

S — Scope:
- Allowed:
  - `src/repositoryReadyExecution.ts`; minimal T-018 integration in `src/localApply.ts` and `src/localGitExecutor.ts`; `test/t018*.test.ts`; `docs/*.md`; and `docs/TRACELOG.jsonl`.
- Forbidden:
  - live GitHub or user-repository mutation, default-branch writes, automatic merge, settings mutation, release/deploy/publish, dependencies/build/workflow changes, M2-M6 implementation, `G:\\codeRail\\coderail/**`.

V — Verify:
- TDD mode: required
- Red check: branch/PR orchestration, overwrite refusal, idempotency, and partial-failure tests fail before implementation.
- Green check: Node/generic temporary repositories push one non-default branch and mocked PR evidence is bound to the plan and head SHA.
- Refactor check: local Git effects, PR adapter, orchestration, and evidence remain separate.
- Regression check: M0/T-017 safety, artifact integrity, and GET-only boundaries remain green.
- CI check: focused T-018 tests, project CI, blueprint, CodeRail Full Rail gates, and credential-free dogfood.
- Waiver reason: none.

X — Stop:
- Stop if implementation requires live credentials/repository writes, default-branch mutation, automatic merge, or contract-external product/security/persistence decisions.

P — Persist:
- CONTRACTS, TASKS, HANDOFF, DECISIONS, ASSETS, NORTH_STAR/HARNESS/METRICS, TRACE/index/status, and plan-bound execution evidence.

### Task Contract

Depends on:
- T-017 done.
- CD-007 accepted for local bare-remote and mocked PR-adapter verification.

Blocks:
- M1 Repository Ready completion evidence.
- Any separately approved live GitHub dogfood.

Acceptance:
- [x] Production-facing execution accepts immutable saved PlanArtifact effects and rejects tampered or missing payloads before local/PR/check adapters.
- [x] Only confirmed create effects execute on a non-default branch; customized content is never overwritten.
- [x] One idempotent mocked PR is bound to repository, plan, base branch, head branch, and pushed head SHA.
- [x] Exact plan/branch/head-SHA check evidence produces a truthful ready-for-review, not-ready, or unknown merge decision.
- [x] Retry after local or PR partial failure does not duplicate commits, pushes, effects, or PRs.
- [x] Default branch remains unchanged in Node and generic local bare-remote dogfood.
- [x] Failures provide truthful per-stage evidence and one executable recovery action.
- [x] Project CI and CodeRail Full Rail gates pass without credentials or live network access.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] Changes are constrained to T-018 S.
- [x] V has Red/Green, branch isolation, overwrite refusal, idempotency, partial-failure, CI, and dogfood evidence.
- [x] P is synced through CONTRACTS, TASKS, HANDOFF, DECISIONS, ASSETS, NORTH_STAR/HARNESS/METRICS, and TRACE.

### Start Gate

- User explicitly accepted CD-007 and deferred live GitHub dogfood.
- Capture Red evidence before implementation.


Task result: done

Harness result: passed

Handoff level: H0

Handoff updated: no

Inspect status: refreshed

Drive decision: BLOCKED_DECISION

Resume anchor: docs/TASKS.md#T-018

Next executable step: Authorize a ready task or provide terminal evidence; do not invent backlog work.

Auto commit: requested
## T-019 Credential-free Repository Ready end-to-end workflow

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: master
Autonomy: allowed
Execution state: Red TR-20260711-083900-t019r and drift Red TR-20260711-084100-t019r closed by Green TR-20260711-084400-t019g; focused 4/4 and full CI 62/62 pass.

### CodeRail Coordinate

G — Goal:
- Complete the M1 credential-free evidence chain from profile-aware preview to one truthful merge decision.

T — Task:
- Implement a two-phase prepare/execute workflow: preview -> external saved PlanArtifact, then explicit-confirmation execution -> local branch -> mocked PR -> exact-SHA checks -> merge decision.

S — Scope:
- Allowed:
  - `src/repositoryReadyWorkflow.ts`; minimal T-017/T-018 API reuse; `test/t019*.test.ts`; `docs/*.md`; and `docs/TRACELOG.jsonl`.
- Forbidden:
  - live GitHub/user repositories, default-branch writes, automatic merge, public CLI mutation activation, dependencies/build/workflow changes, hosted persistence, M2-M6, and `G:\\codeRail\\coderail/**`.

V — Verify:
- TDD mode: required
- Red check: end-to-end prepare/execute tests fail before the workflow module exists.
- Green check: Node/generic fixtures complete the credential-free chain with an external saved artifact and exact evidence.
- Refactor check: preview compilation, artifact persistence, and execution remain distinct phases.
- Regression check: T-014 through T-018 safety and GET-only boundaries remain green.
- CI check: focused T-019, project CI, blueprint, CodeRail Full Rail gates, and no-live-network dogfood.
- Waiver reason: none.

X — Stop:
- Stop if real credentials/repositories, implicit confirmation, automatic merge, public mutation CLI, or a new persistence/API decision becomes necessary.

P — Persist:
- CONTRACTS, TASKS, NORTH_STAR, HARNESS, DECISIONS, ASSETS, HANDOFF, TRACE/index/status.

### Task Contract

Depends on:
- T-017 and T-018 done.
- CD-008 accepted.

Blocks:
- Credential-free M1 end-to-end evidence.
- Any separately approved live GitHub adapter/dogfood contract.

Acceptance:
- [x] Prepare produces a deterministic profile-aware preview and saves a digest-valid PlanArtifact outside the inspected repository.
- [x] Only `create` preview items with evidence-backed content become explicitly confirmation-gated artifact effects.
- [x] `manual_review` and `unknown` items never become executable effects.
- [x] Node/generic fixtures preserve the default branch and reach a mocked PR plus exact-SHA merge decision.
- [x] Saved artifact reload, missing confirmation, tamper/stale refusal, and retry idempotency remain proven.
- [x] Full CI passes without credentials, network, or live GitHub effects; final CodeRail gates pending.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] S forbids all live mutation and new delivery surfaces.
- [x] V has Red/Green and complete end-to-end evidence.
- [x] P is synced through CONTRACTS, TASKS, NORTH_STAR, HARNESS, DECISIONS, ASSETS, HANDOFF, and TRACE.

### Start Gate

- User explicitly activated T-019/CD-008 as a Goal.
- Capture Red before implementation.


Task result: done

Harness result: passed

Handoff level: H0

Handoff updated: no

Inspect status: refreshed

Drive decision: BLOCKED_DECISION

Resume anchor: docs/TASKS.md#T-019

Next executable step: Authorize a ready task or provide terminal evidence; do not invent backlog work.

Auto commit: requested
## T-020 Agent-facing M1 protocol and completion report

Status: [x]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: master
Autonomy: allowed
Execution state: Red TR-20260711-085100-t020r closed by Green TR-20260711-085500-t020g; focused 2/2, full CI 64/64, and current-repository prepare/review no-mutation dogfood pass.

### CodeRail Coordinate

G — Goal:
- Let coding agents safely drive the credential-free M1 workflow and receive a truthful achieved/deferred report.

T — Task:
- Implement serializable prepare/review/execute contracts, deterministic review binding, and M1 completion reporting over T-019.

S — Scope:
- Allowed:
  - new `src/repositoryReadyAgentProtocol.ts`; minimal `src/repositoryReadyWorkflow.ts` reuse; `test/t020*.test.ts`; `docs/*.md`; and `docs/TRACELOG.jsonl`.
- Forbidden:
  - public CLI mutation activation, protocol v1 breaking changes, live GitHub/user repositories, credentials, default-branch writes, automatic merge, persistent review sessions, dependencies/build/workflow changes, hosted infrastructure, M2-M6, and `G:\\codeRail\\coderail/**`.

V — Verify:
- TDD mode: required
- Red check: prepare/review/execute contract and M1 completion tests fail before implementation.
- Green check: deterministic external-plan prepare, exact-confirmation review token, local/mock execute, and truthful achieved/deferred report pass.
- Refactor check: protocol mapping stays separate from workflow and adapters.
- Regression check: public CLI stays validation-only and T-014 through T-019 remain green.
- CI check: focused T-020, full CI, blueprint, CodeRail gates, and credential-free protocol dogfood.
- Waiver reason: none.

X — Stop:
- Stop if real credentials/repositories, public mutation CLI, breaking protocol v1, persistent sessions, or new API/persistence decisions become necessary.

P — Persist:
- CONTRACTS, TASKS, NORTH_STAR, HARNESS, DECISIONS, ASSETS, HANDOFF, TRACE/index/status.

### Task Contract

Depends on:
- T-019 done.
- CD-009 accepted.

Blocks:
- Stable agent-facing M1 integration.
- Any separately reviewed live GitHub adapter contract.

Acceptance:
- [x] `prepare` returns preview, plan reference, confirmation requirements, and explicit read-only/external-store effects.
- [x] `review` is repository-read-only, requires the exact effect IDs, and returns a deterministic artifact/confirmation-bound token.
- [x] `execute` rejects invalid review tokens before adapters and uses only injected local/mock ports.
- [x] Completion reports credential-free capability as achieved only with complete PR/check evidence.
- [x] Without a live adapter, live GitHub and overall M1 remain deferred rather than falsely achieved.
- [x] Public CLI remains M0 validation-only; focused/full CI, Blueprint, TDD, Done, and CodeRail closeout gates pass.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md`.
- [x] S preserves live GitHub, CLI, and persistence boundaries.
- [x] V has Red/Green, current-repository no-mutation dogfood, and truthful report evidence.
- [x] P is synced through CONTRACTS, TASKS, NORTH_STAR, HARNESS, DECISIONS, ASSETS, HANDOFF, and TRACE.

### Start Gate

- User explicitly activated T-020/CD-009 as a Goal.
- Capture Red before implementation.


Task result: done

Harness result: passed

Handoff level: H0

Handoff updated: no

Inspect status: refreshed

Drive decision: BLOCKED_DECISION

Resume anchor: docs/TASKS.md#T-020

Next executable step: Authorize a ready task or provide terminal evidence; do not invent backlog work.

Auto commit: requested
## T-021 Draft live GitHub adapter and dogfood contract

Status: [x]
Type: docs
Rail: light
Priority: P1
Owner: project maintainer
Branch: master
Autonomy: review-required
Execution state: CD-010 and recommended defaults accepted; `HaipingShi/coderail` is the exact sole dogfood repository. T-022 is eligible but not activated by this Light Rail closeout.

### CodeRail Coordinate

G — Goal:
- Establish the decision-grade safety contract required before any real GitHub write adapter or live dogfood.

T — Task:
- Draft CD-010 with explicit credential, permission, allowlist, effect, idempotency, threat, verification, Stop, and user-decision boundaries; do not implement it.

S — Scope:
- Allowed:
  - `docs/CONTRACTS.md`, `docs/TASKS.md`, `docs/BLUEPRINTS.md`, `docs/HARNESS_SPEC.md`, `docs/HANDOFF.md`, `docs/TRACELOG.jsonl`, generated trace/status files.
- Forbidden:
  - `src/**`, `test/**`, package/build/workflow files, credentials, real GitHub mutation, user repositories, and `G:\\codeRail\\coderail/**`.

V — Verify:
- TDD mode: waived
- Contract, coordinate, Blueprint, trace, and Light Rail closeout checks pass; official GitHub references support permission claims; manual acceptance remains explicit.
- Waiver reason: contract drafting changes no executable behavior.

X — Stop:
- Stop before T-022 activation, credentials, or live mutation until CD-010 is accepted and an exact dogfood repository is supplied.

P — Persist:
- TASKS: close T-021 with the accepted contract, defaults, and resolved exact-repository prerequisite.
- CONTRACTS/BLUEPRINTS/HARNESS/HANDOFF/TRACE: preserve the CD-010 boundary, SEC backlink, proposed live harness, H1 handoff, and trace/index/status evidence.

### Acceptance / Trace
- [x] Credential source, minimum permissions, expiry/redaction, and revocation policy are explicit.
- [x] Exact single-repository allowlist and independent mutation gates are explicit.
- [x] Initial effect/path restrictions and forbidden mutation surfaces are explicit.
- [x] Branch/PR/check idempotency, conflict, partial-failure, and recovery states are explicit.
- [x] Threats, tests, live dogfood evidence, and Stop conditions are explicit.
- [x] Official GitHub references support the permission and credential recommendations.
- [x] User accepts CD-010 and recommended credential/effect/PR defaults.
- [x] User names `HaipingShi/coderail` as the exact dogfood allowlist target.

Next step:
- Draft and activate the separate Full Rail T-022 implementation task; begin with mocked credential, allowlist, permission, PR-idempotency, and secret-redaction Red tests before any live run.


Task result: done

Harness result: passed

Handoff level: H0

Handoff updated: no

Inspect status: refreshed

Drive decision: BLOCKED_DECISION

Resume anchor: docs/TASKS.md#T-021

Next executable step: Authorize a ready task or provide terminal evidence; do not invent backlog work.

Auto commit: requested
## T-022 Live GitHub adapter non-live implementation

Status: [ ]
Type: feature
Rail: full
Priority: P1
Owner: project maintainer
Branch: master
Autonomy: autonomous-non-live; live dogfood remains review-required

### CodeRail Coordinate

G — Goal:
- North Star: Prove a trustworthy Repository Ready branch and draft-PR path behind least-privilege, exact-repository, plan-bound authorization.
- Outcome served: Convert the accepted CD-010 boundary into a testable adapter without granting ambient or accidental GitHub write authority.

T — Task:
- Implement the real GitHub adapter boundary and prepare a reviewed live-dogfood artifact: credential resolution/redaction, independent mutation gates, exact repository/permission preflight, deterministic draft-PR idempotency/recovery, exact-SHA checks, read-only remote/local version classification, and artifact preparation before live confirmation.

S — Scope:
- Allowed:
  - narrowly scoped live-adapter, credential, preflight, mutation-guard, PR-idempotency, and check-read modules under `src/`;
  - `test/t022*.test.ts` with injected fetch/Git doubles and local bare remotes only;
  - exact T-019/T-020 workflow input and tests solely to inject the validation clock after full CI exposed expired fixed-time artifacts; no TTL or production policy change;
  - minimal existing port wiring needed to keep live behavior behind injection and explicit authorization;
  - T-022-relevant `docs/TASKS.md`, `docs/BLUEPRINTS.md`, `docs/HARNESS_SPEC.md`, `docs/HANDOFF.md`, append-only trace, index, and generated status.
  - user-authorized read-only inspection of `G:\\codeRail\\coderail/**` and its Git metadata solely to prepare/review a repository-bound PlanArtifact for `HaipingShi/coderail`;
  - writing that PlanArtifact only to an external gh-polish plan store outside `G:\\codeRail\\coderail`, plus non-secret artifact/effect evidence.
  - `docs/CONTRACTS.md` amendment replacing the sole allowlist target with `HaipingShi/stakespeak`;
  - unauthenticated public read-only `git ls-remote`/clone of `https://github.com/HaipingShi/stakespeak.git` into an external temporary directory, plus an external plan store for artifact review.
- Forbidden:
  - authenticated network access, reading the actual process `GH_TOKEN`, or any write to `HaipingShi/coderail`/`HaipingShi/stakespeak` before final live confirmation;
  - default-branch writes, force push, merge, PR close, cleanup, workflows, settings, rulesets, secrets, releases, deploys, Pages, or publication;
  - any write, checkout, branch, commit, push, clean, reset, generated file, or configuration change under `G:\\codeRail\\coderail/**`;
  - public CLI live-mutation enablement, dependencies/package/build/workflow changes, hosted credentials, or GitHub App work.

V — Verify:
- TDD mode: required
- Red check: failing tests cover missing enable flag/token, absent or wrong allowlist, repository ID/name/default/base mismatch, insufficient permissions, token redaction, forbidden effects, existing exact PR reuse, conflicting PR refusal, `422` read-after-write reconciliation, and retry without duplicate PR creation.
- Remote/local Red check: failing tests cover synchronized, local-ahead, local-behind, diverged, missing-history, wrong remote, and wrong branch states before the detector exists.
- Green check: injected non-live adapters pass all contract states; no test reads ambient credentials or reaches GitHub.
- Refactor check: credential, authorization/preflight, HTTP mutation adapter, idempotency/recovery, and check verification remain separate from public CLI orchestration.
- Regression check: existing credential-free M1 and GET-only read adapter tests remain green; public CLI mutation guard stays closed.
- CI check: focused T-022 tests, `npm run ci`, secret scan, mock dogfood, CodeRail TDD/CI/Coordinate/Blueprint/Trace/Done/Closeout gates.
- Waiver reason: none.
- Harness:
  - injected HTTP responses only, including 401/403/404/422/rate/network cases;
  - local bare remote only for Git regression;
  - before/after worktree and environment-boundary checks.
- Manual acceptance:
  - not required for non-live Green; required again before the separately gated live dogfood execution.

X — Stop:
- Any test or implementation attempts real network access, consumes ambient credentials, or targets a non-test remote.
- Required behavior needs broader permissions/effects, token persistence, public CLI activation, or mutation outside CD-010.
- Repository identity, branch, PR, or retry conflict cannot fail closed after two focused attempts.
- Live dogfood remains stopped until exact effect IDs and all three runtime gates are independently confirmed.

P — Persist:
- TASKS: T-022 Red/Green evidence, acceptance, closeout, and live-deferred state.
- BLUEPRINTS/HARNESS/HANDOFF: current SEC boundary, executable non-live gate, and next live review point.
- DECISIONS/ASSETS: update only if implementation introduces a durable adapter boundary or canonical module.
- TRACE: append intent, Red, Green, mock-dogfood, verify, and closeout events; regenerate index/status.

### Task Contract

Depends on:
- T-021 done.
- CD-010 accepted and amended with `HaipingShi/stakespeak` as the sole current dogfood repository.

Blocks:
- Separately confirmed live GitHub dogfood.

Acceptance:
- [x] Non-live Red evidence is captured before implementation: `npm run build` fails because the tested live authorization and adapter modules do not exist.
- [x] Credential resolution accepts explicit/injected or `GH_TOKEN` only and never serializes token values.
- [x] Mutation authorization fails closed unless enable flag, exact allowlist, repository identity/base, permissions, review token, and exact effects agree.
- [x] Draft PR creation is deterministic and idempotent; matching PRs are reused and conflicts stop.
- [x] `422` reconciliation and partial-failure retry do not duplicate PR mutation.
- [x] Exact-SHA checks and all existing CI pass without network or ambient credentials.
- [x] Live GitHub dogfood remains explicitly deferred at this closeout unless separately confirmed after non-live completion.
- [x] Read-only T-020 prepare binds an external artifact to `HaipingShi/coderail`, `main`, and base SHA `c699fb0d286196caba7e145f95195140c6916ba5` without changing the target repository.
- [x] Artifact review truthfully reports zero create effects because all four CD-010 allowlisted paths already exist; review refuses an empty confirmation set instead of inventing a mutation.
- [ ] Public read-only inspection of `HaipingShi/stakespeak` proves exact remote/base identity and produces a non-empty create-only artifact without target mutation.
- [ ] Exact stakespeak effect IDs, content hashes, artifact digest, and review impacts are persisted before any live confirmation.
- [x] A read-only detector validates canonical remote and branch, compares exact local/remote SHAs, classifies synchronized/ahead/behind/diverged states, and returns `history-unavailable` without fetching or mutating Git state.

### Stakespeak Access Evidence

- Anonymous `git ls-remote --symref https://github.com/HaipingShi/stakespeak.git` failed closed with `could not read Username`; no clone directory was created.
- The connected GitHub read-only app returned repository 404, so it is not installed/authorized for this private repository.
- `gh` CLI is not installed, no global Git credential helper is configured, and no stakespeak checkout exists in the checked common local paths.
- No token was requested, read, printed, or persisted. No remote or local target mutation occurred.
- Preparation can resume from a user-authenticated local checkout path without sharing credentials with this task.

### Read-Only Artifact Evidence

- Artifact ID: `repository-ready-public-project-2026-07-11T10-00-00-000Z`
- Artifact digest: `26c1d12de8ec91dd4a7f87790ea486288c0b4cc7aef5e6a5d0bbd08cb8e9ef9e`
- External path: `C:\\Users\\geesh\\AppData\\Local\\gh-polish\\plans\\t022-coderail\\repository-ready-public-project-2026-07-11T10-00-00-000Z.json`
- Artifact file SHA-256: `5bacf14d23f4f1b4487ee52dad59a1108fda5170bc23e6481ec673a16cbf36bd`
- Preview: `README.md`, `.gitignore`, `CONTRIBUTING.md`, and `.github/pull_request_template.md` are all `manual_review` because they already exist.
- Exact effect IDs: none.
- Integrity/repository binding: passed.
- Target before/after: HEAD and tracked diff unchanged; worktree remains clean on `main`.
- Review outcome: `Saved plan contains no executable effects to review.`
- Live decision: stopped. CD-010 forbids overwriting these files, so `HaipingShi/coderail` cannot produce the contracted create-only live dogfood without a new repository choice or a separately reviewed contract revision.

### Critical Check

- [x] G maps to `docs/NORTH_STAR.md` and accepted CD-010.
- [x] S excludes live mutation and ambient credential access.
- [x] V requires Red before implementation and full non-live regression evidence.
- [x] P names TASKS, TRACE, SEC/harness, handoff, and generated state.

### Start Gate

- User explicitly activated T-022 on 2026-07-11.
- Capture Red before implementation; do not run live dogfood.
- User explicitly authorized read-only inspection of `G:\\codeRail\\coderail` for artifact/effect review on 2026-07-11; live mutation remains forbidden.
- User replaced the sole dogfood target with `HaipingShi/stakespeak` and authorized public read-only artifact preparation on 2026-07-11; live mutation remains forbidden until exact effects are reviewed.

Task result: stage-complete
Harness result: passed
Handoff level: H1
Handoff updated: no
Inspect status: refreshed
Drive decision: BLOCKED_DECISION
Resume anchor: docs/TASKS.md#T-022
Next executable step: Request the human gate for T-022 or mark a separately authorized task autonomous.
Auto commit: requested

## T-023 Publish gh-polish repository remote

Status: [x]
Type: release
Rail: full
Priority: P1
Owner: project maintainer
Branch: main
Autonomy: exact push authorized by user

### CodeRail Coordinate

G — Goal:
- Publish the fully verified gh-polish history to its exact project-owned GitHub repository without crossing into the stakespeak dogfood boundary.

T — Task:
- Configure `origin` as `https://github.com/HaipingShi/gh-polish.git`, fetch and audit `origin/main`, preserve both histories through a normal merge, align the local branch to `main`, and push without force.

S — Scope:
- Allowed:
  - T-023 state/trace/status documents; this repository's `.git/config`, fetched objects/refs, local branch rename, and merge commit; audit of exact remote commits/tree; normal update of `refs/heads/main` only at `HaipingShi/gh-polish`.
- Forbidden:
  - `HaipingShi/stakespeak`, force push, ref deletion, tags, other remote branches, GitHub settings, releases, workflows, pull requests, or manual conflict resolution/content replacement without a separately reviewed decision.

V — Verify:
- TDD mode: waived
- Waiver reason: exact Git transport operation with no production code change.
- Harness: clean worktree before transport; exact remote URL; fetch and inspect ancestry/commit/tree diff; conflict-free history-preserving merge; push succeeds without force; local HEAD equals `git ls-remote origin refs/heads/main`; final worktree clean.
- CI check: rely on fresh T-022 `74/74` CI for the exact pre-push code revision and rerun CodeRail finish after push evidence is persisted.

X — Stop:
- Stop on authentication failure, unexpected remote identity, content conflicts requiring a product choice, protected-branch rejection, or any request for force/deletion/another repository.

P — Persist:
- TASKS/TRACE/index/status: exact remote, local/pushed SHA, verification, closeout, and commit evidence.
- HANDOFF: update only if push is blocked or creates an H1+ recovery need.

### Task Contract

Depends on:
- T-022 stage-complete with full CI passing and a clean local worktree.

Acceptance:
- [x] `origin` is exactly `https://github.com/HaipingShi/gh-polish.git`.
- [x] `origin/main` is fetched and its commits/tree are reviewed before merge.
- [x] Local and remote histories are preserved in a normal merge with no unreviewed conflict resolution.
- [x] `origin/main` equals the exact local HEAD after a non-force push.
- [x] CodeRail finish records the result and exact auto-commit action.

### Critical Check

- [x] G maps to the M1 Repository Ready North Star.
- [x] S names one repository and one remote ref.
- [x] V verifies remote equality after mutation.
- [x] P names TASKS and TRACE.

### Remote Preflight Evidence

- `git ls-remote --symref https://github.com/HaipingShi/gh-polish.git HEAD refs/heads/master` succeeded without mutation.
- Remote HEAD is `refs/heads/main` at `9cd5917ca810450a106a7dec84e4ceaf91aad6b8`; no `refs/heads/master` was returned.
- Local branch is `master` at `e6a50a4f4c3790d7a24c0ccc26a078a2ce61ca29`, and the remote commit is not present in the local object database, so ancestry cannot be proven without a separately authorized fetch/reconciliation step.
- No remote was added and no push occurred. Creating a parallel `master` or replacing `main` would exceed the exact preflight contract.

### Remote Audit Evidence

- User selected reconciliation into `main`; `origin` was added with the exact HTTPS URL and `origin/main` fetched successfully without tags.
- Histories are unrelated: local has 42 commits not on remote; remote has one initial commit not on local.
- Remote initial commit `9cd5917ca810450a106a7dec84e4ceaf91aad6b8` contains only an MIT `LICENSE` and a two-line placeholder `README.md`.
- Reviewed merge resolution: preserve the remote initial commit and MIT license, retain the more complete local README, and make no other content resolution.

Task result: done
Harness result: passed
Handoff level: H0
Inspect status: refreshed
Resume anchor: docs/TASKS.md#T-023
Next executable step: Authorize a ready task or provide terminal evidence; do not invent backlog work.
Auto commit: requested


Handoff updated: no

Drive decision: BLOCKED_DECISION
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
