---
'@nocobase/app-plugin-mail': minor
---

Declare the Mail environment variables on `mailConfig`

`mailConfig` now declares `MAIL_OAUTH_CALLBACK_URL`, `MAIL_OAUTH_RETURN_URL`, `MAIL_AUTOMATIC_SYNC_INTERVAL_MS`, `MAIL_SYNC_BATCH_SIZE`, `MAIL_PUSH_WEBHOOK_URL` and `MAIL_PUSH_WEBHOOK_SECRET` itself, the way the current OSS template declares every section's variables, and `pnpm nocobase config env` lists them. Registering `mailConfig` in `server/config/index.ts` is all an application does to make them take effect; applications created from the current template have no `server/environment.ts` to edit.

The README and Skill now say so, and tell agents to register the plugin with `pnpm nocobase plugin register mail`, since the `plugin:register` script alias no longer exists in generated applications.
