# gh-polish PRD

## Product Background

Many vibe coders, solo builders, and small teams ship useful code but leave the GitHub repository around it unfinished: missing descriptions, weak READMEs, no CI, no issue templates, inconsistent labels, and unclear security posture. These gaps make projects look less trustworthy and make future maintenance harder.

gh-polish is an agent-driven post-push polish workflow. After code is pushed, it inspects repository metadata, project hygiene, engineering readiness, and GitHub feature configuration. It then produces a concrete plan, asks for confirmation, applies safe improvements through a branch and pull request by default, and monitors the resulting checks.

The product is not a generic GitHub CLI wrapper. It is a repository stewardship workflow that combines local project analysis, GitHub API inspection, policy-gated planning, and controlled mutation.

## Target Users

- Vibe coders who want their public projects to look credible without learning every GitHub setting.
- Solo builders who need a repeatable polish pass after shipping features.
- Small teams that want lightweight repository hygiene without a platform team.
- Open-source maintainers who want consistent templates, labels, CI basics, and security docs.
- Agents or automation pipelines that need a disciplined plan/apply interface for repository maintenance.

## User Pain Points

- "My code works, but the GitHub repo looks unfinished."
- Repository setup knowledge is scattered across GitHub settings, files, Actions, security features, and community standards.
- High-risk settings such as branch rules or required checks are easy to misconfigure.
- Manual cleanup is repetitive and easy to forget after each push.
- Automated tools often mutate directly without a readable plan.
- Many templates are generic and do not match the detected project stack.
- CI failures after adding workflows need follow-up diagnosis.

## Non-Goals

- gh-polish is not a full code quality refactoring agent.
- gh-polish is not a replacement for GitHub CLI.
- gh-polish is not a hosted GitHub App in the MVP.
- gh-polish is not a security scanner that guarantees vulnerability detection.
- gh-polish is not a package publishing or release management platform.
- gh-polish does not make irreversible GitHub settings changes without dry-run and user confirmation.
- gh-polish does not commit directly to the default branch by default.

## MVP Scope

The MVP is CLI-first and focuses on the safest repository polish loop:

- Inspect local repository files and remote GitHub repository state.
- Detect common project stack signals for Node, Python, Go, Rust, and generic repos.
- Check repository metadata: description, homepage, topics, license, README presence, common badges.
- Check hygiene files: `.gitignore`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue templates, pull request template.
- Check engineering setup: GitHub Actions workflow presence, basic test/lint/build command detection, Dependabot config, CodeQL workflow presence.
- Generate a structured plan with risk levels, dry-run output, and user confirmation requirements.
- Apply file-based changes on a new branch and open a pull request by default.
- Apply low-risk GitHub API metadata updates only after explicit user confirmation.
- Monitor pull request checks and summarize pass/fail status with recommended next actions.

## v1 Scope

- Richer stack-specific templates for README sections, CI workflows, and `.gitignore`.
- Label normalization with preview and reversible plan.
- Branch ruleset inspection and recommendation, with guarded apply support.
- GitHub Pages detection and setup recommendations.
- Release workflow templates for common ecosystems.
- Better failure diagnosis for GitHub Actions logs.
- Config file for persistent policy preferences and template choices.

## v2 Scope

- Optional GitHub App mode for teams that prefer managed installation and organization policies.
- Multi-repository batch polish reports.
- Organization-level template registry.
- Pull request comment mode for plan review.
- More advanced repository scorecards and trend tracking.
- Optional scheduled monitor mode.

## Future Scope

- Hosted dashboard.
- Marketplace integrations.
- Security advisory workflow assistance.
- Advanced dependency health insights.
- Agent-to-agent handoff for fixing CI failures.
- Repository migration polish for imported projects.

## Core User Flow

1. User pushes code to GitHub.
2. User runs `gh-polish inspect` or `gh-polish plan`.
3. CLI reads local project files and GitHub repository state using `gh auth token` or `GITHUB_TOKEN`.
4. Analyzer detects stack, missing repository assets, and GitHub capability state.
5. Planner generates a plan with proposed file changes, GitHub API changes, risk labels, verification steps, and confirmation requirements.
6. User reviews the dry-run plan.
7. User runs `gh-polish apply --plan <plan-id>` and confirms high-risk operations.
8. Applier creates a branch, writes file patches, applies approved GitHub API updates, pushes the branch, and opens a pull request.
9. Monitor checks GitHub Actions, pull request checks, and relevant alerts.
10. CLI reports success, failure, and suggested follow-up tasks.

## Feature List

### Inspect

- Detect repository owner/name/default branch.
- Detect local stack from files and package manifests.
- Read GitHub repository metadata.
- Read topics, license, Pages status, Actions status, labels, milestones, releases, branch rulesets, and security feature availability where permissions allow.
- Detect missing or weak repository hygiene files.

### Plan

- Produce a structured JSON plan and human-readable summary.
- Classify each proposed change as file change, API change, or manual recommendation.
- Assign risk level: low, medium, high.
- Mark whether each change requires confirmation.
- Include verification steps and expected evidence.

### Apply

- Create a branch by default.
- Apply template files or patches locally.
- Commit and push changes.
- Open a pull request.
- Apply confirmed metadata or settings through the GitHub API.
- Refuse real mutation unless the user explicitly runs apply.

### Monitor

- Poll pull request checks and workflow runs.
- Summarize failures with job names and links.
- Recommend next tasks without silently rewriting workflows unless requested.

## GitHub Permission Requirements

The MVP should work with a classic token, fine-grained token, GitHub CLI auth token, or `GITHUB_TOKEN` when available. Exact permission names depend on token type, but the product should request the least privileges needed for selected operations.

- Read repository metadata: repository read access.
- Update repository metadata: administration or repository metadata write capability where GitHub requires it.
- Read and write repository contents: contents read/write.
- Create branches and pull requests: contents write and pull requests write.
- Read Actions status: actions read and checks read.
- Write workflow files: contents write; GitHub may require workflow permission for OAuth apps or fine-grained tokens.
- Read and modify labels/milestones: issues read/write.
- Read branch rulesets: administration read.
- Modify branch rulesets: administration write; high-risk and not automatic in MVP.
- Read security features: security events or administration read where available.
- Enable security features: administration/security permissions; high-risk and confirmation-gated.

## Risks and Boundaries

- GitHub settings can be high impact. Branch protection, rulesets, Actions permissions, Pages, and security settings must be dry-run first and require explicit confirmation.
- Token permissions vary by organization, token type, and GitHub plan. The CLI must degrade gracefully and report missing permissions.
- Generated templates can be wrong for unusual stacks. The planner must explain detected assumptions.
- CI workflows can fail because the project does not have stable test/build commands. The plan must prefer detected commands and avoid inventing brittle scripts.
- Public repository polish should not leak secrets, local paths, private service names, or hidden environment data.
- gh-polish should not silently overwrite existing project-specific docs or workflows. Existing files must be patched conservatively or flagged for manual review.

## Success Metrics

- A new user can run `plan` on an existing repository and understand proposed changes within 5 minutes.
- At least 80% of MVP plans produce only branch/PR changes unless the user explicitly confirms API mutations.
- At least 90% of generated plans include concrete verification evidence.
- For supported stacks, the generated CI workflow uses detected commands or clearly marks unknown commands.
- The CLI never performs real GitHub mutation during `inspect` or `plan`.
- The CLI refuses real GitHub mutation in automated tests unless an explicit environment flag is set.
- User can complete a first polish PR with README, templates, and basic CI in under 15 minutes.
