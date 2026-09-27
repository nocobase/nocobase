---
'@nocobase/authorization': patch
'@nocobase/app-plugin-authorization': patch
---

A denied `require` now answers `403 { code: 'FORBIDDEN', message }` from any Hono route without an `onError` mapping: `AuthorizationDeniedError` carries `status: 403` and a `getResponse()` that Hono's default error handler honours. A record access that resolves to no records for a principal who holds the grant, such as a user in no department, now yields a conditional decision whose scope matches no rows, with the `EMPTY_RECORD_ACCESS` reason, so a bound Repository returns an empty result and updates or deletes nothing instead of refusing to run. A principal without a grant, or a grant whose data scopes configure no selection, is still denied.
