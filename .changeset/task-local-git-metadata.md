---
'@nocobase/agent-runner': patch
---

Prepare new task repositories as reference clones with their own Git metadata inside the working directory, so sandboxed coding tools can commit, rebase and update submodules without write access to shared repository caches. Retain existing worktrees and protect borrowed cache objects from automatic pruning.

Keep push permissions in the runner's protected registry outside checkouts and ignore checkout-local permission files. Enforce protected hooks and checked configuration for every host-side Git operation in a task checkout, using trusted repository URLs for remote queries and automatic pushes. Reject unsafe configuration and redirected submodule metadata without discarding pending work. Remove stale local branches imported from the bare cache when preparing a new task clone.
