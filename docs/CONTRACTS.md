# Coordinate Contract Drafts

Use this file for proposed or accepted Coordinate Contract Drafts before they become active tasks in `docs/TASKS.md`.

## CD-001 Agent-native product direction refactor

Status: accepted
Created at: 2026-07-11
Source: user
Trace: docs/TRACELOG.jsonl (T-013)

### Coordinate Contract Draft

G — Goal:
- North Star: Expand gh-polish from a repository-polish CLI into an agent-native project launch and stewardship workflow.
- Outcome served: Help non-technical vibe coders move AI-built ideas from working code to credible, visible, launch-ready, and sustainably maintained projects.
- Why now: The user clarified that P0 repository attributes are only the foundation; Web UI, GitHub App, visibility, launch, and growth capabilities must be planned as a staged product path.

T — Task:
- Task ID: T-013
- Exact task: Normalize the repository with the local CodeRail runtime and refactor the durable product direction, architecture evolution, capability stages, and roadmap as a Light Rail documentation task.
- What this task must not become: Business-code implementation, a hosted service build, GitHub mutation, or speculative implementation of Web UI and GitHub App infrastructure.

S — Scope:
- Allowed:
  - `README.md`
  - `docs/NORTH_STAR.md`
  - `docs/PRD.md`
  - `docs/ARCHITECTURE.md`
  - `docs/MVP_TASKS.md`
  - `docs/TASK_GRAPH.md`
  - `docs/BLUEPRINTS.md`
  - `docs/DECISIONS.md`
  - `docs/ASSETS.md`
  - `docs/TASKS.md`
  - `docs/CONTRACTS.md`
  - `docs/HANDOFF.md`
  - `docs/CODERAIL_STATUS.md` through the local inspect script
  - `docs/TRACELOG.jsonl` append-only and generated `docs/TRACE_INDEX.md`
- Forbidden:
  - `src/**`, `test/**`, package files, dependency changes, generated build output, real GitHub mutation, and all source files under `G:\codeRail\coderail`.

V — Verify:
- TDD mode: waived
- Red check: not applicable; this is a product-direction and architecture-document refactor.
- Green check: product docs agree on audience, outcome, maturity stages, delivery surfaces, current slice, non-goals, and next Full Rail task.
- Refactor check: P0 remains an executable foundation while Web UI, GitHub App, launch visibility, and growth capabilities have explicit staged paths rather than being removed or silently promoted into the current slice.
- Regression check: `npm run ci` remains green and no implementation files change.
- CI check: local CodeRail doctor, contract, coordinate, blueprint, done, trace, inspect, and closeout gates.
- Waiver reason: No code path, schema, dependency, runner, or external interface is implemented in this task.
- Harness:
  - Mermaid fence balance and internal terminology scans.
  - Local CodeRail scripts from `G:\codeRail\coderail\scripts`.
  - `npm run ci` as a regression-only check.
- Manual acceptance:
  - User may revise the new product direction after reviewing the persisted documents; executable document and governance checks are sufficient for task completion.

X — Stop:
- The refactor requires changing business code, package dependencies, a live GitHub repository, or the local CodeRail source.
- Product direction cannot preserve a clear boundary between the external AI coding agent and the deterministic gh-polish execution kernel.
- Web UI or GitHub App planning requires committing to hosting, billing, identity, or persistence vendors in this task.

P — Persist:
- TASKS: activate and close T-013 with Light Rail evidence.
- HANDOFF: record the new resume anchor and next Full Rail slice.
- DECISIONS: append durable product and architecture decisions.
- LESSONS: update only if a reusable failure lesson appears.
- ASSETS: update canonical product-document and local CodeRail references.
- TRACE: append intent/change/verify events and regenerate the trace index.

Decision: proceed

Notes:
- "Deferred" means planned but not implemented in the current slice. It does not mean excluded from the product architecture or roadmap.

## CD-002 Complete residual Light Rail normalization

Status: accepted
Created at: 2026-07-11
Source: user
Trace: docs/TRACELOG.jsonl (T-013F)

### Coordinate Contract Draft

