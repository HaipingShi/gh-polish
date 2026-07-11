# Handoff

Updated at: 2026-07-11
Handoff Level: H1
Current branch: master
Current task: T-021 accepted CD-010, exact repository prerequisite pending
Next task: T-022 live GitHub adapter implementation remains unactivated
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: docs/CONTRACTS.md#CD-010-Live-GitHub-adapter-and-dogfood-boundary

## Coordinate Summary

Rail: light
Goal: Establish the least-privilege, exact-repository, idempotent safety contract required before live GitHub mutation.
Boundary: Documentation only; no source/tests/dependencies, credential access, user-repository effects, or GitHub mutation.
Acceptance: CD-010 covers credentials, permissions, allowlist, live effects, idempotency, recovery, threats, verification, Stop conditions, persistence, and four user decisions.
Persistence: CONTRACTS, TASKS, BLUEPRINTS, HARNESS, HANDOFF, TRACE/index/status.

## Contract State

- CD-010 status: accepted with recommended defaults.
- Future implementation task: T-022, not activated.
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

User replaces the placeholder with the exact dogfood `owner/repository`; do not paste the token into chat and do not activate T-022 beforehand.
