---
'@nocobase/agent-runner': minor
'@nocobase/app-plugin-agents': patch
---

Reuse a fixed task worktree across runs and tools, preserve dependencies and sessions, isolate per-run files and cancellation, and protect cleanup with nonexclusive usage records. Leave commits and pushes to agents, refresh initialization after lockfile changes or artifact cleanup, and default idle artifact retention to 24 hours. Prefer an immediately available previous runner and reserve actual upgrade interruptions for that runner for five minutes.
