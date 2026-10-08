---
'@nocobase/app-plugin-hub': minor
---

Seal the recoverable copy of each Hub key with the application's secrets service (`secrets.keys`) instead of a key derived from `auth.secret`, still bound to the key's id and owner. Copies stored by earlier versions (`v1.`) are still read with `auth.secret`, and the plugin registers them as a secrets store, so `nocobase secrets rotate` reseals them with the secrets service. `HubApiKeyService` takes `{ secrets, legacySecret }` as its fourth argument; a string is still read as `auth.secret`. Config file deployments now also fill a missing, empty or placeholder `secrets.keys` for the hosted application, keeping the key it already uses, beside `auth.secret` and `session.secret`.

Upgrading a Hub: register `SecretsProvider` and declare the `secrets` section (see the template changeset), add a key to `config.yml` under `secrets.keys` (`openssl rand -hex 32`), and keep `auth.secret`. Creating a Hub key now needs `secrets.keys`. Run `pnpm nocobase secrets status` to see how many copies are still sealed under `auth.secret`, and `pnpm nocobase secrets rotate` to reseal them; until then `auth.secret` must stay as it was.
