---
'@nocobase/app-plugin-agents': patch
---

Add `GET /api/agents/runAgents`, which lists the agents with a run on one subject (removed and archived ones included, within the caller's run visibility), so a run history's agent filter offers only those agents.