G — Goal:
- North Star: Complete the parts of the supplied product-direction Prompt that were not already delivered by T-013.
- Outcome served: Keep the agent-native launch/stewardship direction executable through an aligned harness, explicit trust and launch maturity stages, current CodeRail standard entry rules, measurable governance, and a ready-but-unexecuted next Full Rail contract.
- Why now: The merged Prompt explicitly asks Codex to exclude completed work and execute the remaining requirements.

T — Task:
- Task ID: T-013F
- Exact task: Compare current governance entries with the local standard template, incrementally merge missing standard rules, align maturity/harness/metrics, and create the next Full Rail M0 contract without implementing it.
- What this task must not become: Repeating T-013, changing business code, executing T-014, or selecting hosted infrastructure.

S — Scope:
- Allowed:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `README.md`
  - `docs/**`
- Forbidden:
  - `src/**`
  - `test/**`
  - package, lock, TypeScript, build, or workflow configuration
  - real GitHub mutation
  - `G:\codeRail\coderail/**`
  - Web UI, GitHub App, database, queue, or hosted implementation

V — Verify:
- TDD mode: waived
- Red check: not applicable to a Light Rail governance and product-document follow-up.
- Green check: template compatibility evidence is recorded; maturity stages explicitly include Trust Ready; Harness covers CLI now and stage gates for Web/App later; Metrics are measurable; T-014 has a complete Full Rail contract and remains unexecuted.
- Refactor check: no completed T-013 content is needlessly rewritten and no future stage is presented as current capability.
- Regression check: no implementation/config changes and existing project CI remains green.
- CI check: local CodeRail doctor, contract, coordinate, blueprint, trace, done, inspect, CI, and closeout flows.
- Waiver reason: No business logic, schema, dependency, runner, or external interface is implemented.
- Harness:
  - Local-template semantic diff for `AGENTS.md`, `CLAUDE.md`, and Harness requirements.
  - Maturity and cross-document terminology scans.
  - Mermaid fence and scope scans.
  - Project-native `npm run ci`.
- Manual acceptance:
  - Automated Light Rail evidence is sufficient; T-014 explicitly remains unexecuted for later Full Rail activation.

X — Stop:
- Compatibility requires `--force`, destructive overwrite, or local CodeRail source modification.
- Remaining requirements require business code, dependencies, build configuration, live GitHub mutation, or a hosted-vendor decision.
- User changes conflict with a target document and cannot be merged safely.

P — Persist:
- TASKS: T-013F completion and T-014 future task state.
- HANDOFF: next executable T-014 activation step.
- DECISIONS: update only if a new durable decision is introduced.
- LESSONS: update only for a reusable failure.
- ASSETS: preserve local CodeRail source boundary.
- TRACE: append T-013F intent/change/verify events and regenerate the index.

Decision: proceed

Notes:
- T-013 standard initialization and core product refactor are accepted prerequisites and are not repeated.

## CD-007 Effectful Repository Ready PR execution

Status: accepted
Created at: 2026-07-11
Source: continuous-roadmap handoff
Trace: future T-018 review/intent trace

### Coordinate Contract Draft

G — Goal:
- North Star: Turn an accepted Repository Ready preview into a branch and pull request without overwriting customized work or bypassing confirmation.
- Outcome served: The builder receives one reviewable PR and a truthful merge decision.
- Why now: T-017 proves read-only previews; effectful execution crosses the user-repository and live GitHub boundary and requires explicit review.

T — Task:
- Task ID: T-018
- Exact task: Apply confirmed preview effects on a non-default branch, push, create one PR through a write-only adapter, bind checks/evidence, and remain idempotent.
- What this task must not become: direct default-branch mutation, automatic merge, license/security decisions, metadata/settings mutation, release/deploy/publish, or M2-M6 work.

S — Scope:
- Allowed only after acceptance: explicit file-effect, Git branch/push, PR adapter, evidence, tests, and relevant docs.
- Forbidden: default-branch writes, automatic merge, unrelated repository files, settings mutation, release/deploy/publish, hosted infrastructure, `G:\codeRail\coderail/**`.

V — Verify:
- TDD mode: required
- Local bare-remote and mocked PR adapter are mandatory; any allowlisted live dogfood needs separate explicit repository/credential approval.
- Project CI, branch isolation, overwrite refusal, idempotency, partial failure, and CodeRail Full Rail gates must pass.

