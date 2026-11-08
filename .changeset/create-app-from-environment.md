---
'@nocobase/app-plugin-releases': minor
---

Apps are listed and created on their environment's page; there is no separate apps list or menu entry, and the apps path alone (`/releases` by default) leads to the environments. An environment's apps show each app's runtime state (why on hover or a tap) and filter by it, kept in the address (`?runtimeState=`). Create App opens there (`<environments>/:environmentId/apps/new`, for those with `rel.apps/create`) with the environment fixed; the old `<apps>/new` address leads to the environment its `?environmentId=` names, or to the environments (`ReleasesNewAppRedirect`), and Create App no longer fails when the page under it hands no outlet context. A shared host's capacity card splits its running apps by environment (`environments[].running` in `GET /api/releases/hosts`), each linking to that environment filtered to its running and starting apps. `ReleasesAppsPage` is removed.
