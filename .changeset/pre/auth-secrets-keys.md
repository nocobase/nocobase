---
'@nocobase/app-plugin-authentication': minor
---

Derive Better Auth's keys from the application's secrets keys. When the configuration sets neither `auth.secret` nor `auth.secrets`, the plugin passes Better Auth versioned `secrets` derived from `secrets.keys` for the purpose `@nocobase/app-plugin-authentication/better-auth`, so adding a key to `secrets.keys` rotates them; an `auth.secret` set alongside `secrets.keys` is passed as Better Auth's legacy secret so data encrypted before still decrypts, and `auth.secret` alone keeps working as before. With neither, the application refuses to start with `ApplicationNotConfiguredError` naming `secrets.keys` and `SECRETS_KEYS`. `resolveAuthSecrets` is the new resolver; `resolveAuthSecret` is deprecated.

Better Auth signs its session cookie with the current key only, so putting a new key first signs every user out once, and so does adding `secrets.keys` to an application that only had `auth.secret`. Encrypted account data, such as OAuth tokens, stays readable while the older key remains in the list.
