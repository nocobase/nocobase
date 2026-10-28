---
"@nocobase/app-server": minor
"@nocobase/app-plugin-authentication": minor
"@nocobase/app-plugin-notification-providers": minor
"@nocobase/app-plugin-notification": patch
"@nocobase/app-skills": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Add named outbound `mail` configurations shared by password recovery and email notifications through one host-owned transport. `mail.default` is selected by `auth.passwordReset: true` and notification channels with `provider: email`; explicit `mailer` references select another sender. Default environment variables are `MAIL_PROVIDER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` and `MAIL_API_KEY`, with credentials marked secret. Startup rejects missing, disabled or invalid references without contacting providers. Password reset emails remain outside notification storage, queues and retries.

Legacy SMTP/Resend notification channels, `auth.passwordReset.enabled/emailChannel`, `SMTP_PASSWORD` and `RESEND_API_KEY` remain supported with a single startup warning and will be removed in **v4.0.0**. Move transport fields to `mail.<name>`, replace email channels with `{ provider: email, mailer: <name> }`, and replace password-reset settings with `true`, `false` or `{ mailer: <name> }`. Omit references to use `default`. Move default secrets to `MAIL_PASSWORD` / `MAIL_API_KEY`; explicitly map named secrets. Do not combine `mailer` and `emailChannel`. Existing Mail account plugin settings coexist unchanged in `mail`.
