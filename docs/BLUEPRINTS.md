# Blueprints

> Architecture Blueprint Layer. Keep this index small and link to diagrams kept in Git, design tools, or generated artifacts.

Lifecycle status values:

- `planned`: needed but not created yet
- `current`: accurate enough to guide implementation and maintenance
- `stale`: exists but no longer reflects the system
- `missing`: required and absent
- `not-applicable`: intentionally not needed for this project

## Blueprint Index

| ID | Diagram | Status | Path / URL | Owner | Updated | Notes |
|---|---|---|---|---|---|---|
| UJM | User Journey Map | current | docs/PRD.md | project | 2026-07-09 | Core user flow covers push, plan, apply, PR, and monitor path. |
| UF | User Flow | current | docs/PRD.md | project | 2026-07-09 | Core user flow and MVP scope define primary CLI path. |
| PF | Page Flow / Wireframe Flow | not-applicable | | | | MVP has no Web UI. |
| SA | System Architecture | current | docs/ARCHITECTURE.md | project | 2026-07-09 | Context and container diagrams define CLI-first architecture. |
| CD | Component Diagram | current | docs/ARCHITECTURE.md | project | 2026-07-09 | Container diagram covers Analyzer, Planner, Policy, Adapter, Applier, Monitor. |
| SEQ | Sequence Diagram | current | docs/ARCHITECTURE.md | project | 2026-07-09 | Core workflow sequence diagram covers plan/apply/monitor. |
| SM | State Machine Diagram | planned | docs/ARCHITECTURE.md | project | | Needed before implementing plan/apply status transitions. |
| ERD | ER Diagram / Database Model | not-applicable | | | | MVP has no database. |
| DFD | Data Flow Diagram | current | docs/ARCHITECTURE.md | project | 2026-07-09 | Data flow diagram covers local files, GitHub state, plan, apply, evidence. |
| DD | Deployment Diagram | not-applicable | | | | MVP has no hosted runtime; CLI runs locally. |
| CICD | CI/CD Pipeline Flow | planned | docs/HARNESS_SPEC.md | project | | Needed after implementation stack is chosen. |

## Notes

- Mark a diagram `current` only when it can guide a new engineer or agent without guesswork.
- Mark a diagram `stale` as soon as code and diagram disagree.
- Use `not-applicable` deliberately; do not use it to hide unknown architecture.
- The first implementation task should either keep `SM` and `CICD` planned or add current diagrams before marking Full Rail work done.