X — Stop:
- Stop until the user explicitly accepts this effectful boundary and identifies any live dogfood repository/permission authority.

P — Persist:
- TASKS, HANDOFF, DECISIONS, ASSETS, TRACE/index/status and plan-bound evidence.

Decision:
- proceed with local bare-remote and mocked PR-adapter verification only.
- live GitHub dogfood remains deferred and requires separate repository and credential approval.

## CD-006 M1 profile-aware Repository Ready preview

Status: accepted
Created at: 2026-07-11
Source: user continuous-roadmap goal
Trace: T-017 intent trace

### Coordinate Contract Draft

G — Goal:
- North Star: Let an agent produce a truthful, profile-aware Repository Ready plan and preview without overwriting customized content or inventing project facts.
- Outcome served: A builder can see what repository presentation work is appropriate for their project type before any PR is created.
- Why now: M0 evidence is complete; M1 begins with read-only profile and artifact decisions, not live mutation.

T — Task:
- Task ID: T-017
- Exact task: Define six repository profiles, derive profile-aware artifact requirements from local analysis, and produce deterministic create/manual-review/unknown previews for Node and generic fixtures.
- What this task must not become: effectful PR creation, license selection, security-contact invention, GitHub mutation, hosted UI, or M2 Trust claims.

S — Scope:
- Allowed:
  - new profile/preview domain modules under `src/`, minimal `src/templateRegistry.ts` reuse
  - `test/t017*.test.ts`, T-017-relevant docs/trace/state
- Forbidden:
  - repository/GitHub writes, PR creation, dependencies/build/workflow changes, invented commands/contacts/licenses, M2-M6 implementation, `G:\codeRail\coderail/**`

V — Verify:
- TDD mode: required
- Red check: six-profile requirement, existing-content preservation, observed-command, and unknown-evidence tests fail before implementation.
- Green check: Node/generic fixtures produce deterministic profile-aware previews with no writes.
- Refactor check: profile policy, evidence extraction, template rendering, and preview serialization remain separate.
- Regression check: all M0 tests and GET-only boundaries remain green.
- CI check: project CI and CodeRail Full Rail gates plus no-mutation dogfood.
- Waiver reason: none.

X — Stop:
- Stop if profile behavior needs builder intent not safely defaultable, or implementation requires license/security claims, mutation, dependencies, or hosted scope.

P — Persist:
- TASKS, HANDOFF, NORTH_STAR/HARNESS/METRICS, ASSETS, TRACE/index/status.

Decision:
- proceed autonomously as a read-only M1 thin slice; default mandatory dogfood profile is `public-project`.

## CD-005 Remote verification and M0 completion hardening

Status: accepted
Created at: 2026-07-11
Source: user continuous-roadmap goal
Trace: T-016 intent trace

### Coordinate Contract Draft

G — Goal:
- North Star: Complete M0 with verification evidence bound to the intended repository, branch, plan, and revision.
- Outcome served: An agent can distinguish pending, success, failure, missing, and permission-limited remote evidence and give one truthful next action.
- Why now: T-015 proves safe local effect/evidence behavior; M0 cannot complete until remote checks are filtered to the target revision instead of unrelated history.

T — Task:
- Task ID: T-016
- Exact task: Add a read-only plan-bound remote verifier over the existing GitHub read adapter, cover degraded states and repair guidance, expose stable evidence output, and define M0 exit/M1 entry evidence.
- What this task must not become: PR creation, merge, GitHub mutation, live credential requirement, M1 artifact generation, hosted infrastructure, or Web/App work.

S — Scope:
- Allowed:
  - `src/monitor.ts`, `src/githubAdapter.ts`, `src/protocol.ts`, and new narrowly scoped read-only verification modules under `src/`
  - `test/t016*.test.ts` and minimal existing monitor/adapter test updates
  - T-016-relevant `docs/*.md`, append-only trace, generated index/status
- Forbidden:
  - POST/PUT/PATCH/DELETE GitHub endpoints, PR creation/merge, user-repository writes, credentials in mandatory tests
  - dependencies, package/build/workflow changes, hosted infrastructure, M1-M6 implementation, `G:\codeRail\coderail/**`

