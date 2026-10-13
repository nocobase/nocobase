---
'@nocobase/agent-runner': patch
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
---

Rebuild corrupted read-only checkouts and retry interrupted workspace cleanup without pruning neighboring worktree registrations. Preserve writable Git failures and report their task keys and bounded disk usage measurements in runtime diagnostics.
