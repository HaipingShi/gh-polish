# Product Roadmap

This roadmap separates product maturity from delivery surface. P0 is the trustworthy execution foundation. Later stages are planned now so early domain contracts do not block Web UI, GitHub App, visibility, growth, or multi-project evolution.

Every implementation item must become a concrete CodeRail task with an accepted coordinate before work begins.

## Stage Gates

| Stage | Builder outcome | Entry gate | Exit evidence |
|---|---|---|---|
| P0 Deterministic Foundation | An agent can inspect, plan, apply, and verify safely | Prototype modules exist | End-to-end dogfood, durable plan, per-operation evidence, recovery |
| P1 Repository Ready | A visitor can understand, run, and trust the repository | P0 read/apply path proven | Supported profiles complete truthful Repository Ready PRs |
| P2 Launch Ready | A target user can see, try, and share the project | P1 evidence reliable | Verified demo, visuals, release, feedback path, Launch Pack |
| P3 Web Workspace | A novice can control the workflow visually | P2 user journey validated | Connected-repo plan/preview/execute flow with durable hosted evidence |
| P4 GitHub App Stewardship | Projects receive continuous, safe maintenance | Web auth/state and App contract accepted | Webhook/scheduled plans and PRs with least privilege and audit |
| P5 Growth Loop | Launch and feedback become repeatable | Launch artifacts and consent model proven | Evidence-backed distribution and improvement cycles |
| P6 Portfolio and Team | Multiple projects and people share governance | Single-project retention proven | Tenant-aware portfolio, roles, policies, and batch planning |

## P0 Deterministic Foundation

### Completed prototype batch

- CLI command skeleton and mutation guard.
- Local repository context detection.
- Read-only GitHub adapter prototype.
- Local and remote analyzer prototypes.
- Initial policy, planner, template, executor, monitor, and harness modules.

These are test-covered modules, not an integrated MVP.

### T-014 Agent-native read-only vertical slice

- Wire `inspect` and `plan` to repository context and analyzers.
- Define versioned, repository-bound plan schema and validation.
- Emit stable JSON plus a human summary for the calling agent.
- Resolve `gh auth token` or return an actionable degraded state.
- Run read-only dogfood on this repository and representative fixtures.
- Prove no local or GitHub mutation.

### T-015 Trustworthy apply and evidence

- Load the saved plan rather than accepting reconstructed operations.
- Validate repository identity, base revision, file hashes, payload digest, policy, and confirmation.
- Split PR file operations from immediate remote mutations.
- Record per-operation lifecycle, evidence, partial failure, retry, and recovery.
- Exercise a local bare-remote integration path before any allowlisted live test.

### T-016 Plan-bound verification and completion

- Bind checks to the target PR and revision.
- Report pending, success, failure, missing, and permission-limited evidence.
- Guide the agent through repair and final merge confirmation.
- Define P0 completion and Repository Ready entry evidence.

## P1 Repository Ready

### Profiles and intent

- Public project, private project, demo, library, application, and commercial-product profiles.
- Product-level questions for audience, visibility, contribution, support, security contact, and license intent.
- Defaults that explain impact without asking users to configure GitHub mechanics.

### Contextual repository artifacts

- Evidence-backed README sections generated with the calling agent.
- Accurate install/run/test/build commands from detected project state.
- License decision assistance with explicit approval.
- Community health, support, security, contribution, issue, and PR assets.
- Stack- and package-manager-aware CI and dependency automation.
- No placeholder workflows that produce misleading success.

### Repository completion

- Pull-request preview and checks.
- Plain-language failure recovery.
- Explicit merge readiness and achieved-stage report.

## P2 Launch Ready

- Demo/deployment discovery and verification.
- Screenshots, short demo media, social preview, and project visuals.
- Release preparation, version summary, and release notes.
- Value proposition, intended audience, known limitations, roadmap, and feedback path.
- Launch Pack with claim-to-evidence links and channel-specific drafts.
- Explicit approval before deployment, release, or external publication.

## P3 Web Workspace

- GitHub sign-in, repository connection, and project workspace.
- Maturity view with evidence and next actions.
- Plain-language decision wizard.
- Plan, diff, README, visual, demo, release, and launch-preview surfaces.
- Execution progress, checks, failure recovery, and confirmation controls.
- Hosted plan/evidence adapter selected through a separate architecture and vendor decision.

## P4 GitHub App Stewardship

- Least-privilege App installation and repository selection.
- Webhook and scheduled event adapters.
- Plan and evidence shown through Checks, PR comments, and the Web workspace.
- Documentation, dependency, demo, release, and policy drift detection.
- Maintenance PRs and explicit high-impact confirmation.
- Installation token, retry, deduplication, audit, and uninstall/data-retention behavior.

## P5 Growth Loop

- Repeatable launch and relaunch workflows.
- Channel-specific content previews and explicit publishing boundaries.
- Visibility and feedback signal ingestion with privacy and provenance.
- Evidence-backed suggestions tied to product goals rather than vanity metrics.

## P6 Portfolio and Team

- Multi-project portfolio and maturity views.
- Shared brand assets, profiles, and organization policies.
- Collaborator roles and approval boundaries.
- Batch inspection with separate repository-bound plans.
- Trend and stewardship reporting without collapsing projects into one opaque score.

## Cross-Stage Epics

- **Trust:** identity, plans, confirmation, evidence, recovery, audit, and privacy.
- **Agent experience:** stable structured protocol, capability discovery, actionable errors, and portable integration guidance.
- **Builder experience:** ordinary-language decisions, progressive disclosure, previews, and one meaningful next step.
- **Artifact quality:** contextual creation, factual evidence, visual previews, and safe publication.
- **Extensibility:** inspector, artifact, auth, event, store, and delivery adapters.
- **Economics:** measure activation and retention before selecting hosted pricing or infrastructure.

## Explicit Sequencing Rules

- Later-stage planning is required; later-stage implementation is not allowed without its entry gate and a new contract.
- Web UI does not replace the CLI kernel; GitHub App does not bypass Web/plan evidence.
- Growth features cannot publish externally without explicit consent and fact verification.
- Multi-repository automation cannot reuse one approval across unrelated repository plans.
