---
'@nocobase/agent-runner': minor
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/studio': patch
---

Use a private linked Git worktree per run and save local continuation after stopping its tools. Fast-forward the resume reference, retain divergent heads as separately listed saved references, and preserve the directory on cleanup failure. Keep Codex state outside disposable worktrees. Other tools start fresh when their code directory changes; legacy sessions and clones are not migrated. Distinguish private local branches from task push targets and retain older runner compatibility.
