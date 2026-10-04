---
'@nocobase/app-skills': minor
'@nocobase/create-plugin': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

Document the HTTP API design every `/api` route follows. The `nocobase-app-development` Skill gains `references/http-api.md`: camelCase paths under a plugin's namespace, standard and custom methods, `{ data }` and `{ data, meta }` responses with `pageSize`/`pageToken` or `page`/`pageSize` paging, `ApiError` and the standard error body, and input validated with zod through `parseApiInput()`. Its route, frontend API and organization references now throw `ApiError` and branch on `error.reason`. Generated plugins and applications point to it from `AGENTS.md`.
