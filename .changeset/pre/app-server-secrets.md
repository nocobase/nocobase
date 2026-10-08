---
'@nocobase/app-server': minor
---

Add the secrets service at `@nocobase/app-server/secrets`. `SecretsProvider` registers `secretsServiceToken` over the `secrets.keys` section — versioned master keys, the current one first, also read from `SECRETS_KEYS` (`2:<key>,1:<key>`) — which `defineSecretsConfig` declares and validates: versions must be distinct non-negative integers, and every key must decode to at least 32 bytes and not be the example placeholder. The service seals and opens values per purpose with optional record context, reports a value's key version and whether it needs resealing, derives per-purpose key lists for libraries with their own encryption (`keyring(purpose)`), and keeps a registry of stores that `nocobase secrets status` and `secrets rotate` walk; `createSecretsTableStore` implements one over columns of a table, in batches and safely against concurrent writes. Without keys the service is not ready and every use fails with `SECRETS_NOT_CONFIGURED`, naming the fix.

`SessionProvider` now derives the session cookie keys from the secrets keys when `session.secret` is not set, the current key first and older keys accepted as previous secrets, instead of making up a key for each process.
