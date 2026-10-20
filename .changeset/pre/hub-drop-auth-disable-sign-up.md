---
"@nocobase/create-app": patch
---

Stop writing `AUTH_DISABLE_SIGN_UP=true` into a generated Hub's `.env`. Nothing read the variable, so it never had any effect; the Hub disables public sign-up through `auth.emailAndPassword.disableSignUp: true` in `config.yml`, which `config.example.yml` already sets. Existing Hubs can delete the line from `.env`, and should confirm their `config.yml` sets `disableSignUp: true` under `auth.emailAndPassword`.
