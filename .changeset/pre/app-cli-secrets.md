---
'@nocobase/app-cli': minor
---

Add `nocobase secrets status` and `nocobase secrets rotate`. `status` reports, for every secrets store the application's plugins register, how many sealed values it holds under each key version of `secrets.keys` and how many need resealing. `rotate` reseals every value not sealed with the current key, in batches (`--batch-size`), rewriting a value only if it is unchanged since it was read, so it can run beside the application and finishes an interrupted run when repeated; `--dry-run` counts and writes nothing. Both answer `--json` with the standard envelope, and fail with `SECRETS_NOT_CONFIGURED`, `SECRETS_UNAVAILABLE` or `SECRETS_RESEAL_FAILED`.

`config init` now generates the first secrets key (`secrets.keys`, version 1) instead of `auth.secret` and `session.secret`, which it still fills when an older `config.example.yml` carries them live, and reports `SECRETS_KEYS` when the environment overrides it. `config check` reports a missing `secrets.keys` as the error `secrets-missing` in place of a missing `auth.secret`, still rejects `auth.secret` and `session.secret` left at the placeholder, and warns about a per-process session key only when neither `secrets.keys` nor `session.secret` is set. `pnpm dev` accepts `SECRETS_KEYS` in the environment as configuration.
