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
| docs/TASK_GRAPH.md | A3 roadmap dependency graph | yes | update when the critical path or stage dependencies change |
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
| src/protocol.ts | A3 M0 protocol | yes | keep versioned JSON envelopes and actionable recovery stable |
| src/planArtifact.ts | A3 M0 plan artifact | yes | keep repository-bound schema, digest, expiry, and local-store validation deterministic |
| src/localApply.ts | A3 local apply lifecycle | yes | execute only validated artifact effects with confirmation, retry, and evidence |
| src/localGitExecutor.ts | A3 local Git executor | yes | restrict effectful integration to test-owned repositories and local bare remotes |
| src/remoteVerification.ts | A3 remote verification | yes | bind read-only workflow evidence to exact plan branch and revision |
| src/repositoryProfile.ts | A3 repository profile policy | yes | keep six M1 profile requirements explicit and deterministic |
| src/artifactPreview.ts | A3 Repository Ready preview | yes | preserve existing content and render only evidence-backed previews |
| src/repositoryReadyExecution.ts | A3 Repository Ready execution coordinator | yes | bind local branch effects and idempotent PR evidence to one repository plan |
| src/repositoryReadyWorkflow.ts | A3 M1 end-to-end workflow | yes | keep preview preparation/external artifact persistence separate from explicitly confirmed local/mock execution |
| test/cli.test.ts | A3 verification asset | yes | update with CLI command contract changes |
| test/t014.thinSlice.test.ts | A3 T-014 verification asset | yes | exercise Node/generic thin slices plus tamper/stale rejection without project mutation |
| test/t015.artifact.test.ts | A3 T-015 verification asset | yes | prove immutable artifact-bound effects and tamper/missing rejection |
| test/t015.localApply.test.ts | A3 T-015 verification asset | yes | prove authorization, lifecycle, partial failure, retry, and idempotency |
| test/t015.localBareRemote.test.ts | A3 T-015 verification asset | yes | prove non-default-branch effects against local bare remotes |
| test/t016.remoteVerification.test.ts | A3 T-016 verification asset | yes | prove target-bound remote state classification and repair guidance |
| test/t017.artifactPreview.test.ts | A3 T-017 verification asset | yes | prove six profiles, preservation, and observed/unknown command evidence |
| test/t018.repositoryReadyExecution.test.ts | A3 T-018 verification asset | yes | prove branch isolation, overwrite refusal, stale-plan rejection, partial-failure retry, and one mocked PR |
| test/t019.repositoryReadyWorkflow.test.ts | A3 T-019 verification asset | yes | prove Node/generic preview-to-artifact-to-PR/check flow, non-executable preview states, staleness, tamper, confirmation, and retry boundaries |
| .coderail/coderail.py | A1 repository CodeRail runner | yes | generated by standard init; delegates to the configured local runtime |
| .coderail/config.json | A1 repository CodeRail config | yes | points to the user-supplied local CodeRail home |
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
| G:\codeRail\coderail | A0 local CodeRail runtime | yes | read templates/references and execute scripts in place; do not clone, install, copy wholesale, or modify without an explicit CodeRail-source task |

## Boundary Notes

- CodeRail is consumed from the user-supplied local absolute path for this workspace and is not vendored into the project.
- Generated trace/status indexes are refreshed with scripts from the local CodeRail runtime.
- `src/` and `test/` are existing implementation and verification assets; product-direction Light Rail work must not modify them.
- Future Web, GitHub App, launch, and growth assets become canonical only when their stage contracts authorize creation.
- T-013F compared `AGENTS.md` and `CLAUDE.md` with the local standard templates and incrementally restored the missing Continuous Drive checkpoint rules; both entry files now match the current local templates without destructive overwrite.
- `docs/HARNESS_SPEC.md` and `docs/METRICS.md` are project-specific extensions of the standard templates, not copies of generic placeholder content.
- M0 plan artifacts are generated local application-data records outside the inspected repository. They are not project assets, are not committed, and may be redirected only with `GH_POLISH_PLAN_STORE_DIR`.
