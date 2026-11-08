---
'@nocobase/app-plugin-releases': minor
---

Create an app from its environment's page (`<environments>/:environmentId/apps/new`, for those with `rel.apps/create`), the environment fixed, instead of from the apps list, which now only lists apps. The old `<apps>/new` address leads to the environment its `?environmentId=` names, or to the environments (`ReleasesNewAppRedirect`). Create App no longer fails when the page under it hands no outlet context.
