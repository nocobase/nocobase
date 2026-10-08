---
'@nocobase/app-plugin-authorization': patch
---

`GET /api/authz/permission-sets` and `GET /api/authz/permission-sets/effective/:type/:id` leave out Permission Sets whose protection is `hidden`.
