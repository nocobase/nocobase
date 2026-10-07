---
'@nocobase/app-plugin-api-keys': minor
---

Rotate a key in place: `ScopedApiKeys.rotate` (and `POST /api/api-keys/:id/rotate`) now keeps the key's id, name, description, scope and owner and replaces only its secret, renewing the expiry for the lifetime it had; the old secret stops at once. New `ScopedApiKeys` methods: `check` validates what `create` would issue without issuing it, `issueChecked` issues it, `get` reads one key, `setScope` replaces a scoped key's scope (checking the chosen records against whoever chooses them), and `update` renames a key or changes its description. An application may say who creates keys of their own with `setOwnKeyPolicy` (`mayCreateOwn`, `requireOwnCreation`): `POST /api/api-keys`, its rotation and Better Auth's own `/api-key/create` then answer 403 `API_KEY_CREATION_FORBIDDEN` to anyone else, and `GET /api/api-keys/scope-options` reports `mayCreate`.
