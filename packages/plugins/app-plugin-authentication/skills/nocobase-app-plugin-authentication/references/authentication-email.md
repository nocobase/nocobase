# Authentication email

Declare the application's `auth` section with `defineAuthConfig` from `@nocobase/app-plugin-authentication/server`. It owns validation and the `AUTH_EMAIL_*` environment mappings. Keep the sender private; do not add `email` or any of its fields to public configuration. The sender is independent of notification channels and the mailbox plugin's `mail` configuration and `MAIL_*` variables.

Configure SMTP in `config.yml`:

```yaml
app:
  publicOrigin: https://app.example.com
auth:
  emailAndPassword:
    enabled: true
  passwordReset:
    enabled: true
  email:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: noreply@example.com
      pass: replace-with-the-smtp-password
    from: App <noreply@example.com>
    # replyTo: support@example.com
```

For Resend, replace the entire `auth.email` object; do not retain SMTP fields:

```yaml
auth:
  passwordReset:
    enabled: true
  email:
    provider: resend
    apiKey: replace-with-the-resend-api-key
    from: App <noreply@example.com>
```

The existing password sign-in and public application origin requirements still apply. Merely adding `auth.email` does not enable recovery. SMTP permits an unauthenticated relay when `auth` is omitted, following the mailer contract. No notification or mailbox plugin is required. There are four execution slots, a 20-second cancellation deadline and a five-second bounded shutdown wait. A callback that ignores cancellation retains its slot until it finishes. Each SMTP submission opens its own connection and closes it when the submission ends; nothing is written to notification records or a retry queue. Do not add application-level retries: failed or uncertain submissions never switch senders or automatically resend.

## Environment configuration

These mappings are relative to `auth` and are supplied by `defineAuthConfig`. Environment values override the configuration file. A sender can be supplied entirely by these variables; incomplete or invalid configuration reports its `auth.email` path.

| Variable              | Path                   | Parsing            |
| --------------------- | ---------------------- | ------------------ |
| `AUTH_EMAIL_PROVIDER` | `auth.email.provider`  | `smtp` or `resend` |
| `AUTH_EMAIL_HOST`     | `auth.email.host`      | string             |
| `AUTH_EMAIL_PORT`     | `auth.email.port`      | integer, 1–65535   |
| `AUTH_EMAIL_SECURE`   | `auth.email.secure`    | boolean            |
| `AUTH_EMAIL_USER`     | `auth.email.auth.user` | string             |
| `AUTH_EMAIL_PASSWORD` | `auth.email.auth.pass` | secret string      |
| `AUTH_EMAIL_FROM`     | `auth.email.from`      | string             |
| `AUTH_EMAIL_REPLY_TO` | `auth.email.replyTo`   | string             |
| `AUTH_EMAIL_API_KEY`  | `auth.email.apiKey`    | secret string      |

Use only the selected provider's variables. Discover them with `pnpm nocobase config env` and `pnpm nocobase config variables`. Passwords and API keys are marked secret in deployment metadata and the whole sender is excluded from default public configuration. Never log configuration values or provider error bodies.

## Sender priority and legacy migration

1. Explicit `auth.passwordReset.enabled: false` or disabled password sign-in disables recovery, including custom callbacks.
2. `auth.emailAndPassword.sendResetPassword` takes precedence. Existing callbacks remain available when `passwordReset.enabled` is absent.
3. Without a custom callback, `auth.email` is selected only with `passwordReset.enabled: true` and a configured public origin.
4. Only when both sender entries are absent, old applications retain the deprecated `auth.passwordReset.emailChannel` compatibility path, including default `system-email` and the existing channel aliases, validation and enabled-state rules. Authentication reads the legacy notification section itself and owns its transport and its shutdown; no MailerProvider or installed notification/mailbox plugin is required. Keep that section until migrating to auth.email. Applications with explicit opt-in and valid legacy configuration now work even if they never registered MailerProvider. New applications must use `auth.email`.

To migrate an old application, copy the chosen SMTP or Resend sender fields into `auth.email`, remove `auth.passwordReset.emailChannel` if explicitly set, and retain `passwordReset.enabled: true` and the public origin. Leave notification and mailbox settings unchanged for their own consumers. The old path remains supported without a scheduled removal date; startup warns when it is actually selected. Fixed, credential-free warnings also identify ignored email configuration when a custom callback wins, or an ignored legacy entry when `auth.email` wins. Invalid explicit `auth.email` fails startup instead of falling back. `auth.passwordReset.template` remains available for built-in sending; custom callbacks own their email content.