V — Verify:
- TDD mode: required
- Red check: failing tests for exact SHA/branch filtering, unrelated-run rejection, pending/success/failure/missing/permission-limited evidence, and repair/next-step output.
- Green check: mocked remote runs produce deterministic plan-bound evidence without credentials or network.
- Refactor check: GitHub transport, target filtering, evidence classification, and protocol orchestration remain separate.
- Regression check: GitHub adapter stays GET-only; T-014/T-015 tests and mutation guards remain green.
- CI check: project CI, CodeRail TDD/Blueprint/CI/Done/Closeout, and read-only dogfood.
- Waiver reason: none.
- Harness:
  - Mocked GitHub runs for every state and mismatched branch/SHA.
  - Existing no-write harness and local repository dogfood.
- Manual acceptance:
  - Not required unless remote completion semantics require a new product decision.

X — Stop:
- Stop if trustworthy completion requires PR/merge mutation, live credentials, a new dependency, or ambiguous evidence semantics.

P — Persist:
- TASKS, HANDOFF, NORTH_STAR current slice, HARNESS/METRICS if M0 evidence changes, ASSETS, TRACE/index/status.

Decision:
- proceed autonomously as a read-only Full Rail task under the user's continuous-roadmap goal.

## CD-004 Mutation-ready apply and evidence hardening

Status: accepted
Created at: 2026-07-11
Source: user
Trace: TR-20260711-041635-t015

### Coordinate Contract Draft

G — Goal:
- North Star: Make M0 apply trustworthy by proving that a saved, repository-bound plan can only cause its confirmed operations, records recoverable evidence, and never bypasses branch/default-branch safety.
- Outcome served: A coding agent can explain exactly what was attempted, what happened for each operation, and the next recovery action without claiming a remote PR, GitHub setting, or completed mutation that lacks evidence.
- Why now: T-014 proves a read-only saved-plan workflow. The next M0 risk is not recommendation quality but safe authorization, effect isolation, and partial-failure evidence.

T — Task:
- Task ID: T-015
- Exact task: Implement a mutation-ready apply/evidence engine that reloads and revalidates the T-014 artifact, requires explicit operation-level confirmation, produces an immutable per-operation lifecycle/evidence record, and proves branch/file/push behavior only in temporary local repositories with a local bare remote.
- Proposed public boundary: the existing user-facing CLI remains validation-only (`apply --dry-run`) for this task. A future execution CLI syntax and any GitHub PR/settings mutation require an accepted follow-on contract; T-015 may expose an injected/internal executor only for its local integration harness.
- What this task must not become: live GitHub mutation, PR creation, default-branch writes, GitHub settings mutation, user-repository execution, M1 artifact generation, Web UI, GitHub App, hosted persistence, or a generic agent loop.

S — Scope:
- Allowed:
  - `src/applier.ts`, `src/policy.ts`, `src/planArtifact.ts`, `src/protocol.ts`, and narrowly scoped supporting M0 evidence/error modules under `src/`
  - minimal CLI wiring only to preserve explicit validation-only refusal and structured recovery
  - operation-lifecycle/evidence tests, temporary-repository helpers, and local-bare-remote integration tests under `test/`
  - T-015-relevant `docs/`, `README.md`, and append-only trace
- Forbidden:
  - any live GitHub API write endpoint, `gh` mutation command, PR creation, or settings mutation
  - writes, commits, branches, pushes, or uncommitted-file changes in the user's repository
  - execution on a remote other than a test-owned local bare remote
  - direct default-branch mutation, implicit confirmation, reconstructed operation payloads, or bypassing plan validation
  - dependency, package, TypeScript, build, release, or GitHub Actions workflow changes without a revised contract
  - Web UI, GitHub App, hosted service, database, queue, billing, tenancy, OAuth, deployment, or M1-M6 work
  - `G:\codeRail\coderail/**`

V — Verify:
- TDD mode: required
- Red check:
  - Add failing tests for missing/extra confirmations, forbidden/default-branch operations, stale/tampered/repository-mismatched artifacts, executor failure mid-plan, retry/idempotency, and false completion claims.
