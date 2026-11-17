---
'@nocobase/agent-protocol': minor
'@nocobase/agent-runner': minor
'@nocobase/app-plugin-agents': minor
---

Preserve quota-limited work on its original Runner and resume its original tool session after quota resets. Support strict session restoration without automatic fallback to a new session, and let an explicit replacement run take over preserved work exactly once (`replacesRunId`).
