---
'@nocobase/app-skills': minor
'@nocobase/create-plugin': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

Document the HTTP API design every `/api` route follows. The `nocobase-app-development` Skill gains `references/http-api.md`: camelCase paths under a plugin's namespace, standard and custom methods, `{ data }` and `{ data, meta }` responses with `pageSize`/`pageToken` or `page`/`pageSize` paging, `ApiError` and the standard error body, and input validated with zod through `parseApiInput()` after the permission check, with an optional `bodyLimit` on a route whose body needs one. It also fixes when a custom method answers `200`, `202` or `204`, which lists may skip paging, that a `GET` never changes state, that a plugin has one error `domain`, and that streaming routes answer errors detectable before the stream opens with the standard body. Its route, frontend API, testing, i18n and organization references, and the frontend projects example, now throw `ApiError`, branch on `error.reason`, and use `q`, `orderBy`, `page`/`pageSize` and string ids. Generated plugins and applications point to it from `AGENTS.md`.
