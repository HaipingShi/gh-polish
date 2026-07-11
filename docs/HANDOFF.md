# Handoff

Updated at: 2026-07-11
Handoff Level: H1
Current branch: master
Current task: T-022 non-live adapter implementation stage complete
Next task: prepare the exact reviewed artifact/effect confirmation for the separately gated `HaipingShi/coderail` live dogfood
Trace: docs/TRACELOG.jsonl
Inspect status: docs/CODERAIL_STATUS.md
Resume anchor: docs/CONTRACTS.md#CD-010-Live-GitHub-adapter-and-dogfood-boundary

## Coordinate Summary

Rail: full
Goal: Implement the accepted least-privilege, exact-repository, idempotent GitHub adapter boundary with non-live evidence.
Boundary: Injected HTTP/Git doubles only; no ambient credential access, real network, public CLI mutation, or user-repository effect.
Acceptance: Red preceded implementation; focused 8/8 and full CI 72/72 prove credential redaction, exact allowlisting/preflight, authorization-bound push/PR idempotency/reconciliation, and exact-SHA checks without network.
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

Prepare and review the repository-bound PlanArtifact and exact effect IDs for `HaipingShi/coderail`; do not paste the token into chat or run live mutation before the separate confirmation gate.
