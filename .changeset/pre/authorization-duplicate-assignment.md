---
"@nocobase/app-plugin-authorization": patch
---

Answer 409 `PERMISSION_SET_CONFLICT` instead of 500 when a Permission Set is assigned to a subject that already holds it, including concurrent requests.
