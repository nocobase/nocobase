---
'@nocobase/app-plugin-authorization': minor
---

`/api/authz` accepts scoped API keys (`auth.required({ scopedKeys: true })`): the permissions snapshot and every registered check run through `authz`, which narrows them to the key's scope. The README explains scoped credentials and why code that derives permissions from `permissionSets.getEffective` must intersect with `identity.keyScope`.
