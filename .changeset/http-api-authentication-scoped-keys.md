---
'@nocobase/app-plugin-authentication': minor
---

`auth.required()` refuses a scoped credential in the standard error body — 403 `PERMISSION_DENIED`, reason `SCOPED_KEY_FORBIDDEN`, domain `authentication` — instead of `{ code, message }`.
