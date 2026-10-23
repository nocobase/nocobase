---
"@nocobase/app-plugin-agents": minor
"@nocobase/app-skills": patch
---

The chat's headless entry tells a panel which kind of agent it shows: `resolveChatAgentMode`, `configuredChatModes`, `agentsOfMode` and `chatAgentMode` split the catalog into the online agent and runner agents, and `useChatPanel()` carries `agentMode` with `setAgentMode` for a panel that switches between them. `GET /api/agents/conversations` takes `mode=online|runner` to list one kind's conversations. `ChatProvider` takes `memoryScope` (the signed-in person's id) and remembers the agent a new conversation last went to in `localStorage` (`lastAgentId`, `rememberAgent`, `readLastAgent`, `rememberLastAgent`); `newConversationAgent` takes it as a third argument, ahead of the person's and the team's defaults. Every addition is optional, and a panel that passes none of it behaves as before.

The UI Library catalog in `nocobase-app-development` describes the updated `agent-chat` and `agent-composer` items: the panel's mode switch and the agent last used, and context chips that open a preview of what they carry.
