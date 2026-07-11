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
