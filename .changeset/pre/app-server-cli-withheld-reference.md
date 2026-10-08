---
'@nocobase/app-server': minor
---

The CLI manifest (format version 4) lists the business actions the caller holds (`identity.actions`) and the commands it is not offered with why (`withheld`: another identity's, or naming an action it lacks), so a CLI can explain a missing command. `GET /api/cli/llms.txt` answers the caller's commands as compact text for agents, and `CliService.describe({ bin, title, notes })` names the CLI there.
