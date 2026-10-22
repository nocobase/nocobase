---
"@nocobase/acp-bridge": minor
"@nocobase/agent-protocol": minor
"@nocobase/agent-runner": minor
"@nocobase/app-plugin-agents": minor
---

Support server-selected runner tools with shared ACP catalog adapters, explicit tool migration, cached detection, model discovery, session recovery and runtime configuration. Native adapters retain precedence. Upgrade the server before protocol-13 runners; new runtimes default to Codex and Claude Code. Tools without model listing use their default model, while unavailable explicit models fail before sending a task.

A runner's report no longer creates an agent for every tool and model it lists signed in: only a combination the application recommends is still created automatically, already enabled. Every other reported combination joins an available models list instead, for an administrator to create an agent from (`POST /api/agents/runnerAgents`); leftover pending agents from the old behavior that were never enabled and never ran can be listed and removed outright (`GET`/`POST /api/agents/cleanupCandidates`, `/cleanup`). Detection reports why a tool's status is what it is (`ToolInfo.statusReason`/`statusDetail`, optional additions within protocol 13) and runs behind the run's own code-host credential guard, so a tool that depends on a login command the guard refuses fails detection the same way it would fail a run. A run failure keeps the tool's own words instead of a placeholder, consecutive small text chunks of one turn merge into about one event a second, and an agent's generated name no longer breaks an @ mention.
