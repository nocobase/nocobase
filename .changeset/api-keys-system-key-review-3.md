---
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-api-keys': patch
---

`SystemApiKeys.adopt` refuses when a Permission Set already carries the account's reserved name (`SYSTEM_KEY_SET_TAKEN`), so an application's role and its members never receive the import, and answers a repeated import only for the same key and the same requested grants, in any order. Deleting a system key whose service account could not be removed finishes when it is deleted again. On upgrade a seed renames roles named in the reserved `system-key-` prefix to `role-<key>` with their assignments; `SystemApiKeys.releaseReserved(key)` renames one named so later, and a failure to check is logged as an error. Permission check and the record picker tell a failed read from records that are not reached, and the picker adds a page only once it arrives.
