# Product Roadmap

This roadmap separates product maturity from delivery surface. M0 is the trustworthy execution foundation. Later stages are planned now so early domain contracts do not block Web UI, GitHub App, visibility, growth, or multi-project evolution.

Every implementation item must become a concrete CodeRail task with an accepted coordinate before work begins.

## Stage Gates

| Stage | Builder outcome | Entry gate | Exit evidence |
|---|---|---|---|
| M0 Agent-Native Deterministic Kernel | An agent can inspect, plan, dry-run apply, and verify safely | Prototype modules exist | Trusted thin-slice dogfood, durable plan, per-operation evidence, recovery |
| M1 Repository Ready | A visitor can understand and run the repository | M0 thin slice proven | Supported profiles complete truthful Repository Ready PRs |
| M2 Trust Ready | A visitor can assess ownership, safety, maintenance, and engineering evidence | M1 repository artifacts are accurate | Explicit license/support/security/CI/dependency evidence |
| M3 Demo and Launch Ready | A target user can see, try, and share the project | M2 trust evidence reliable | Verified demo, visuals, release, feedback path, Launch Pack |
| M4 Web Workspace | A novice can control the workflow visually | M3 user journey validated | Connected-repo plan/preview/execute flow with durable hosted evidence |
| M5 GitHub App Continuous Stewardship | Projects receive continuous, safe maintenance | Web auth/state and App contract accepted | Webhook/scheduled plans and PRs with least privilege and audit |
| M6 Growth, Portfolio, and Team | Launch, feedback, multiple projects, and collaborators form a managed loop | Single-project retention proven | Consent-based growth, portfolio, roles, policies, and batch planning |

## M0 Agent-Native Deterministic Kernel

### Completed prototype batch

- CLI command skeleton and mutation guard.
- Local repository context detection.
- Read-only GitHub adapter prototype.
- Local and remote analyzer prototypes.
- Initial policy, planner, template, executor, monitor, and harness modules.

These are test-covered modules, not an integrated MVP.

### T-014 Trusted inspect -> plan -> apply -> verify thin slice

- Wire `inspect` and `plan` to real context/analyzer modules.
- Define and persist a versioned, repository-bound, digest-protected plan.
- Emit stable JSON envelopes, exit codes, actionable errors, and recovery guidance.
- Make `apply --dry-run` load the saved plan and reject stale, tampered, or mismatched state.
- Make `verify` produce a plan-bound read-only evidence summary.
- Exercise Node and generic fixtures plus read-only dogfood on this repository.
- Prove no project-file or real GitHub mutation.

### T-015 Mutation-ready apply and evidence hardening

- Load the saved plan rather than accepting reconstructed operations.
- Validate repository identity, base revision, file hashes, payload digest, policy, and confirmation.
- Split PR file operations from immediate remote mutations.
- Record per-operation lifecycle, evidence, partial failure, retry, and recovery.
- Exercise a local bare-remote integration path before any allowlisted live test.

### T-016 Remote verification and completion hardening

- Bind checks to the target PR and revision.
- Report pending, success, failure, missing, and permission-limited evidence.
- Guide the agent through repair and final merge confirmation.
- Define M0 completion and Repository Ready entry evidence.

## M1 Repository Ready

### Profiles and intent

- Public project, private project, demo, library, application, and commercial-product profiles.
- Product-level questions for audience, visibility, contribution, and project profile.
- Defaults that explain impact without asking users to configure GitHub mechanics.

### Contextual repository artifacts

- Evidence-backed README sections generated with the calling agent.
- Accurate install/run/test/build commands from detected project state.
- Contribution, issue, and PR entry points appropriate to the project profile.

### Repository completion

- Pull-request preview and checks.
- Plain-language failure recovery.
- Explicit merge readiness and achieved-stage report.

## M2 Trust Ready

- Explicit license intent and decision assistance.
- Usable support, security contact, privacy, and contribution expectations.
- Stack- and package-manager-aware CI and dependency automation.
- Evidence-backed permissions and supply-chain recommendations.
- No placeholder workflows, invented tests, unverifiable badges, or unsupported security claims.
- Plain-language risk, ownership, and recovery evidence.

## M3 Demo and Launch Ready

- Demo/deployment discovery and verification.
- Screenshots, short demo media, social preview, and project visuals.
- Release preparation, version summary, and release notes.
- Value proposition, intended audience, known limitations, roadmap, and feedback path.
- Launch Pack with claim-to-evidence links and channel-specific drafts.
- Explicit approval before deployment, release, or external publication.

## M4 Web Workspace

- GitHub sign-in, repository connection, and project workspace.
- Maturity view with evidence and next actions.
- Plain-language decision wizard.
- Plan, diff, README, visual, demo, release, and launch-preview surfaces.
- Execution progress, checks, failure recovery, and confirmation controls.
- Hosted plan/evidence adapter selected through a separate architecture and vendor decision.

## M5 GitHub App Continuous Stewardship

- Least-privilege App installation and repository selection.
- Webhook and scheduled event adapters.
- Plan and evidence shown through Checks, PR comments, and the Web workspace.
- Documentation, dependency, demo, release, and policy drift detection.
- Maintenance PRs and explicit high-impact confirmation.
- Installation token, retry, deduplication, audit, and uninstall/data-retention behavior.

## M6 Growth, Portfolio, and Team

- Repeatable launch and relaunch workflows.
- Channel-specific content previews and explicit publishing boundaries.
- Visibility and feedback signal ingestion with privacy and provenance.
- Evidence-backed suggestions tied to product goals rather than vanity metrics.
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
