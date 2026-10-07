---
'@nocobase/app-plugin-api-keys': patch
---

An `AccessMapping` may map a ref to several actions of a resource (`{ resource, actions }`), such as a business action granted once per level (`edit.related`, `edit.all`): holding any of them is holding the ref when the key editor reports what a user holds, and a scope covering the ref allows every one. `ApiKeyScopes.accessOf` answers `MappedAccess` entries (`{ resource, actions }`) accordingly.
