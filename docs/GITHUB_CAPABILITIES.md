# GitHub Capabilities Matrix

The matrix defines MVP behavior for GitHub features. "Confirmation" means explicit user approval beyond merely running `plan`. All real mutation also requires running `apply`.

| Capability | MVP Support | Mutation Type | Required Permissions | Requires User Confirmation | Verification |
| --- | --- | --- | --- | --- | --- |
| Repository metadata | Read and recommend; optionally update description/homepage | GitHub API | Metadata read; administration or repository metadata write for updates | Yes for updates | Fetch repository and compare description/homepage to plan |
| Topics | Read and recommend; optionally replace/add topics | GitHub API | Metadata read/write or repository administration depending on token type | Yes | Fetch topics and compare sorted set to plan |
| License | Detect missing/known license; add file through PR if selected | File change | Contents read/write for apply | Yes when adding a license | Confirm `LICENSE` exists in PR diff and GitHub license API identifies it |
| README | Detect missing/weak README; create or patch through PR | File change | Contents read/write for apply | Yes if replacing existing content; no extra confirmation for additive patch in PR | Check `README.md` exists, generated sections present, and PR diff matches plan |
| Issue templates | Detect missing templates; add GitHub issue forms or Markdown templates | File change | Contents read/write for apply | No extra confirmation for new files in PR; yes before overwriting | Check `.github/ISSUE_TEMPLATE/*` exists in PR diff |
| PR template | Detect missing template; add `.github/pull_request_template.md` | File change | Contents read/write for apply | No extra confirmation for new file in PR; yes before overwriting | Check template exists in PR diff |
| Labels | Read and recommend normalized labels; limited apply in v1, not MVP | GitHub API | Issues read; issues write for mutation | Yes | Fetch labels and compare name/color/description |
| Milestones | Read only in MVP; recommend manual cleanup | GitHub API | Issues read | Not applicable for MVP read-only | Fetch milestones and include current state in report |
| Actions | Detect workflows and propose basic CI workflow | File change plus Actions/checks read | Contents read/write; workflows permission may be required for workflow files; actions/checks read for monitor | Yes for new workflow; high confirmation if replacing existing workflow | Check workflow file in PR diff; monitor workflow run/check status |
| Dependabot | Detect missing config; add `.github/dependabot.yml` through PR | File change | Contents read/write | Yes | Check file exists and syntax snapshot matches plan |
| CodeQL | Detect missing workflow; propose stack-specific workflow when supported | File change plus security/checks read where available | Contents read/write; workflows permission may be required; security read optional | Yes | Check workflow exists in PR diff; monitor CodeQL action result when run |
| Secret scanning | Read status when permitted; recommend enablement, no MVP mutation | GitHub API | Administration/security read; write to enable depending on repo/org | Yes for any future mutation | Fetch security feature status or report permission limitation |
| Branch rulesets | Read when permitted; recommend required checks; no MVP mutation | GitHub API | Administration read; administration write for future mutation | Always yes for mutation | Fetch rulesets/branch protection and compare to recommendation |
| Releases | Read latest releases; recommend release workflow; no MVP release creation | GitHub API and optional file change later | Contents read; metadata read; contents write for workflow | Yes for future workflow or release creation | Fetch releases and verify workflow file if added |
| GitHub Pages | Detect status when permitted; recommend setup, no MVP mutation | GitHub API | Pages read or administration read; administration write for mutation | Always yes for mutation | Fetch Pages status or report permission limitation |

## MVP Mutation Policy

- File changes are applied only through a branch and pull request by default.
- Metadata and topics updates may be supported only after dry-run and explicit confirmation.
- Branch rulesets, required checks, Pages, security toggles, Actions permissions, and direct release creation are recommendations only in MVP unless a future task explicitly expands support.
- Existing user files are never silently overwritten. The plan must choose add, patch, replace with confirmation, or manual review.
