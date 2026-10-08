---
'@nocobase/app-plugin-agents': minor
---

Answer conversations with an online agent when a runner agent cannot run for the person. The team's chat settings gain `onlineFallbackAgentId`, an online agent set on the agents page or with `conversation settings update --online-fallback-agent`. A conversation started with a runner agent that no runner may run for its owner now, such as one whose only online runner is someone else's personal runner, starts on that online agent as if switched, and the owner may switch back; `chatAgents` reports it per agent as `fallbackAgentId`. `POST …/fallback` may now switch a runner conversation to the online fallback agent, and a conversation's `mode` follows the agent it answers with. With no online fallback agent set, nothing changes.

Only switch to the configured online fallback when its default answering model is currently offered by an enabled model service. When it cannot answer, keep the original runner agent and record a system notice explaining why fallback was unavailable; do not advertise it as the automatic fallback or offer manual switching to it.
