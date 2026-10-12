---
'@nocobase/studio': minor
---

Separate required and reference checks on pull requests. A repository's settings name its reference checks: their failures are shown but neither wake the agent nor block merging from Studio. Failed required checks wake the agent once every required check of the head has finished, and the input carries each failed check's annotations and log excerpt, or the external CI's link when GitHub has no log. `nb-studio pr checks <issue> <pr>` reads the same explanation on demand, also from a run. A project manager can merge past failed required checks with a reason (`pr merge --force --reason`): Studio comments the reason and the failed checks on the pull request first and records the outcome in the issue's activity, while GitHub's branch protection still applies. Adds the migration `202610240010_studio_repo_reference_checks`.

Required checks that are still queued or running block both ordinary and forced merges even when another required check failed. Passing-check signals use the required-check summary, so reference failures do not suppress them.

Both the issue page and inbox open the latest merge preflight when their stored checks have failed, allowing authorized users to reach force confirmation while ordinary merging remains blocked.
