# MVP Tasks

Each task follows the CodeRail contract model: Goal, Task, Scope, Verification, Exit/Stop condition, and Persistence/Trace. The `Evidence` field records how the task proves completion.

## CodeRail Mapping Rule

Every task below must become a concrete entry in `docs/TASKS.md` before implementation starts.

- G maps to `Goal`.
- T maps to `ID` plus task title.
- S maps to `Scope`.
- V maps to `Verification` plus `Acceptance Criteria`.
- X maps to the task's dependencies, permission failures, out-of-scope requests, and any condition that makes verification unreliable.
- P maps to `Evidence`, `docs/TASKS.md`, `docs/TRACELOG.jsonl`, and any durable docs changed by the task.

Unless a task is explicitly documentation-only, MVP implementation tasks are Full Rail.

## MVP-001: Project Skeleton and CLI Contract

- ID: MVP-001
- Rail: full
- Goal: Establish the minimal executable CLI shape without implementing polish logic.
- Scope: Define commands `inspect`, `plan`, `apply`, and `monitor`; create configuration loading stub; add help text and exit codes.
- Acceptance Criteria: CLI prints stable help; unknown commands fail with non-zero exit; no GitHub mutation code exists.
- Verification: CLI smoke tests for help, unknown command, and dry no-op invocation.
- Dependencies: Design docs.
- Evidence: Test output, CLI help snapshot, commit/PR link.
- Exit / Stop Condition: Stop if implementation stack choice is unresolved or if CLI skeleton requires real GitHub access.
- Persistence / Trace: Update `docs/TASKS.md`, `docs/HARNESS_SPEC.md`, `docs/DECISIONS.md`, and `docs/TRACELOG.jsonl`.

## MVP-002: Repository Context Detection

- ID: MVP-002
- Rail: full
- Goal: Identify the local repository and remote GitHub target safely.
- Scope: Read current working tree, git root, default branch, remotes, owner/repo, dirty state, and candidate project files.
- Acceptance Criteria: Works for HTTPS and SSH GitHub remotes; reports clear error outside git; does not mutate files.
- Verification: Unit tests with mocked git outputs; smoke test in a temporary git repo.
- Dependencies: MVP-001.
- Evidence: Repository context JSON fixture and test results.
- Exit / Stop Condition: Stop if git remote parsing is ambiguous or would require network mutation.
- Persistence / Trace: Update task evidence, fixtures index, and trace.

## MVP-003: GitHub API Adapter Read Layer

- ID: MVP-003
- Rail: full
- Goal: Encapsulate GitHub reads behind a testable adapter.
- Scope: Auth token resolution, repository metadata read, topics read, Actions/checks read, labels/milestones read, capability errors.
- Acceptance Criteria: No direct GitHub API calls outside adapter; permission failures return typed degraded states.
- Verification: Integration tests with mocked GitHub API responses and rate-limit/error fixtures.
- Dependencies: MVP-001, MVP-002.
- Evidence: Adapter contract tests and fixture set.
- Exit / Stop Condition: Stop if token behavior or API surface requires write permissions.
- Persistence / Trace: Update adapter contract docs, task evidence, and trace.

## MVP-004: Local Analyzer

- ID: MVP-004
- Rail: full
- Goal: Detect project stack and repository hygiene from local files.
- Scope: Identify README, license, `.gitignore`, `.github` templates, workflows, Dependabot, CodeQL, package manifests, and likely test/lint/build commands.
- Acceptance Criteria: Produces deterministic findings for Node, Python, Go, Rust, and generic fixtures.
- Verification: Unit tests over fixture repositories.
- Dependencies: MVP-002.
- Evidence: Findings snapshots for each fixture.
- Exit / Stop Condition: Stop if detection starts modifying files or inventing unsupported commands.
- Persistence / Trace: Update analyzer fixture evidence and trace.

## MVP-005: Remote Analyzer

- ID: MVP-005
- Rail: full
- Goal: Normalize GitHub repository state for planning.
- Scope: Combine adapter results for metadata, topics, labels, milestones, Actions, checks, Pages, releases, rulesets, and security status where available.
- Acceptance Criteria: Missing permissions are represented as warnings, not crashes; all remote findings include source and timestamp.
- Verification: Mocked API integration tests for success, partial permission, and not-found cases.
- Dependencies: MVP-003.
- Evidence: Remote findings snapshots and warning examples.
- Exit / Stop Condition: Stop if permission failures crash instead of degrading.
- Persistence / Trace: Update remote findings fixtures and trace.

## MVP-006: Policy Engine

