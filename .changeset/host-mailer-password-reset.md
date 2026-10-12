---
'@nocobase/mailer': minor
'@nocobase/app-server': minor
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-plugin-notification-providers': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/studio': patch
---

Add a lightweight SMTP/Resend mailer and host email service using the existing notification channel configuration. Built-in notification email Providers delegate to the shared transport implementation while retaining their registration and submission-result contracts. Email diagnostics now use fixed messages that cannot expose provider bodies or credentials.

Add explicitly enabled automatic password recovery through the host mailer, with bounded background submission, account-independent rate limiting, account-state checks and reset-request log redaction. Existing custom senders remain available when no password reset switch is declared; explicit disablement or disabling password sign-in closes all reset endpoints. Only automatic recovery defaults to revoking existing sessions, and explicit session configuration wins.

Register the host mailer in both templates and Studio, add bilingual reset success and retry feedback, and show opt-in recovery in Studio's example configuration. Operators must explicitly enable recovery and configure an enabled SMTP/Resend channel in their deployment; existing deployments are not modified.

Automatic credential links require an explicitly configured public origin (`app.publicOrigin` / `APP_PUBLIC_ORIGIN`), or a direct Better Auth consumer's restricted host configuration, so a client-controlled Host cannot choose the reset-link destination. Custom sender configuration remains compatible.

Reject malformed SMTP authentication settings when validating email channel availability.

Keep default SMTP password and Resend API key environment mappings optional and secret in deployment manifests. Applications may explicitly require selected credentials, while enabled email channels still validate their configuration.
