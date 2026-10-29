---
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-runner': minor
---

Runners report how full the context window is after a turn, as a `status` event `context` with `{ used, size }`: Claude Code from the turn's per-model context window and the main thread's latest request, Codex from `thread/tokenUsage/updated` when it names the model's window, and ACP agents from their `usage_update`. OpenCode and Pi report none. A runner conversation's response ends with a `data-turn` part once its run has ended (how long the turn took, its input, cached and output tokens, and whether it completed, failed or was cancelled), and `GET /api/agents/conversations/{conversationId}/usage` (`conversation usage`) sums the tokens of a conversation's runs and returns its latest context window.
