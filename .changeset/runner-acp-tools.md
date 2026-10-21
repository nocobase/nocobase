---
"@nocobase/acp-bridge": minor
"@nocobase/agent-protocol": minor
"@nocobase/agent-runner": minor
"@nocobase/app-plugin-agents": minor
---

Support server-selected runner tools with shared ACP catalog adapters, explicit tool migration, cached detection, model discovery, session recovery and runtime configuration. Native adapters retain precedence. Upgrade the server before protocol-13 runners; new runtimes default to Codex and Claude Code. Tools without model listing use their default model, while unavailable explicit models fail before sending a task.
