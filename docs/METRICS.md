# Metrics

Metrics are evidence surfaces, not vanity scores. Current values describe the CodeRail cutover and M0 prototype; future product metrics remain unbaselined until their stage exists.

## Current Governance Snapshot

Reviewed: 2026-07-11

- Coordinate coverage since Legacy Cutoff T-013: 100%.
- Current done-without-verify count since cutoff: 0.
- Historical weak-verification debt before cutoff: 1 task (T-000), retained as history.
- Orphan trace event count: 0.
- Trace format warnings: 2 original T-013 events; append-only superseding events contain the missing coordinate summaries.
- Current handoff task/resume-anchor coverage: 100% for T-013/T-013F.
- Current severe Doctor, Contract, Coordinate, Blueprint, Trace, Done, or CI blockers: 0 at T-013F verification.

## CodeRail Flow Metrics

- unnecessary stop count: not yet instrumented;
- autonomous task transition count: not yet instrumented;
- no-progress exhaustion count: not yet instrumented;
- unsafe decision crossing count: 0 observed since cutoff;
- drive scenario agreement: continuous mode active; T-015 -> T-016 -> T-017 autonomous transitions are tracked through finish/trace evidence.

## M0 Activation Metrics

- successful read-only thin-slice rate by Node/generic fixture;
- percent of commands returning valid versioned JSON and an executable recovery step;
- inspect/plan mutation violations: target 0;
- stale/tampered/mismatched plan rejection rate: target 100%;
- operations with repository identity, risk, verification, evidence, and recovery metadata: target 100%;
- time for a coding agent to produce and explain a first plan: baseline during T-014 dogfood.

## M1 Repository, M2 Trust, and M3 Launch Outcome Metrics

- builders reaching Repository Ready from working code;
- builders reaching Trust Ready with explicit license/security/support evidence;
- builders reaching Demo and Launch Ready with a verified demo, truthful visuals, release, and feedback path;
- median time and number of builder decisions required per stage;
- generated-claim evidence violations: target 0;
- plan-to-merged-PR and launch-preview-to-approved-launch conversion.
- M1 preview preservation violations: target 0;
- generated command claims without observed evidence: target 0.
- M1 default-branch mutation violations: target 0;
- M1 customized-content overwrite violations: target 0;
- duplicate commits, pushes, or PRs during retry: target 0;
- plan/branch/head-SHA/PR evidence binding: target 100%.
- M1 preview-create effects represented in saved artifact: target 100%;
- manual-review or unknown preview items entering execution: target 0;
- first-execution stale artifact acceptance: target 0.
- agent review token/artifact/confirmation binding: target 100%;
- invalid review token reaching an effect adapter: target 0;
- credential-free evidence misreported as live M1 achieved: target 0.

## M4 Web, M5 App, and M6 Growth/Portfolio/Team Metrics

These are planned definitions, not current measurements:

- Web workspace activation: repository connected and first plan reviewed;
- GitHub App retention: installations receiving useful, non-duplicated stewardship outcomes;
- maintenance recommendation acceptance and false-positive rates;
- growth actions with explicit publication consent and attributable feedback;
- multi-project/team adoption without cross-repository approval or data-boundary violations.

## Measurement Rules

- Record numerator, denominator, window, stage, and evidence source before publishing a metric.
- Separate local CLI, Web, GitHub App, and external-channel events.
- Do not infer product success from repository file presence or a single opaque score.
- Do not collect hosted analytics, personal data, or repository content until a contracted privacy and retention model exists.