- ID: MVP-006
- Rail: full
- Goal: Enforce dry-run and confirmation rules.
- Scope: Classify operations as read-only, low-risk file PR change, medium-risk API metadata change, high-risk GitHub setting, or refused.
- Acceptance Criteria: Branch rulesets, required checks, security toggles, Pages, Actions permissions, and direct default-branch mutation are confirmation-gated or refused according to MVP policy.
- Verification: Unit tests for each capability and risk class.
- Dependencies: MVP-004, MVP-005.
- Evidence: Policy decision table snapshot.
- Exit / Stop Condition: Stop if high-risk settings can bypass confirmation or plan/apply separation.
- Persistence / Trace: Update policy table, decisions if needed, and trace.

## MVP-007: Planner and Plan Schema

- ID: MVP-007
- Rail: full
- Goal: Generate structured dry-run plans from analyzer findings.
- Scope: JSON schema, human summary, operation list, risk labels, confirmation requirements, verification steps, and evidence targets.
- Acceptance Criteria: Plans are deterministic; every operation maps to G/T/S/V/X/P; plans can be saved and reloaded by ID.
- Verification: Dry-run snapshot tests against fixture repositories.
- Dependencies: MVP-004, MVP-005, MVP-006.
- Evidence: Plan schema, sample plans, snapshot results.
- Exit / Stop Condition: Stop if any operation lacks risk, verification, or confirmation metadata.
- Persistence / Trace: Update plan schema docs, snapshots, and trace.

## MVP-008: Template Registry

- ID: MVP-008
- Rail: full
- Goal: Provide stack-aware templates without overwriting user work.
- Scope: README sections, `.gitignore`, issue templates, PR template, `SECURITY.md`, `CONTRIBUTING.md`, Dependabot, and basic CI workflow templates.
- Acceptance Criteria: Templates have metadata for stack, operation type, risk, and verification; existing files produce patch or manual-review operations.
- Verification: Unit tests for template selection and rendering with sanitized project metadata.
- Dependencies: MVP-004, MVP-007.
- Evidence: Template render snapshots and overwrite-protection tests.
- Exit / Stop Condition: Stop if templates overwrite existing files without explicit plan metadata.
- Persistence / Trace: Update template inventory and trace.

## MVP-009: Applier Branch and PR Flow

- ID: MVP-009
- Rail: full
- Goal: Apply approved file changes through a branch and pull request.
- Scope: Create branch, write planned files/patches, commit, push, open PR, save apply evidence.
- Acceptance Criteria: Default branch is not modified directly; apply refuses missing or stale plans; apply refuses unconfirmed gated operations.
- Verification: CLI smoke tests with a local bare remote; mocked GitHub PR creation.
- Dependencies: MVP-001, MVP-006, MVP-007, MVP-008.
- Evidence: Apply log, generated PR payload fixture, smoke test output.
- Exit / Stop Condition: Stop if apply can touch default branch or execute unapproved operations.
- Persistence / Trace: Update apply evidence, task status, and trace.

## MVP-010: Confirmed Metadata Apply

- ID: MVP-010
- Rail: full
- Goal: Support explicit, low-risk GitHub metadata updates.
- Scope: Update repository description, homepage, and topics only when the saved plan includes the operation and user confirmation is provided.
- Acceptance Criteria: `plan` never mutates; `apply` requires confirmation; adapter records before/after evidence.
- Verification: Mocked API integration tests; no-real-mutation harness gate.
- Dependencies: MVP-003, MVP-006, MVP-007, MVP-009.
- Evidence: Before/after API fixtures and confirmation test results.
- Exit / Stop Condition: Stop if metadata update can occur without saved plan and explicit confirmation.
- Persistence / Trace: Update capability matrix, task evidence, and trace.

## MVP-011: Monitor Checks

- ID: MVP-011
- Rail: full
- Goal: Report whether the polish PR passes GitHub checks.
- Scope: Poll PR checks/workflow runs, summarize status, link failures, and recommend follow-up tasks.
- Acceptance Criteria: Handles pending, success, failure, skipped, and missing checks; does not auto-fix in MVP.
- Verification: Mocked Actions/checks integration tests and CLI snapshot tests.
- Dependencies: MVP-003, MVP-009.
- Evidence: Monitor summary snapshots.
- Exit / Stop Condition: Stop if monitor starts mutating workflows or auto-fixing failures in MVP.
- Persistence / Trace: Update monitor snapshots and trace.

## MVP-012: Verification Harness and Release Gate

- ID: MVP-012
- Rail: full
- Goal: Make unintended GitHub mutation difficult during development and CI.
- Scope: Unit, integration, smoke, dry-run snapshot, lint, typecheck, build, and mutation-guard gates.
- Acceptance Criteria: Tests fail if real GitHub mutation is attempted without explicit environment flag; CI runs all MVP gates.
- Verification: Harness self-tests and CI workflow result.
- Dependencies: MVP-001 through MVP-011.
- Evidence: CI run link, harness logs, mutation guard test.
- Exit / Stop Condition: Stop if real GitHub mutation can happen without the explicit environment flag.
- Persistence / Trace: Update harness docs, CI evidence, release gate docs, and trace.
