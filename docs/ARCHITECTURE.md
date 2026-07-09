# Architecture

## Direction

gh-polish is CLI-first. The MVP runs locally, reads the current repository, authenticates through `gh auth token` or `GITHUB_TOKEN`, talks to GitHub through a dedicated adapter, creates a plan, applies approved changes through a branch and pull request, and monitors the resulting checks.

The architecture intentionally avoids a hosted service, database, queue, or Web UI until the local workflow proves useful.

## Primary Components

- CLI: command entrypoint, argument parsing, user prompts, human-readable output.
- Repository Context: local git state, remote URL, default branch, workspace paths.
- GitHub API Adapter: all GitHub REST/GraphQL/gh CLI calls behind one boundary.
- Analyzer: detects project stack, existing files, workflows, metadata, and GitHub capability state.
- Planner: converts findings into a structured plan with risk, scope, confirmation, and verification metadata.
- Policy: decides which operations are allowed, confirmation-gated, or refused.
- Template Registry: stores README, workflow, issue, PR, security, and contribution templates.
- Applier: executes approved file patches and GitHub API mutations.
- Monitor: reads Actions, checks, alerts, and pull request status after apply.
- Evidence Store: saves plans, dry-run snapshots, apply logs, and verification summaries.

## C4 Context Diagram

```mermaid
flowchart LR
    User["Builder\nVibe coder, solo builder, or small team maintainer"]
    GHPolish["gh-polish CLI\nAgent-driven repository polish workflow"]
    GitHub["GitHub\nRepositories, APIs, Actions, checks, security features"]
    LocalGit["Local Git\nWorking tree, branches, commits, remotes"]
    GHAuth["GitHub CLI/Auth\ngh auth token or GITHUB_TOKEN"]

    User -->|"runs inspect, plan, apply, monitor"| GHPolish
    GHPolish -->|"reads repo and creates branches/commits"| LocalGit
    GHPolish -->|"obtains token or auth context"| GHAuth
    GHPolish -->|"reads and mutates approved repository state"| GitHub
    GitHub -->|"shows pull requests, checks, and settings"| User
```

## Container Diagram

```mermaid
flowchart LR
    User["Builder"]
    CLI["CLI Commands"]
    Repo["Repository Context"]
    Analyzer["Analyzer Layer"]
    Planner["Planner Layer"]
    Policy["Policy Layer"]
    Templates["Template Registry"]
    Applier["Applier Layer"]
    Monitor["Monitor Layer"]
    Evidence["Evidence Store\n(.gh-polish or configured path)"]
    Adapter["GitHub API Adapter"]
    Git["Local Git"]
    GitHub["GitHub REST/GraphQL APIs"]

    User --> CLI
    CLI --> Repo
    CLI --> Analyzer
    Analyzer --> Repo
    Analyzer --> Adapter
    Analyzer --> Templates
    Analyzer --> Planner
    Planner --> Policy
    Planner --> Templates
    Planner --> Evidence
    CLI --> Applier
    Applier --> Policy
    Applier --> Templates
    Applier --> Git
    Applier --> Adapter
    Applier --> Evidence
    CLI --> Monitor
    Monitor --> Adapter
    Monitor --> Evidence
    Adapter --> GitHub
    Repo --> Git
```

## Core Workflow Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant CLI
    participant Repo as Repository Context
    participant Analyzer
    participant Adapter as GitHub API Adapter
    participant Planner
    participant Policy
    participant Applier
    participant Monitor
    participant GitHub

    User->>CLI: gh-polish plan
    CLI->>Repo: read local git and project files
    CLI->>Analyzer: analyze local and remote state
    Analyzer->>Adapter: fetch repo metadata and capabilities
    Adapter->>GitHub: REST/GraphQL requests
    GitHub-->>Adapter: current repo state
    Adapter-->>Analyzer: normalized state
    Analyzer->>Planner: findings
    Planner->>Policy: classify risk and confirmation needs
    Policy-->>Planner: allowed/gated/refused operations
    Planner-->>CLI: structured dry-run plan
    CLI-->>User: show plan and confirmations

    User->>CLI: gh-polish apply --plan <id>
    CLI->>Policy: validate confirmations
    Policy-->>CLI: approved operation set
    CLI->>Applier: execute approved plan
    Applier->>Repo: create branch and file patches
    Applier->>Adapter: apply approved API updates
    Adapter->>GitHub: create PR and update allowed settings
    GitHub-->>Adapter: PR/check references
    Applier-->>CLI: apply evidence

    CLI->>Monitor: monitor PR checks
    Monitor->>Adapter: read Actions/check status
    Adapter->>GitHub: status requests
    GitHub-->>Adapter: check results
    Monitor-->>CLI: verification summary
    CLI-->>User: success/failure and next actions
```

## Data Flow Diagram

```mermaid
flowchart TD
    A["Local repository files"] --> C["Analyzer"]
    B["GitHub repository state"] --> C
    T["Template registry"] --> C
    C --> F["Findings"]
    F --> P["Planner"]
    R["Policy rules"] --> P
    P --> D["Dry-run plan JSON"]
    P --> H["Human summary"]
    D --> E["Evidence store"]
    H --> U["User review"]
    U --> I["Confirmed plan"]
    I --> AP["Applier"]
    T --> AP
    AP --> L["Local branch, commits, file patches"]
    AP --> G["Approved GitHub API mutations"]
    L --> PR["Pull request"]
    G --> PR
    PR --> M["Monitor"]
    M --> V["Verification report"]
    V --> E
```

## GitHub Integration Boundary Diagram

```mermaid
flowchart LR
    subgraph Core["gh-polish core"]
        Analyzer["Analyzer"]
        Planner["Planner"]
        Policy["Policy"]
        Applier["Applier"]
        Monitor["Monitor"]
    end

    subgraph Boundary["GitHub API adapter boundary"]
        Adapter["GitHub API Adapter"]
        Auth["Auth Provider\ngh token or GITHUB_TOKEN"]
        Mapper["Response Mapper"]
        Retry["Rate Limit and Retry Handler"]
    end

    subgraph GitHub["GitHub"]
        RepoAPI["Repository API"]
        ContentsAPI["Contents/Git API"]
        PullsAPI["Pull Requests API"]
        ActionsAPI["Actions/Checks API"]
        IssuesAPI["Issues/Labels/Milestones API"]
        RulesAPI["Rulesets/Branch Protection API"]
        SecurityAPI["Security Features API"]
    end

    Analyzer --> Adapter
    Applier --> Adapter
    Monitor --> Adapter
    Adapter --> Auth
    Adapter --> Mapper
    Adapter --> Retry
    Adapter --> RepoAPI
    Adapter --> ContentsAPI
    Adapter --> PullsAPI
    Adapter --> ActionsAPI
    Adapter --> IssuesAPI
    Adapter --> RulesAPI
    Adapter --> SecurityAPI
    RulesAPI -.->|"high-risk: dry-run + confirm"| Policy
    SecurityAPI -.->|"high-risk: dry-run + confirm"| Policy
```

## Proposed Future Structure

This is illustrative only and should not be created until implementation starts.

```text
src/
  cli/
  repo/
  github/
  analyzer/
  planner/
  policy/
  applier/
  monitor/
  templates/
test/
  unit/
  integration/
  smoke/
```

## Key Boundaries

- Analyzer can read but must not mutate.
- Planner can propose but must not mutate.
- Policy is the only source of confirmation requirements.
- Applier must only execute an approved plan.
- GitHub API calls must go through the adapter.
- Monitor can read status and propose follow-up actions, but should not auto-fix failures in MVP.
