---
'@nocobase/authorization': minor
---

Add key scopes: an identity may carry `keyScope`, the scope of the credential its request arrived with (a scoped API key, say), set by an identity step through the new `AuthorizationMiddlewareRequest.keyScope`. `authorize`, `can` and `require` deny anything outside it with the `KEY_SCOPE` reason before reading a grant, a superuser included, and `snapshot()` lists only what the scope covers. A composite action is checked against the scope as requested; the grants it expands into are not. `KeyScope.objects(business)` carries record selections for the code that owns the records, and `keyScopeAllows` answers the scope question for code that derives permissions itself.
