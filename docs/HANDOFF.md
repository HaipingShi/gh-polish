# Handoff

Updated at: 2026-07-11
Handoff Level: H1
Current branch: master
Current task: T-022 stage complete; read-only artifact proves zero allowed create effects for `HaipingShi/coderail`
Next task: decision required between a dedicated sandbox repository (recommended) and a new patch-existing-content contract
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: docs/CONTRACTS.md#CD-010-Live-GitHub-adapter-and-dogfood-boundary

## Coordinate Summary

Rail: full
Goal: Implement the accepted least-privilege, exact-repository, idempotent GitHub adapter boundary with non-live evidence.
Boundary: Read-only access to `G:\\codeRail\\coderail` is explicitly allowed for artifact preparation; no target write, ambient credential access, network mutation, or public CLI mutation.
Acceptance: Red preceded implementation; focused 8/8 and full CI 72/72 prove the adapter. Read-only prepare produced artifact digest `26c1d12d...e9ef9e` at base `c699fb0...`, with integrity/binding passed and zero executable effects.
Persistence: CONTRACTS, TASKS, BLUEPRINTS, HARNESS, HANDOFF, TRACE/index/status.

## Contract State

- CD-010 status: accepted with recommended defaults.
- Exact live dogfood allowlist: `HaipingShi/coderail`; no other repository is authorized.
- Future implementation task: T-022, eligible but not activated by T-021 closeout.
- SEC blueprint remains planned until CD-010 is accepted and implementation evidence exists.
- Initial recommended credential: short-lived fine-grained PAT, one repository, `Contents: write`, `Pull requests: write`, `Actions: read`.
- Initial live effects: create-only README, gitignore, contributing guide, and PR template; no workflows.
- Default PR policy: deterministic branch, draft PR, reuse exact matches, no merge or cleanup.

## Handoff Trigger Check

- H1: decision-grade credential, repository authority, and external mutation boundary requires explicit user review.

## Auto Commit

- CodeRail state files may auto-commit during finish.
- Remaining contract docs use exact-path staging only; never `git add .`.

## Next Executable Step

User names a dedicated non-sensitive sandbox `owner/repository` with a missing README, gitignore, contributing guide, or PR template. Alternatively, request a separate contract draft for patching existing content; do not run live mutation under CD-010 as written.
