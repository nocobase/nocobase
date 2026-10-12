---
"@nocobase/agent-runner": minor
---

Report the models each coding tool can use (Claude Agent SDK `supportedModels()`, Codex app-server `model/list`, OpenCode `GET /api/model`, Pi `--list-models`, else a built-in list), overridable with `nocobase-runner config models <tool> add|remove|reset|show`. A directory lock held while a run prepares its working directories now requeues the run as workspace-busy without using an attempt. A claim's `workspace.key` names the run's working directory, and a `workspace.readOnly` run works in a read-only worktree of its own (`<dir>.readonly-<agentId>`) on the same branches, alongside the run that writes, and never pushes.
