---
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-runner': patch
---

A runner conversation's responses now carry the agent's tool calls and their results as SDK `dynamic-tool` parts, live while the run streams (`tool-input-available`, then `tool-output-available` or `tool-output-error`) and in history replay, ordered among the response's reasoning and texts by the run's events. Inputs and outputs are bounded in the message; the run's transcript keeps them whole. The runner sends a conversation's tool steps as soon as they happen rather than at its next event interval.
