---
"@nocobase/app-plugin-agents": minor
---

Native online conversations can limit how many earlier turns the model reads with `OnlineAgentConfigurator.setHistoryTurns()`, keeping each turn's tool calls and results together, and every answer records the tokens its model calls used in `metadata.usage`, summed with `conversationUsage()`.
