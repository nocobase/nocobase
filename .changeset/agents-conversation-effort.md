---
"@nocobase/app-plugin-agents": minor
"@nocobase/app-template-examples": patch
---

A Runner conversation can choose the reasoning effort of its runs. `POST /api/agents/conversations` and `POST /api/agents/conversations/:id/messages` take an optional `effort`, one of the agent's tool's efforts (400 `EFFORT_UNSUPPORTED` otherwise, and always for the online agent, whose models declare none); the conversation keeps the last one chosen as its `effort`, and its runs use it at claim time in place of the agent's configured effort. Issue and task runs keep the agent's effort, and a request without `effort` behaves as before. `GET /api/agents/chatAgents` lists each agent's `efforts` and `effort`, and `useSendMessage` takes `effort`.

The Examples template's installed agent chat shows the reasoning-effort choice in a Runner conversation's composer, `medium` by default, no longer tags a conversation in the history with where it started, and drops "Open full screen" from a row's menu. An application generated earlier keeps its installed copy; reinstall the `agent-chat` item or merge these files to follow.
