# Task Graph

The graph connects the completed prototype batch to the next executable foundation tasks and the planned product maturity stages.

```mermaid
flowchart TD
    T000["T-000 Product design"] --> T001["T-001 CLI skeleton"]
    T001 --> T002["T-002 Repository context"]
    T002 --> T003["T-003 GitHub read adapter"]
    T002 --> T004["T-004 Local analyzer"]
    T003 --> T00512["T-005-012 Prototype modules"]
    T004 --> T00512
    T00512 --> T013["T-013 Product direction refactor"]

    T013 --> T014["T-014 Agent-native read-only slice"]
    T014 --> T015["T-015 Trustworthy apply and evidence"]
    T015 --> T016["T-016 Plan-bound verification"]

    T016 --> P1["P1 Repository Ready"]
    P1 --> P2["P2 Launch Ready"]
    P2 --> P3["P3 Web Workspace"]
    P3 --> P4["P4 GitHub App Stewardship"]
    P4 --> P5["P5 Growth Loop"]
    P5 --> P6["P6 Portfolio and Team"]
```

## Current Critical Path

`T-013 -> T-014 -> T-015 -> T-016 -> P1`

Web UI, GitHub App, growth, and portfolio work remain planned product stages. They are not parallel implementation tracks until the preceding stage gate has evidence.
