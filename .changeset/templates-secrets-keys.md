---
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-template-hub': minor
---

Register the secrets service and declare the `secrets` section. `server/config/secrets.ts` declares `secrets.keys` with `defineSecretsConfig`, read from `config.yml` or `SECRETS_KEYS`, and `server/app.ts` adds `SecretsProvider`. `config.example.yml` carries a `secrets` block in place of `auth.secret` and `session.secret`: the sign-in and session keys are now derived from `secrets.keys`, which also encrypts what plugins store as a secret.

To upgrade an existing application, add `server/config/secrets.ts` and its entry in `server/config/index.ts`, add `SecretsProvider` to `server/app.ts` after `IdGeneratorProvider`, and add a key to `config.yml`:

```yaml
secrets:
  keys:
    - version: 1
      key: <openssl rand -hex 32>
```

Keep `auth.secret` beside it so that data Better Auth encrypted before, such as OAuth tokens, still decrypts; `session.secret` may be removed. Switching to derived keys signs every user out once, as does every later change of the current key. Rotate with `pnpm nocobase secrets rotate` after putting a new key first.
