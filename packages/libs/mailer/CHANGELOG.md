# @nocobase/mailer

## 1.0.0-beta.2

### Major Changes

- cf23bfe: **Breaking:** Remove the deprecated `@nocobase/app-server/mailer` entry and its `Mailer`, `mailerToken`, `createMailer`, `MailerProvider`, and notification configuration exports. Replace `MailExecutions.close(waitMs)` and `drain()` with `stop()` and `wait()`; transport `close()` now cancels supported network work and waits for its original completion without a nested timeout. Application owners must apply the outer shutdown budget. Create exclusive senders with `@nocobase/app-server/mailers` and declare notification config with `@nocobase/app-plugin-notification-providers/config`. Existing inline SMTP/Resend YAML, environment mappings, and provider/channel APIs remain supported.

  Default and Examples now show `mailers.default: system` and explicitly map `MAILERS_SYSTEM_*`; the example configuration remains empty at runtime. The previous `MAILERS_TRANSACTIONAL_*` sample prefix was not published. Applications may still choose any valid mailer name and custom environment prefix.

### Patch Changes

- 4411984: Configure named application mailers once for password reset, user invitations and email notifications. App-server validates `mailers`, adds explicit environment mappings and a private startup snapshot, and registers a `MailSenderFactory` from which Authentication, Users and each email notification channel create their own exclusive sender and close it after stopping their own work, so closing one never affects another. Legacy inline senders, channel selection and standalone Auth, Provider factories and hand-composed hosts keep working without new arguments. New applications can send reset and invitation emails without installing Notification. Restart after changing email configuration; configuration reload does not hot-switch active senders.

## 0.1.0-beta.1

### Minor Changes

- b6934ad: Add an independent SMTP or Resend sender for password recovery with private environment configuration, bounded execution and legacy channel compatibility.
- b6934ad: Expose notification email configuration helpers from `@nocobase/app-plugin-notification-providers/config` and mailer contracts and validation from `@nocobase/mailer/config`, without loading sending runtimes. Preserve notification validation, optional private environment mappings and application overrides. Migrate application templates and configuration examples to the new import. Freeze and deprecate the published `@nocobase/app-server/mailer` API while retaining existing behavior for applications that still depend on it.

## 0.1.0-beta.0

### Minor Changes

- 9e99702: Add a lightweight SMTP/Resend mailer and host email service using the existing notification channel configuration. Built-in notification email Providers delegate to the shared transport implementation while retaining their registration and submission-result contracts. Email diagnostics now use fixed messages that cannot expose provider bodies or credentials.

  Add explicitly enabled automatic password recovery through the host mailer, with bounded background submission, account-independent rate limiting, account-state checks. Existing custom senders remain available when no password reset switch is declared; explicit disablement or disabling password sign-in closes all reset endpoints. Only automatic recovery defaults to revoking existing sessions, and explicit session configuration wins.

  Register the host mailer in both templates and Studio, add bilingual reset success and retry feedback, and show opt-in recovery in Studio's example configuration. Operators must explicitly enable recovery and configure an enabled SMTP/Resend channel in their deployment; existing deployments are not modified.

  Automatic credential links require an explicitly configured public origin (`app.publicOrigin` / `APP_PUBLIC_ORIGIN`), or a direct Better Auth consumer's restricted host configuration, so a client-controlled Host cannot choose the reset-link destination. Custom sender configuration remains compatible.

  Reject malformed SMTP authentication settings when validating email channel availability.

  Keep default SMTP password and Resend API key environment mappings optional and secret in deployment manifests. Applications may explicitly require selected credentials, while enabled email channels still validate their configuration.

  Space recovery links on reset error pages in both templates and Studio, allowing them to wrap on narrow screens.

  Request-logging middleware remains unchanged. Default email links first reach a token-bearing API path, which request path/message logs may record. Default output sanitizes token query values in Referer strings, while raw/custom outputs may still retain them; deployment and request-log protection need separate follow-up before exposing this flow.

## 0.0.1

Initial release.
