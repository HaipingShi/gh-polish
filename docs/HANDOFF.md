# Handoff

Updated at: 2026-07-11
Handoff Level: H1
Current branch: master
Current task: T-022 stakespeak allowlist amendment complete; private checkout unavailable to this process
Next task: resume read-only artifact preparation from a user-authenticated local stakespeak checkout
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: docs/CONTRACTS.md#CD-010-Live-GitHub-adapter-and-dogfood-boundary

## Coordinate Summary

Rail: full
Goal: Implement the accepted least-privilege, exact-repository, idempotent GitHub adapter boundary with non-live evidence.
Boundary: Public unauthenticated read-only clone/inspection of `HaipingShi/stakespeak` and external plan-store writes are allowed; no PAT, target mutation, push, PR, or public CLI mutation.
Acceptance: Red preceded implementation; focused 8/8 and full CI 72/72 prove the adapter. Read-only prepare produced artifact digest `26c1d12d...e9ef9e` at base `c699fb0...`, with integrity/binding passed and zero executable effects.
Persistence: CONTRACTS, TASKS, BLUEPRINTS, HARNESS, HANDOFF, TRACE/index/status.

## Contract State

- CD-010 status: accepted with recommended defaults.
- Exact live dogfood allowlist: `HaipingShi/stakespeak`; it supersedes the zero-effect CodeRail target and no other repository is authorized.
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

User clones `HaipingShi/stakespeak` with GitHub Desktop or another authenticated local tool and supplies only the local checkout path. Do not paste a token into chat; no live mutation is authorized yet.
