---
'@nocobase/agent-runner': patch
---

Initialize a repository's submodules while preparing its worktree, before the agent starts and outside the coding tool's sandbox, and fail the preparation with a clear error when they cannot be fetched. A new worktree initializes every submodule recursively; a resumed one only those not initialized yet. Submodules are fetched with the repository's credential, sent only to the repository's own host. Codex's sandbox now also lets the agent write the run's other working directories and each worktree's own Git directory (`<cache>/worktrees/<name>`), never the shared repository cache.
