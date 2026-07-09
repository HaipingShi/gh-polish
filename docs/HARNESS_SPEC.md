# Harness Specification

The verification harness exists to protect the core trust promise: `inspect` and `plan` must never mutate GitHub or local project files, and `apply` must only mutate through an approved plan.

## Global Checks

The implementation stack is Node.js + TypeScript with Node's built-in test runner. The global checks are:

```bash
npm run typecheck
npm test
npm run build
npm run ci
```

When CodeRail reference scripts are available, also run:

```bash
python %TEMP%\coderail-ref\scripts\doctor.py --target .
```

## CodeRail Gates

- Coordinate Gate: every non-trivial task has Rail plus G/T/S/V/X/P in `docs/TASKS.md`.
- Blueprint Gate: architecture, data flow, sequence, state, deployment, and CI/CD diagrams are current or explicitly planned/not-applicable in `docs/BLUEPRINTS.md`.
- TDD Gate: required for bugs, regressions, parsers, validators, domain logic, APIs, shared utilities, and risky refactors; waived for design-only Light Rail tasks with a reason.
- Done Gate: no task is marked done without V evidence or explicit manual acceptance.
- Trace Graph: meaningful actions append source, task, modified assets, validation, and persistence evidence to `docs/TRACELOG.jsonl` and refresh `docs/TRACE_INDEX.md`.
- Closeout Gate: substantial stops record task result, auto-commit action, handoff trigger check, resume anchor, and one next executable step.

## Test Layers

### Unit Tests

- Analyzer tests for local project fixtures.
- Policy tests for every operation class and GitHub capability.
- Planner tests for deterministic plan generation.
- Template registry tests for stack selection and overwrite safety.
- Adapter mapping tests for normal and degraded GitHub responses.

Expected gate: all unit tests pass on every pull request.

### Integration Tests with Mocked GitHub API

- Use mocked REST/GraphQL responses for repository metadata, topics, labels, milestones, Actions, checks, branch rulesets, Pages, releases, and security feature status.
- Cover token missing, permission denied, rate limit, not found, and partial response scenarios.
- Verify no direct network mutation endpoint is called unless the test explicitly opts into mutation mode.

Expected gate: integration suite passes without real GitHub credentials.

### CLI Smoke Tests

- `gh-polish --help`
- `gh-polish inspect --dry-run`
- `gh-polish plan --dry-run`
- `gh-polish apply --plan <fixture> --dry-run`
- `gh-polish monitor --dry-run`

Smoke tests should run in temporary fixture repositories and must not require a real GitHub repository.

Current T-001 smoke equivalent:

```bash
node dist/src/cli.js --help
node dist/src/cli.js inspect --dry-run
node dist/src/cli.js apply --plan fixture
```

Current T-002 repository context checks:

```bash
npm test
```

The repository context suite covers HTTPS remotes, SSH remotes, outside-git errors, injected git output, dirty state, default branch fallback, and a temporary git repository smoke test.

Current T-003 GitHub adapter checks:

```bash
npm test
```

The GitHub adapter suite uses mocked fetch only. It covers environment token resolution, repository metadata, topics, Actions workflows/runs, labels, milestones, forbidden/not-found/rate-limit degraded states, invalid responses, network failures, and absence of mutation methods.

Current roadmap coverage:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run ci
```

The full suite covers CLI safety, local git context, GitHub read adapter, local analyzer, remote analyzer, policy classification, dry-run planner, template overwrite protection, guarded apply/metadata flow, monitor summaries, and harness mutation checks.

### Dry-Run Snapshot Tests

- Fixture repositories for Node, Python, Go, Rust, and generic projects.
- Snapshot the human-readable summary and machine-readable plan JSON.
- Snapshots must include risk levels, confirmation flags, verification steps, and evidence fields.
- Any snapshot update must be reviewed as a product behavior change.

### No Real GitHub Mutation Gate

Real GitHub mutation is forbidden unless an explicit environment flag is set.

Required behavior:

- Default test mode blocks write endpoints.
- `inspect` and `plan` never call write endpoints, even when mutation flag is set.
- `apply` may call write endpoints only when all are true:
  - A saved plan is provided.
  - The operation is approved by policy.
  - Required confirmations are present.
  - `GH_POLISH_ALLOW_REAL_GITHUB_MUTATION=1` is set.
  - The target repository matches an allowed test repository pattern when running in CI.

Write endpoints include repository metadata updates, topic updates, content writes, branch creation, pull request creation, label/milestone writes, ruleset writes, Pages changes, security feature toggles, release creation, and workflow-affecting file writes.

### Lint, Typecheck, and Build Gates

The current gates are:

- Linter equivalent: `npm run lint` currently aliases strict TypeScript checking.
- Typecheck: `npm run typecheck`.
- Build/package command: `npm run build`.
- Test command: `npm test`.
- CI aggregate: `npm run ci`.

Formatter and coverage gates are deferred until code volume justifies them. They must be revisited before a release or published binary.

## Fixture Strategy

Fixtures should model real but small repositories:

- Empty generic repo.
- Node package with scripts.
- Python package with pytest.
- Go module.
- Rust crate.
- Repo with existing customized docs.
- Repo with existing workflows and partial GitHub metadata.

Fixtures must not contain real secrets, private repository names, or user-specific paths.

## Evidence Requirements

Every successful gate should produce evidence:

- Unit and integration test logs.
- CLI smoke output.
- Dry-run plan snapshots.
- Mutation guard logs.
- Lint/typecheck/build outputs.
- CI workflow link when running in GitHub Actions.

## Exit Criteria for MVP Harness

- All gates can run locally.
- All gates can run in CI.
- Mocked GitHub integration tests do not need credentials.
- Real GitHub mutation cannot happen by accident.
- Plan snapshots make product behavior reviewable.
