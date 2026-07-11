# Handoff

Updated at: 2026-07-11
Handoff Level: H1
Current branch: master
Completed task: T-014
Next task: T-015 contract draft CD-004 proposed; implementation not authorized
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: CD-004-review

## Coordinate Summary

Rail: full
G: Make M0 apply trustworthy through explicit authorization, branch isolation, plan-bound evidence, and recoverable partial failure.
T: Draft CD-004 and T-015; do not execute implementation before user acceptance.
S: `docs/CONTRACTS.md`, `docs/TASKS.md`, `docs/HANDOFF.md`, and append-only trace only; no source/tests, live GitHub mutation, user-repository effects, dependency/build/workflow changes, hosted infrastructure, or local CodeRail source.
V: Contract and Coordinate checks, trace/index refresh, and manual contract review.
X: Stop on an unaccepted execution boundary, any live/user-repository effect, or an unresolved product decision.
P: TASKS, HANDOFF, TRACE, generated index, and runtime status.

## Direction

The durable maturity path is:

`M0 Agent-Native Deterministic Kernel -> M1 Repository Ready -> M2 Trust Ready -> M3 Demo and Launch Ready -> M4 Web Workspace -> M5 GitHub App Continuous Stewardship -> M6 Growth, Portfolio, and Team`

Trust Ready is deliberately separate from repository presentation and launch visibility. Later stages have entry harnesses and blueprint prerequisites but no current implementation authorization.

## T-015 Contract Draft

- CD-004 proposes a Full Rail local-only mutation-ready executor and evidence lifecycle.
- It permits real Git effects only inside temporary test repositories and local bare remotes; it keeps the public CLI validation-only and forbids live GitHub/user-repository mutation.
- User acceptance or revision of CD-004 is the start gate for T-015.

## Completed T-014 Work

- Replaced the T-001 CLI stubs with versioned JSON envelopes for `inspect`, `plan`, validation-only `apply --dry-run`, and `verify`.
- Added an external local plan store with repository identity, base SHA, content hashes, expiry, immutable operations/digest, evidence, and recovery.
- Added fixture coverage for Node/generic workflows plus tamper, stale, expiry, and repository-mismatch rejection.
- Recorded ADR-015 to preserve the no-project-write M0 boundary.
- Completed read-only dogfood on this repository without GitHub or project-file mutation.

## Verification

- Required Red evidence: the added JSON-envelope test failed against the stub before implementation.
- Green evidence: Node/generic fixture tests passed with tamper, stale, expiry, and mismatch rejection.
- Read-only dogfood: all four commands returned version 1 JSON envelopes; before/after Git status and top-level inventory were identical.
- Project regression: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run ci` passed with 35 tests.
- CodeRail TDD, CI, Contract, Coordinate, Blueprint, and Done gates passed.

## Handoff Trigger Check

- Level: H1 because T-015 needs an independent Full Rail contract draft before effectful behavior is authorized.
- Handoff updated: yes.

## Auto Commit

- Eligible: yes
- Action: committed with manual exact-path staging after the Closeout scope parser warning
- Commit: task-scoped T-014 closeout commit
- Exact files staged: T-014-scoped source, tests, README, and docs only
- Safe to stage: `src/cli.ts`, `src/protocol.ts`, `src/planArtifact.ts`, `test/cli.test.ts`, `test/t014.thinSlice.test.ts`, `README.md`, and T-014 docs
- Do not stage: `dist/`, `node_modules/`, external local plan artifacts, package/build/workflow files, local CodeRail source, or unrelated changes
- Ignored/generated artifacts: `node_modules/`, `dist/`, local application-data plan store, generated trace/status files
- Avoid git add .: yes

## Next Executable Step

Review CD-004. On acceptance, start T-015 in an independent Full Rail execution turn; first inspect state, append intent trace, add Red tests, and keep effects inside temporary repositories/local bare remotes. Do not enable live GitHub or user-repository mutation without a later contract.
