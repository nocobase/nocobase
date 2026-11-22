---
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-api-keys': patch
---

`SystemApiKeys.adopt` refuses when a Permission Set already carries the account's reserved name (`SYSTEM_KEY_SET_TAKEN`), so an application's role and its members never receive the import, and answers a repeated import only for the same key and the same requested grants, in any order or split, as recorded on the system key itself. Deleting a system key whose service account could not be removed, even after the account was marked deleted, finishes when it is deleted again, and its manager is told once. Roles already named in the reserved `system-key-` prefix keep working as they are and are reported at boot; `SystemApiKeys.releaseReserved(key)` renames one, within the database's 255-character keys, and a failure to check is logged as an error. A set another owner protects by name under the prefix, such as a configured root set, stays theirs, so the application still starts. Permission check and the record picker tell a failed read from records that are not reached, and the picker adds a page only once it arrives.
