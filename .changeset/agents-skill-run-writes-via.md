---
'@nocobase/app-plugin-agents': minor
---

An agent's run writes skills (save, restore, import, upload) only with `agents.skills` manage and is refused 403 before the skill is looked up, and each skill version an agent's run writes keeps the agent and the run beside its author for audit (`agSkillVersions.viaAgentId`, `viaRunId`), not exposed by the API.
