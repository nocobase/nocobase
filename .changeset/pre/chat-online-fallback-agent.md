---
'@nocobase/app-plugin-agents': minor
---

Answer conversations with an online agent when a runner agent cannot run for the person. The team's chat settings gain `onlineFallbackAgentId`, an online agent set on the agents page or with `conversation settings update --online-fallback-agent`. A conversation started with a runner agent that no runner may run for its owner now, such as one whose only online runner is someone else's personal runner, starts on that online agent as if switched, and the owner may switch back; `chatAgents` reports it per agent as `fallbackAgentId`. `POST …/fallback` may now switch a runner conversation to the online fallback agent, and a conversation's `mode` follows the agent it answers with. Without an online fallback agent set, runner conversations do not switch automatically.

Runner availability uses the same claim eligibility as execution, including required features and variables restricted to team runners. Existing runner conversations also switch on the next message when no eligible runner remains, transferring unanswered queued messages to the online agent. Manual switching skips an unavailable system default, and switching back is offered only when the original agent can answer again.

The configured online fallback is available for automatic and manual switching only while an enabled model service offers its default answering model. If that model becomes unavailable, new and existing conversations retain the original runner agent and record a system notice explaining why the online fallback cannot answer.

Repeated messages during the same fallback failure keep a single explanatory notice. A changed failure reason or a failure after availability recovers records a new notice.

Consumer behavior changes: a conversation's `mode` now follows its current agent when switching or restoring, rather than remaining fixed for its lifetime. Switching between runner and online agents clears the selected model. Clients should read the returned conversation's `mode` after each switch.