- Green check:
  - A Node and a generic fixture each use a test-owned branch and local bare remote to execute an approved file operation, push only the non-default branch, and return plan-bound per-operation evidence plus one recovery action.
- Refactor check:
  - Keep artifact validation, policy authorization, execution, lifecycle recording, evidence serialization, and CLI refusal separate; no adapter may write GitHub state.
- Regression check:
  - T-014 read-only paths remain no-project-write; GitHub read adapter remains GET-only; mutation guard remains closed; existing plans remain loadable.
- CI check:
  - `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run ci`, CodeRail TDD/CI/Contract/Coordinate/Blueprint/Trace/Done/Closeout gates, and a before/after user-worktree check.
- Waiver reason:
  - none; authorization, lifecycle, retry, evidence, and mutation-boundary behavior require Red-Green-Refactor proof.
- Harness:
  - Unit tests for authorization and lifecycle state transitions.
  - Local temporary Git repositories and local bare remotes only; no credentials or network.
  - Fault-injected executor tests that prove no false success after partial failure and safe retry behavior.
  - Read-only dogfood that confirms the public CLI still cannot mutate this repository.
- Manual acceptance:
  - Required before any subsequent contract enables a user-facing execution command or a live GitHub mutation; not required for the local-only T-015 harness if all executable evidence passes.

X — Stop:
- The confirmation syntax, artifact/evidence schema, retry semantics, or public execution boundary requires a product decision not recorded in this draft.
- Any implementation path needs a live GitHub write, user-repository effect, new dependency/build change, hosted infrastructure, or a forbidden file.
- A local bare-remote test cannot prove non-default-branch isolation, or an injected partial failure cannot produce a coherent recovery record after two focused attempts.
- Existing user changes conflict with a required target file and cannot be merged safely.

P — Persist:
- TASKS: create/update T-015 status, Red/Green evidence, acceptance, closeout, and next task.
- HANDOFF: retain H1 with the accepted/executable contract anchor or record a blocking product decision.
- DECISIONS: append only durable confirmation, evidence, retry, or execution-boundary decisions.
- LESSONS: record repeated authorization, idempotency, evidence, or recovery failure patterns.
- ASSETS: register canonical lifecycle/evidence modules, fixtures, and generated-artifact boundaries.
- TRACE: append intent, Red, Green, local-effect, dogfood, verify, and closeout events; regenerate index.

Decision:
- accepted by the user; local test-owned effects only, with live GitHub/user-repository mutation out of scope.

Revision accepted at 2026-07-11:
- An executable local file operation must carry an immutable effect payload: operation ID, relative path, content, content SHA-256, confirmation requirement, and inclusion in the artifact digest.
- Recommendation-only operations may omit an effect payload and are not executable by T-015.
- T-015 may execute only a payload already present in the loaded, validated artifact; it must refuse reconstructed, missing, or digest-mismatched payloads.

Notes:
- T-016 owns remote PR/check verification and M0 completion evidence; T-015 must not claim those outcomes.
- Treat an operation as successful only when its evidence record is complete and bound to the saved plan, repository identity, branch, and resulting revision.

## CD-003 Trusted agent-native M0 thin slice

Status: accepted
Created at: 2026-07-11
Source: user
Trace: future T-014 execution trace

### Coordinate Contract Draft

G — Goal:
- North Star: Prove the M0 Agent-Native Deterministic Kernel through one trusted `inspect -> plan -> apply -> verify` path.
- Outcome served: Give an external AI coding agent a stable, evidence-backed workflow without requiring the builder to understand GitHub mechanics and without enabling real GitHub mutation.
- Why now: Prototype modules exist, but the public CLI is still a stub, plans are not durable identity-bound artifacts, and no end-to-end dogfood evidence exists.

T — Task:
- Task ID: T-014
- Exact task: Wire the agent-facing CLI to existing context/analyzer modules, persist and reload a versioned repository-bound plan, validate it through dry-run apply, and return a plan-bound read-only verify result for Node/generic fixtures and this repository.
- What this task must not become: M1 repository feature breadth, real GitHub mutation, production PR creation, Web UI, GitHub App, hosted persistence, dependency/platform selection, or a general-purpose agent loop.

