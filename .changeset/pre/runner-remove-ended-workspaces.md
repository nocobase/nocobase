---
'@nocobase/agent-runner': patch
'@nocobase/agent-protocol': patch
---

Once the application says a task's work is over, routine collection removes its working directories and Codex session directories whatever they hold — untracked files, uncommitted changes, unpushed commits, recovery worktrees and local continuation refs — without `--force` and without waiting for disk pressure. Only a run holding a directory's lock, or using it since it was reported, keeps it. Directories whose work goes on, or whose status is unknown, keep their unpushed-work protection.
