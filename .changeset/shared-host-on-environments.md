---
'@nocobase/app-plugin-releases': minor
---

Show the shared app host on the environments page instead of on every App's page. The environments page lists each host its environments share once, with its memory, running count, occupants and restart state (`GET /api/releases/hosts`, which needs the `rel.environments` `read` setting and hides the Apps the reader may not view). An App's page now says in one line why the host affects it — it waits for a slot or memory, failed to start, or the host is restarting — with a link to the host's block for those who may read environments.
