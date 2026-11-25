---
'@nocobase/app-plugin-agents': minor
---

An agent's run writes skills (save, restore, import, upload) only with `agents.skills` manage and is refused 403 before the skill is looked up, and each skill version an agent's run writes records the agent and the run beside its author (`viaAgentId`, `viaRunId` on the version APIs).
