---
'@nocobase/agent-runner': patch
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
---

Publish migrated Pi conversations atomically and preserve complete continued history. Persist and acknowledge cancellation recovery details even when the runner event spool is unavailable, retaining undelivered reports for retry. Retain orphan recovery records when owned server status is unknown or a terminal rejection does not acknowledge preservation.

Finish safe local saving and worktree removal before acknowledging normal cancellation, so an immediate server release cannot interrupt cleanup. Continue retaining directories when writer quiescence cannot be verified.
