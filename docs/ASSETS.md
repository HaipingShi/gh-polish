# Asset Registry

## Canonical Sources

| Asset | Type | Canonical | Update Rule |
|---|---|---:|---|
| README.md | A3 project intro | yes | update when public command contract or project status changes |
| AGENTS.md | A1 governance entry | yes | update only for CodeRail operating rule changes |
| CLAUDE.md | A1 governance entry | yes | update only for CodeRail operating rule changes |
| docs/NORTH_STAR.md | A3 product direction | yes | update when outcome, invariant, slice, non-goal, or drift signal changes |
| docs/PRD.md | A3 product spec | yes | update when MVP/v1/v2/future scope changes |
| docs/ARCHITECTURE.md | A3 architecture | yes | update when module boundaries, workflow, data flow, or GitHub boundary changes |
| docs/BLUEPRINTS.md | A3 architecture index | yes | update when diagrams become current, stale, planned, or not-applicable |
| docs/GITHUB_CAPABILITIES.md | A3 capability matrix | yes | update when GitHub feature support or permission assumptions change |
| docs/MVP_TASKS.md | A3 roadmap | yes | update when MVP task split changes |
| docs/TASKS.md | A3 CodeRail task state | yes | update task state, coordinate, verification, and closeout evidence |
| docs/HARNESS_SPEC.md | A3 verification contract | yes | update when test commands or gates change |
| docs/DECISIONS.md | A3 ADR log | yes | append ADRs for durable decisions |
| docs/HANDOFF.md | A3 handoff state | yes | update for H1/H2/H3 handoff events |
| docs/CODERAIL_STATUS.md | A3 generated/inspect state | yes | prefer regenerating with CodeRail inspect when scripts are installed |
| docs/TRACELOG.jsonl | A3 append-only trace | yes | append events only |
| docs/TRACE_INDEX.md | A3 generated trace index | yes | regenerate after trace updates when scripts are installed |
| package.json | A3 package contract | yes | update when CLI scripts, package metadata, or dependencies change |
| package-lock.json | A3 dependency lock | yes | update only via npm install/update |
| tsconfig.json | A3 TypeScript config | yes | update when build/typecheck targets change |
| src/cli.ts | A3 CLI entrypoint | yes | keep command contract and no-mutation behavior explicit |
| src/mutationGuard.ts | A3 safety guard | yes | update only through policy or harness tasks |
| src/git.ts | A3 git adapter | yes | keep local git execution injectable and read-only |
| src/repositoryContext.ts | A3 repository context | yes | update when local repo detection semantics change |
| src/githubAdapter.ts | A3 GitHub read adapter | yes | keep API access read-only and fetch-injected |
| src/localAnalyzer.ts | A3 local analyzer | yes | keep local filesystem inspection read-only and deterministic |
| src/remoteAnalyzer.ts | A3 remote analyzer | yes | normalize GitHub read results without crashing on permission gaps |
| src/policy.ts | A3 policy engine | yes | update when risk classes or confirmation rules change |
| src/planner.ts | A3 planner | yes | keep dry-run plan schema deterministic and policy-backed |
| src/templateRegistry.ts | A3 template registry | yes | keep templates stack-aware and overwrite-safe |
| src/applier.ts | A3 apply coordinator | yes | keep real mutation env-gated and confirmation-gated |
| src/monitor.ts | A3 monitor | yes | keep check summaries read-only and recommendation-only |
| test/cli.test.ts | A3 verification asset | yes | update with CLI command contract changes |
| test/repositoryContext.test.ts | A3 verification asset | yes | update with repository context behavior changes |
| test/githubAdapter.test.ts | A3 verification asset | yes | update with GitHub read adapter behavior changes |
| test/localAnalyzer.test.ts | A3 verification asset | yes | update with local analyzer behavior changes |
| test/remoteAnalyzer.test.ts | A3 verification asset | yes | update with remote analyzer behavior changes |
| test/policy.test.ts | A3 verification asset | yes | update with policy behavior changes |
| test/planner.test.ts | A3 verification asset | yes | update with planner/schema behavior changes |
| test/templateRegistry.test.ts | A3 verification asset | yes | update with template behavior changes |
| test/applier.test.ts | A3 verification asset | yes | update with apply safety behavior changes |
| test/monitor.test.ts | A3 verification asset | yes | update with monitor behavior changes |
| test/harness.test.ts | A3 verification asset | yes | update with harness safety behavior changes |

## External References

| Asset | Type | Canonical | Update Rule |
|---|---|---:|---|
| https://github.com/HaipingShi/coderail.git | A0 governance source | yes | pin or vendor only after MVP-001 decides dependency strategy |

## Boundary Notes

- Raw temporary clones are not permanent project assets.
- Generated trace/status indexes should be refreshed by CodeRail scripts once the dependency strategy is chosen.
- Business code assets do not exist yet.
