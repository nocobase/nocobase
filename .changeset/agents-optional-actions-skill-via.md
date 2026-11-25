---
'@nocobase/app-plugin-agents': minor
---

Let an application offer optional business actions (`AgentDefaults.optionalActions`) that are off for every agent until a manager of agents turns them on for one, kept per agent when the defaults are applied again and shown as switches on the agent's Business actions tab. A run writes skills only with `agents.skills` manage, and each skill version an agent's run writes records the agent and the run beside its author (`viaAgentId`, `viaRunId`), shown as "person via agent" in the version history.
