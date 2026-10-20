---
'@nocobase/agent-protocol': patch
'@nocobase/agent-runner': minor
'@nocobase/app-plugin-agents': patch
---

Reuse a fixed task worktree across runs and tools, preserve dependencies and sessions, isolate per-run files and cancellation, and protect cleanup with nonexclusive usage records covering worker startup. Reclaim sessions only with their owning directory. Leave commits and pushes to agents, refresh initialization after lockfile changes or artifact cleanup, and default idle artifact retention to 24 hours. Prefer an immediately available previous runner under the same ordered-model admission rules, aggregate affinity location and occupancy reads, and reserve actual upgrade interruptions for that runner for five minutes.

Separate ordered-model claim eligibility from full waiting diagnostics, evaluate affinity in queue order, and reuse batched resource metadata without repeating capacity reads for every candidate and machine.

Serialize cache fetch and worktree creation through a short cache mutex, retry transient Git lock conflicts, fall back to a detached remote branch when another directory owns it, and avoid optional index locks and per-remote-branch reporting commands. Report disk pauses as unavailable capacity while continuing claims during periodic workspace collection.
