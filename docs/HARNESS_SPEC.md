# Harness Specification

The harness protects the product promise across its staged evolution: an AI coding agent may explain and draft, but gh-polish must deterministically prove repository identity, plan validity, authorization, mutation boundaries, and outcome evidence.

Current executable gates apply to the M0 local CLI kernel. M1-M6 sections are stage-entry contracts, not claims that Web UI, GitHub App, launch, growth, or multi-project runtimes exist today.

## Global Checks

The current implementation uses Node.js 22, TypeScript, and Node's built-in test runner.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run ci
```

`npm run ci` is the current aggregate. Lint currently aliases strict TypeScript checking. Formatter and coverage thresholds must be contracted before a published release.

## Local CodeRail Checks

Use the user-supplied runtime directly; do not clone, install, vendor, or modify it during project tasks.

```powershell
python "G:\codeRail\coderail\scripts\doctor.py" --target .
python "G:\codeRail\coderail\scripts\contract_check.py" --target .
python "G:\codeRail\coderail\scripts\coordinate_check.py" --target .
python "G:\codeRail\coderail\scripts\blueprint_check.py" --target .
python "G:\codeRail\coderail\scripts\trace_doctor.py" --target .
python "G:\codeRail\coderail\scripts\ci_gate.py" --target .
```

Before completion, use `done_gate.py` with the real task, rail, type, and fresh evidence. Refresh trace index and runtime status, then use `closeout_check.py` with exact task scope.

## Trust Invariants

- `inspect` and `plan` never mutate local project files or GitHub state.
- `apply` loads an identity-bound saved plan; it does not accept reconstructed operations as equivalent evidence.
- Repository identity, base revision, relevant content hashes, schema/tool version, operation digest, and confirmation state are validated before apply.
- High-impact operations require explicit confirmation and plain-language impact.
- File/PR operations, immediate GitHub settings, merge/release, deployment, and external publication are separate operation groups.
- Verification binds evidence to the target plan and revision rather than unrelated repository-wide history.
- No workflow, test, deployment, screenshot, badge, release, or feature claim is considered successful without evidence.
- Partial failure records per-operation state and one recoverable next action.
- Real GitHub mutation remains disabled in automated tests unless a separately contracted allowlist and explicit flag are both present.

## M0 Agent-Native Kernel Harness

### Unit and Contract Tests

- Repository context and GitHub remote parsing.
- Local and remote finding normalization, including degraded permissions and missing credentials.
- Policy decisions for every operation surface and risk class.
- Versioned plan schema validation and deterministic serialization.
- Repository identity, base SHA, content hash, expiry, payload digest, and stale-plan rejection.
- Agent-facing JSON envelope, stable exit codes, actionable errors, and recovery fields.
- Artifact selection and overwrite protection.
- Apply validation, idempotency, per-operation evidence, partial failure, and recovery.
- Plan-bound verify summaries.

### Integration Tests

- Mocked GitHub reads never require credentials or live network access.
- Node and generic fixture repositories exercise `inspect -> plan -> apply --dry-run -> verify`.
- A temporary git repository and local bare remote exercise Git behavior without the user's working tree.
- Missing token, permission denied, rate limit, not found, invalid response, network failure, dirty tree, detached HEAD, and stale base are covered.
- A tampered plan or mismatched repository is refused before any effect.

### CLI Smoke Contract

The intended T-014 surface is:

```powershell
gh-polish inspect --json
gh-polish plan --profile public-project --json
gh-polish apply --plan <plan-id-or-returned-path> --dry-run --json
gh-polish verify --plan <plan-id-or-returned-path> --json
```

`plan` persists the artifact in a local application-data store outside the inspected project and returns the plan ID and path. `GH_POLISH_PLAN_STORE_DIR` may select an alternate local store. Snapshot changes to the structured protocol are public product-contract changes.

### Read-Only Dogfood

- Run on this repository and representative Node/generic fixtures.
- Capture command, exit code, JSON output, warnings, recovery guidance, and filesystem/Git status before and after.
- Prove no project-file or GitHub mutation.
- Live remote reads require an explicitly available user credential; missing credentials must degrade rather than block local inspection.

### M0 Exit Gate

- T-014 proves a durable repository-bound plan and read-only command protocol.
- T-015 proves immutable local effect payloads, explicit confirmation, non-default-branch isolation, partial-failure evidence, and idempotent retry in test-owned repositories.
- T-016 proves exact branch/SHA remote-run filtering and deterministic pending, success, failure, missing, and permission-limited evidence.
- Mandatory evidence is credential-free, the GitHub adapter remains GET-only, project CI passes, and repository dogfood reports `mutation: none`.
- M1 may begin only from an accepted profile-aware Repository Ready contract; M0 completion does not authorize live GitHub mutation.

## M1 Repository Ready Harness

Entry requirement: M0 thin slice passes with trustworthy plans and evidence.

- Profiles distinguish public project, private project, demo, library, application, and commercial product.
- README, metadata, commands, community files, and workflows are contextual rather than placeholders.
- Install/run/test/build commands are observed or explicitly marked unknown.
- Existing customized content produces patch/manual-review behavior.
- A Repository Ready PR passes its detected checks and presents one merge decision to the builder.

### Read-Only Preview Gate

- Six profiles have explicit artifact requirements.
- Existing customized files are manual-review items and never receive generated overwrite content.
- Commands are observed from analysis or marked unknown; unknown commands cannot produce fake CI.
- Node/generic preview fixtures and public-project repository dogfood are deterministic and mutation-free.
- Effectful branch/PR execution requires the separately reviewed T-018 contract.

### Local Effectful PR Gate

- The production-facing coordinator derives confirmed file effects only from a digest-validated saved PlanArtifact; tampered, missing, repeated, or non-file payloads fail before adapters.
- Mandatory verification remains credential-free: temporary Node/generic repositories, local bare remotes, and a mocked idempotent PR adapter.
- The default branch SHA must remain unchanged; the pushed head SHA must bind the repository, plan, base branch, head branch, and PR evidence.
- Existing customized content is refused before push or PR creation.
- Local-effect and PR-adapter partial failures retain per-stage evidence and retry only unfinished work.
- Retry must not duplicate successful file effects, commits, pushes, or pull requests.
- A stale base SHA fails before file effects; live GitHub dogfood requires a separate repository and credential approval.
- Exact plan/branch/head-SHA check evidence maps success to `ready-for-review`, non-success to `not-ready`, and unreadable or mismatched evidence to `unknown`; none of these states performs merge.

### Credential-Free End-to-End Gate

- `prepare` produces a profile-aware preview and digest-valid PlanArtifact in an external local store without changing the inspected repository.
- Only evidence-backed `create` items become confirmation-gated effects; `manual_review` and `unknown` remain visible but non-executable.
- First execution reloads the saved artifact and revalidates expiry, repository identity, base SHA, and relevant content hashes before adapters.
- Node and generic fixtures complete the local bare-remote, mocked PR, exact-SHA check, and merge-decision chain; retry reuses the existing commit and PR.
- No credentials, live network, default-branch mutation, or automatic merge are permitted.

### Agent Protocol Gate

| Operation | Inspected repository | Plan store | Execution ports | Required output |
|---|---|---|---|---|
| `repository-ready.prepare` | no mutation | write external artifact | none | preview, plan reference, exact confirmation IDs, `awaiting-review` |
| `repository-ready.review` | no mutation | read only | none | exact-confirmation validation, deterministic review token, `ready-to-execute` |
| `repository-ready.execute` | confirmed non-default branch only | read only | injected local bare-remote, PR, and check ports | execution evidence and truthful M1 report |

- The review token binds the saved artifact digest and sorted exact confirmations; it is correlation evidence, not an authentication secret or persistent approval session.
- Invalid tokens and missing/extra confirmations fail before local, PR, or check adapters.
- Credential-free M1 is `achieved` only when execution completes with a PR result, exact-SHA successful checks, and `ready-for-review`.
- Without separately authorized live evidence, `liveGitHub` and overall M1 remain `deferred`; pending or failed credential-free evidence makes overall M1 `not-ready`.
- The public CLI remains the M0 `inspect/plan/apply --dry-run/verify` contract and exposes no T-020 mutation command.

### Proposed Live GitHub Dogfood Gate

This gate is not authorized until CD-010 is explicitly accepted and one repository is allowlisted.

- Use a short-lived fine-grained token for exactly one repository with `Contents: write`, `Pull requests: write`, and `Actions: read`; do not request `Workflows: write` in the initial slice.
- Require the global live-mutation flag, exact repository allowlist, fetched numeric repository identity, local remote agreement, saved artifact, review token, and exact live confirmation.
- Permit create-only non-workflow files on a deterministic non-default branch and one draft PR; forbid overwrite, force push, default-branch mutation, merge, settings, release, deployment, publication, and automatic cleanup.
- Bind idempotency to repository ID, plan digest, base branch/SHA, and head branch; reuse exact branch/PR matches and stop on conflicts.
- Verify only the pushed head SHA, scan all evidence for secrets, and record before/after default-branch state.
- Live completion requires repository-bound branch, PR, check, retry, and no-secret evidence; pending checks remain not-ready.

### T-022 Non-Live Adapter Gate

- Mandatory tests inject both HTTP and Git runners; they never use ambient credentials or contact GitHub.
- Credential resolution accepts only an explicit token or caller-supplied `GH_TOKEN` environment map. `GITHUB_TOKEN` does not grant implicit local authority, and serialized credential metadata contains no token.
- Authorization requires the enable flag, exact single-repository allowlist, fetched numeric identity, local/artifact repository agreement, default branch/base SHA, minimum declared permissions, review token, and exact create-only effects.
- Repository preflight reads canonical identity and the exact base ref; check verification filters workflow runs by both target branch and head SHA.
- Git push uses an exact HTTPS remote, a deterministic non-default branch, no force flag, non-interactive credential delivery outside argv, exact remote-SHA reconciliation, and conflict refusal.
- Draft PR creation lists before mutation, reuses one exact plan marker, refuses mismatched/multiple candidates, and performs read-after-write reconciliation after `422`.
- Write adapters require the immutable authorization result at construction and revalidate repository, branch/base/plan, and effect identity before invoking injected effects.
- Source/document secret scan and before/after worktree comparison accompany focused and full CI. Live dogfood remains a separate explicit confirmation gate.

## M2 Trust Ready Harness

Entry requirement: supported M1 profiles can complete a truthful Repository Ready PR.

- License choice is explicit and linked to builder intent.
- Security/support/contact paths are usable and do not leak private data.
- CI, dependency automation, permissions, and supply-chain recommendations are evidence-backed.
- No fake-green workflow, invented test, unverified badge, or unsupported security claim is allowed.
- Risk explanations and recovery are understandable without GitHub terminology.

## M3 Demo and Launch Ready Harness

Entry requirement: Repository and Trust evidence are reliable.

- Demo/deployment URL is reachable and associated with the intended revision/environment.
- Screenshots and demo media show the actual project state.
- Release/release notes match committed capability.
- OG/social assets and channel drafts contain only claim-ledger facts or explicit unverified drafts.
- Known limitations, roadmap, and feedback path are visible.
- Deployment, release, and external publication each require explicit approval and post-action evidence.

## M4 Web Workspace Entry Harness

This is planned, not currently executable. Before Web implementation, the Web page flow, hosted data/tenancy model, deployment topology, and threat model must be current.

- GitHub sign-in and repository selection respect account/repository boundaries.
- Plans, diffs, risks, README, visuals, demo, release, and sharing previews match kernel artifacts.
- Builder decisions use plain language with progressive disclosure.
- Refresh/retry does not duplicate mutation.
- Loading, empty, degraded, partial-failure, recovery, and cancellation states are tested.
- Browser tests cover supported desktop/mobile flows, accessibility, console errors, and visual non-overlap.
- Web execution cannot bypass the same plan, policy, confirmation, and evidence gates as CLI.

## M5 GitHub App Entry Harness

This is planned, not currently executable. Before App implementation, permission/event, installation lifecycle, deduplication, retry, retention, and threat blueprints must be current.

- Webhook signatures, replay protection, delivery deduplication, retry, and idempotency are tested.
- Installation/user tokens are short-lived, least-privilege, repository-scoped, and never logged.
- Installation, repository access change, suspension, and uninstall lifecycle are covered.
- Checks, PR comments, scheduled inspections, and maintenance PRs reference the same plan/evidence model.
- Events may propose work but do not grant implicit approval for high-risk settings.
- Cross-installation and cross-tenant access tests fail closed.

## M6 Growth, Portfolio, and Team Entry Harness

This is planned, not currently executable.

- External publication requires channel-specific explicit consent and idempotency.
- Visibility and feedback signals record provenance, privacy classification, and retention.
- Recommendations connect to builder goals rather than vanity metrics.
- Multi-repository plans remain repository-bound; approval is not silently reused across projects.
- Collaborator roles, organization policy profiles, and audit boundaries are tested.

## Fixture Strategy

Current fixtures:

- empty generic repository;
- Node project with scripts;
- Python, Go, and Rust detection fixtures;
- existing customized docs/workflows;
- partial GitHub metadata and permission-degraded responses.

T-014 must make Node and generic fixtures exercise the complete read-only thin slice. Fixtures must contain no secrets, private repository names, or user-specific paths.

## Evidence Requirements

Each successful task records:

- exact commands and exit results;
- Red/Green/Refactor evidence when TDD is required;
- snapshots or structured protocol fixtures when behavior is a contract;
- before/after Git and filesystem evidence for mutation-sensitive work;
- plan, operation, verification, and recovery identifiers;
- CodeRail verify trace, refreshed trace index, runtime status, done gate, handoff check, and closeout state.

## Drive Progress Harness

- Progress signal: acceptance items completed with passing fresh evidence and no scope violations.
- How to measure: task acceptance checklist, failing/passing test count, gate status, and unresolved blocker count.
- Improvement direction: increase completed acceptance; decrease failing checks and unresolved blockers.
- Checkpoint command: task-specific V commands followed by `drive_check.py` only when a continuous Drive Contract is explicitly active.
- Terminal evidence: Done Gate pass, persistence/trace synced, clean task-scoped commit, and next executable step.

Activity without measurable progress does not satisfy a continuous Drive Contract.

## Release Rule

No maturity stage, delivery surface, or task is complete merely because modules exist. Completion requires its entry/exit evidence, current blueprints, scope compliance, trace, and the rail-appropriate done/closeout gates.
