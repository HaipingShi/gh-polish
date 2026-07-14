# Security Policy

## Supported Versions

gh-polish is in early development (pre-1.0). Only the latest commit on `main` receives security fixes.

## Threat Model Summary

gh-polish is an agent-driven workflow that mutates GitHub repositories. Its security model is fail-closed by design:

- `inspect` and `plan` are strictly read-only.
- Plans are bound to a base revision SHA and per-file content hashes, and expire.
- `apply`/`execute` refuses to run when the repository has drifted, the plan artifact was tampered with, or authorization requirements are not met.
- Live mutations require an explicit `--live` flag, an explicit repository allowlist, a repository id binding, and a review token derived from confirmed effect previews.
- Tokens are never serialized into plan artifacts or evidence, and are redacted from errors and process output.
- Created paths are restricted to a hardcoded allowlist; `.github/workflows/` is intentionally excluded from live mutation targets.

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, use [GitHub private vulnerability reporting](https://github.com/HaipingShi/gh-polish/security/advisories/new) to submit a report.

Include when possible:

- A description of the vulnerability and its impact
- Steps to reproduce (proof of concept)
- Affected commit or version

You can expect an acknowledgement within 7 days. Once a fix is available, we will coordinate disclosure with you.

## Scope

In scope:

- Bypasses of the mutation guard, authorization gate, or path allowlist
- Plan artifact tampering that is not detected
- Token leakage into artifacts, evidence, logs, or error messages
- Supply-chain issues in the build or release pipeline

Out of scope:

- Vulnerabilities in GitHub itself
- Issues requiring a compromised local environment or a malicious token holder
