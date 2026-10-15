---
'@nocobase/studio': minor
'@nocobase/app-plugin-agents': minor
'@nocobase/app-plugin-projects': minor
---

Require the issue owner to start or continue Studio project manager work, and ignore agent wakeups from comments on unstarted issues. Run the manager and its delegated steps as the current owner while preserving trigger audit information. Withdraw all queued agent work and request cancellation of held runs on owner transfers, without automatically restarting them. Correct legacy queued identities before claim and expose waiting reasons.

Expose the existing transactional `Projects.activity` recorder for application issue events and deliver owner transfers to all work kinds before ordinary triggers, including executor clearing. Restore Studio wording for models, efforts, the start dialog and historical sub-issue activity.

Preserve delegated execution identity throughout repeated retries, including handled inputs, and show the initiator of the current retry instead of copied retry history.
