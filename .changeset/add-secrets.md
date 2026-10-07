---
'@nocobase/secrets': minor
---

Add `@nocobase/secrets`, a library for encrypting stored secrets: a keyring over versioned master keys (the first is current), HKDF-SHA256 key derivation per purpose, and an AES-256-GCM envelope `nbs1.<version>.<iv>.<tag>.<ciphertext>` whose additional data binds the purpose and any record context. `createKeyring` seals, opens and derives per-purpose keys for libraries that encrypt on their own; `inspectSecret` reads an envelope's key version; `validateSecretKeys`, `decodeSecretKey`, `parseSecretKeysEnv` and `generateSecretKey` handle configuration. Failures are `SecretsError` with `SECRETS_NOT_CONFIGURED`, `SECRETS_KEY_UNKNOWN`, `SECRETS_MALFORMED` or `SECRETS_AUTH_FAILED`.
