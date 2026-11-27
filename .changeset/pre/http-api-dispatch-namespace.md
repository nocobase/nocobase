---
'@nocobase/app-skills': patch
---

The HTTP API specification in the app development Skill now has a dispatch namespace rule: a plugin that hosts other packages' routes through a dispatcher may own one extra namespace, such as multi-portal's `/api/portals/{portalKey}/...`, with how their `operationId`, error `domain` and `addApiRouter` registration work.
