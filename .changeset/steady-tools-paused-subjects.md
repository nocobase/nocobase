---
"@nocobase/app-plugin-agents": minor
"@nocobase/studio": patch
---

Pin queued work and execution requests to a chosen agent tool while preserving fallback for unpinned work and follow-up input. Add queued tool changes with same-actor merging, current-user tool availability, and subject pause/resume controls with events and queue-expiry protection. Preserve the actual execution tool separately from the requested tool through the `202610110002_ag_add_work_controls` migration. Include cancellation wording and run-view schemas in Studio while retaining its stage execution counting rules.
