---
"@nocobase/agent-runner": patch
---

Retain worker cancellation recovery records and preserved worktrees until the server acknowledges their recovery details, even when event spool or cancellation metadata storage fails. Retry reports after restart without changing cancellation semantics or losing the original preservation reason.
