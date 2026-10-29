---
"@nocobase/app-plugin-authentication": patch
---

Resolve deprecated password recovery channels inside Authentication and use its own reusable transport and execution lifecycle for both built-in senders. Explicitly enabled legacy applications with valid email channels no longer need a host MailerProvider or installed notification/mailbox plugin. Keep custom callback priority, opt-in requirements, safe diagnostics and single-submission behavior. Remove unused host mailer registrations from templates and fixtures; the published host API remains frozen for external consumers.
