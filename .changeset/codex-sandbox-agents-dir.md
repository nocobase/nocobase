---
'@nocobase/agent-runner': patch
'@nocobase/app-cli': patch
---

Let a Codex run write the `.agents` directory of each of its working trees. Codex's `workspaceWrite` sandbox keeps `.agents` read-only inside every writable root as its own skills root, so an application's `pnpm install` failed with `SKILLS_SYNC_FAILED` when its `skills sync` wrote `.agents/skills`. The runner now creates `.agents` in every working directory and every checked-out submodule before Codex starts, and opens each as a writable root; `~/.agents` and anything outside the run's working directories stay closed.

Resolve each `.agents` directory to its real target before opening it, rejecting links outside the run's working directories and non-directory paths without replacing them. Use checked-out submodules' complete paths, including spaces and recursively nested submodules.

`nocobase skills sync` no longer rewrites a skill whose synchronized copy already matches its source byte for byte, nor a `.claude/skills` link that already points at it, nor an unchanged `.agents/.skills-sync.json`. A sync with nothing new writes nothing.