S — Scope:
- Allowed:
  - existing M0 CLI, context, GitHub-read, analyzer, planner, policy, applier, and monitor modules under `src/`
  - new narrowly scoped M0 protocol, plan-schema/store, error, evidence, and verification modules under `src/`
  - corresponding tests and Node/generic fixtures under `test/`
  - T-014-relevant CodeRail/project documents and append-only trace
- Forbidden:
  - real GitHub mutation or write endpoints
  - writes to the user's project during inspect, plan, dry-run apply, verify, or dogfood
  - Web UI, GitHub App, hosted service, database, queue, billing, tenancy, OAuth, or deployment implementation
  - M1-M6 artifact/template/growth feature expansion
  - dependency, package, TypeScript, build, release, or GitHub Actions workflow changes without a separate decision-grade contract revision
  - `G:\codeRail\coderail/**`

V — Verify:
- TDD mode: required
- Red check:
  - Add failing tests for the four-command CLI thin slice, versioned plan validation, persistence/reload, tamper/mismatch/stale rejection, stable JSON envelopes/exit codes, and no-mutation dogfood.
- Green check:
  - Node and generic fixtures pass `inspect -> plan -> apply --dry-run -> verify` with deterministic artifacts and actionable recovery fields.
- Refactor check:
  - Shared protocol, plan validation, persistence, and verification concerns have explicit ownership; CLI orchestration does not absorb domain logic.
- Regression check:
  - Existing tests remain green; read adapter remains GET-only; mutation guard remains closed; public protocol changes are intentionally snapshotted.
- CI check:
  - `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run ci`, and local CodeRail TDD/CI/Done/Closeout gates.
- Waiver reason:
  - none; parser/schema/shared-domain/CLI behavior requires Red-Green-Refactor evidence.
- Harness:
  - Unit tests for schema, protocol, persistence, staleness, digest, errors, and recovery.
  - CLI integration snapshots for Node and generic fixtures.
  - Temporary-repository and local-bare-remote tests where Git behavior is needed.
  - Read-only dogfood on `F:\projects\gh-polish` with before/after Git and filesystem evidence.
  - Mocked GitHub reads only; no credentials or live network required for the mandatory suite.
- Manual acceptance:
  - Required only if the public command/JSON contract has an unresolved product tradeoff; otherwise executable TDD and dogfood evidence governs completion.

X — Stop:
- The plan schema, persistence location, or public JSON contract cannot be defined without a product decision.
- Any path requires project-file mutation, real GitHub mutation, new runtime dependencies, build changes, hosted infrastructure, or high-risk permissions outside the accepted scope.
- Repository identity or stale-plan behavior remains ambiguous after two focused design/test attempts.
- Required dogfood cannot prove no mutation, or a gate fails twice with unclear cause.
- Existing user changes conflict with a required target file and cannot be merged safely.

P — Persist:
- TASKS: T-014 Red/Green evidence, acceptance, closeout, and next hardening task.
- HANDOFF: update for H1/H2/H3 with exact failing/passing anchor.
- DECISIONS: append plan/protocol/persistence ADR only if the contract requires a durable choice.
- LESSONS: record repeated schema, identity, or no-mutation failure patterns.
- ASSETS: register new canonical schema/protocol fixtures and generated-artifact boundary.
- TRACE: append intent, Red, Green, change, dogfood, verify, and closeout events; regenerate index.

Decision: proceed in a separate Full Rail execution turn; do not execute as part of T-013F

Notes:
- `apply` in this thin slice is validation-only dry-run for the user repository. Any effectful apply path belongs to T-015 or a revised contract.
- `verify` proves plan/current-state evidence in M0; remote PR/check verification is hardened in T-016.

Copy this block and rename the heading to `## CD-001 Short title` when creating a real draft.

```markdown
\## CD-001 Short title

Status: proposed
Created at:
Source: user | agent | handoff | trace | issue
Trace:

### Coordinate Contract Draft

G — Goal:
- North Star:
- Outcome served:
- Why now:

T — Task:
- Task ID:
- Exact task:
- What this task must not become:

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

Decision:
- proceed | revise | ask user | split task | backlog

Notes:
-
```
