# @nocobase/secrets

## 0.1.0-beta.2

### Patch Changes

- 52d0b0d: Configure audit capture for application operations and send events to multiple named destinations, including JSON Lines files. Configuring a destination enables explicitly declared audit operations by default. Audit uses the application authentication settings for its trusted proxies and forwarded IP headers.

  The official templates assemble auditing with `AuditProvider` and ship the file driver. Custom application composition roots can add the provider and the audit configuration factory when they use audit routes or transports. Applications using only `@nocobase/app-server` can start without the audit package.

  Built-in audit operations store English default names and translation keys. The official templates load Repository labels in the viewer's language, and JSON Lines keeps the original event names. Separate labels identify assigning and removing permission sets and enabling and disabling users and keys.

## 0.1.0-beta.1

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.

## 0.1.0-beta.0

### Minor Changes

- 37c8d20: Add `@nocobase/secrets`, a library for encrypting stored secrets: a keyring over versioned master keys (the first is current), HKDF-SHA256 key derivation per purpose, and an AES-256-GCM envelope `nbs1.<version>.<iv>.<tag>.<ciphertext>` whose additional data binds the purpose and any record context. `createKeyring` seals, opens and derives per-purpose keys for libraries that encrypt on their own; `inspectSecret` reads an envelope's key version; `validateSecretKeys`, `decodeSecretKey`, `parseSecretKeysEnv` and `generateSecretKey` handle configuration. Failures are `SecretsError` with `SECRETS_NOT_CONFIGURED`, `SECRETS_KEY_UNKNOWN`, `SECRETS_MALFORMED` or `SECRETS_AUTH_FAILED`.

## 0.0.1

Initial version.
