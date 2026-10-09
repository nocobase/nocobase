---
'@nocobase/agent-runner': patch
---

Prepare new task repositories as reference clones with their own Git metadata inside the working directory, so sandboxed coding tools can commit, rebase and update submodules without write access to shared repository caches. Retain existing worktrees and protect borrowed cache objects from automatic pruning.
