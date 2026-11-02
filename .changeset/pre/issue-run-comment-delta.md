---
"@nocobase/app-plugin-agents": minor
"@nocobase/app-plugin-projects": minor
---

Tell each issue run what was said since the agent's last run. A subject's assembly may add a note to the turn of a resumed session (`turn.resumed`) or of a fresh one (`turn.fresh`), chosen once the claim knows which it is. The comment threads list (`GET /api/projects/issues/{issueId}/comments`, `issue comment list`) takes `since` to return only what was written after it. Studio uses both: a resumed run hears that no comment arrived, the few new comments, or how many and the `--since` command that reads them; a fresh session or a first run is told to read the issue's comments before acting.
