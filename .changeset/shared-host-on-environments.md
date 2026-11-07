---
'@nocobase/app-plugin-releases': minor
'@nocobase/app-host': patch
---

Show each shared app host once on the environments page as a capacity card — apps running against its limit, heap and process memory, restart state — linking to its running apps in the apps list (`GET /api/releases/hosts`, which needs the `rel.environments` `read` setting). The apps list shows each app's runtime state, with why on hover or a tap, and filters by environment and runtime state (`environmentId` and `runtimeState`, repeatable, applied before paging). An app's page says in one line why the host affects it — waiting for a slot or memory, not restored after the host restarted (`runtime.unrestored`), or the host restarting — instead of repeating the whole host. The App Host reports its `maxActiveApps` limit in its status counters.
