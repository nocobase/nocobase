---
"@nocobase/realtime": minor
"@nocobase/app-skills": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-plugin-realtime-example": patch
---

Ship a dedicated versioned Realtime integration Skill and references for authorization, snapshot recovery, distributed delivery, polling decisions and business verification. Include it in both application templates' direct dependencies so Skills synchronization discovers it, and document optional Redis configuration in both templates.

Use one refresh scheduler for the Realtime business examples' initial, manual and event reads. Retry transient snapshot failures without another event, preserve trailing reads and provide low-frequency reconciliation. Forward capability-lab read failures to the shared retry policy.
