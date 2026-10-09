---
'@nocobase/app-plugin-agents': minor
---

Answer conversations with an online agent when a runner agent cannot run for the person. The team's chat settings gain `onlineFallbackAgentId`, an online agent set on the agents page or with `conversation settings update --online-fallback-agent`. A conversation started with a runner agent that no runner may run for its owner now, such as one whose only online runner is someone else's personal runner, starts on that online agent as if switched, and the owner may switch back; `chatAgents` reports it per agent as `fallbackAgentId`. `POST …/fallback` may now switch a runner conversation to the online fallback agent, and a conversation's `mode` follows the agent it answers with. With no online fallback agent set, nothing changes.

The configured online fallback is available for automatic and manual switching only while an enabled model service offers its default answering model. If that model becomes unavailable, new conversations retain the original runner agent and record a system notice explaining why the online fallback cannot answer.

Consumer behavior changes: a conversation's `mode` now follows its current agent when switching or restoring, rather than remaining fixed for its lifetime. Switching between runner and online agents clears the selected model. Clients should read the returned conversation's `mode` after each switch.
