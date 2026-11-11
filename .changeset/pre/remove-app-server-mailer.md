---
'@nocobase/app-server': major
'@nocobase/mailer': major
'@nocobase/app-cli': patch
'@nocobase/app-host': patch
'@nocobase/app-host-docker': patch
'@nocobase/app-testing': patch
'@nocobase/app-plugin-agent-sessions': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-database-example': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-jobs-example': patch
'@nocobase/app-plugin-lifecycle-example': patch
'@nocobase/app-plugin-mail-example': patch
'@nocobase/app-plugin-notification-example': patch
'@nocobase/app-plugin-office-flows-example': patch
'@nocobase/app-plugin-queue-example': patch
'@nocobase/app-plugin-realtime-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-plugin-service-provider-example': patch
'@nocobase/app-plugin-skills-example': patch
'@nocobase/app-plugin-template-print-example': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-concurrency': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-demo-mode': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-foundation': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-plugin-mail': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-notification-providers': patch
'@nocobase/app-plugin-notification-web-push': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

**Breaking:** Remove the deprecated `@nocobase/app-server/mailer` entry and its `Mailer`, `mailerToken`, `createMailer`, `MailerProvider`, and notification configuration exports. Replace `MailExecutions.close(waitMs)` and `drain()` with `stop()` and `wait()`; transport `close()` now cancels supported network work and waits for its original completion without a nested timeout. Application owners must apply the outer shutdown budget. Create exclusive senders with `@nocobase/app-server/mailers` and declare notification config with `@nocobase/app-plugin-notification-providers/config`. Existing inline SMTP/Resend YAML, environment mappings, and provider/channel APIs remain supported.

Default and Examples now show `mailers.default: system` and explicitly map `MAILERS_SYSTEM_*`; the example configuration remains empty at runtime. The previous `MAILERS_TRANSACTIONAL_*` sample prefix was not published. Applications may still choose any valid mailer name and custom environment prefix.
