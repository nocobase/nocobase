---
"@nocobase/realtime": minor
"@nocobase/app-client": minor
"@nocobase/app-plugin-agent-sessions": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/app-plugin-projects": patch
"@nocobase/app-plugin-notification-in-app": patch
---

Retry transient subscription failures independently with bounded exponential backoff and jitter. Preserve permanent authorization refusals and correlation checks, cancel retries on disposal, and probe healthy foreground connections instead of rebuilding them.

Retain stale snapshot state after failed reads and retry transient refresh failures without another realtime event. Expose refresh status, last successful synchronization, manual retry and separate subscription error callbacks. Clear previously authorized query data after an HTTP 401 or 403. Reuse the scheduler for Agent Sessions and subject run discovery while preserving slow reads and stream coalescing.
