---
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-plugin-database-explorer': patch
---

Declare every hand-written `/api` route of the file, notification, in-app notification, scheduler and Database Explorer plugins in the application's API document at `/api/swagger/docs`, with response schemas and the error statuses each route answers. The file plugin documents the `uploadOne` and `uploadMany` endpoints of each exposure as `multipart/form-data` beside that exposure's data endpoints, under its tag and with operationIds such as `attachmentsUploadOne`. Each file exposure declares the `contentUrl` it adds to every record as a computed field, so the record schema of its data endpoints lists it, read-only, beside the Collection's fields. Route input is now validated through `apiValidator()`, which answers invalid input exactly as before. A route lists `403` only where it checks a permission, so the in-app inbox routes list `401` and `500`; the `400` for invalid input comes from the input validators, and a route that can answer `400` for another reason, such as an invalid page token or cursor or an unavailable test target, declares it with its reasons.
