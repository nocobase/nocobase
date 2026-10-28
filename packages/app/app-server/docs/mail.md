# Outbound mail

Register `MailerProvider` from `@nocobase/app-server/mailer` once in the application and declare `mail` with `defineMailConfig()`. Authentication and notification email channels resolve the same `mailerToken`: each selected configuration has one lazy transport per application container, closed by the host. Restart after changing transport settings; live transport replacement is not supported. Neither declaration nor startup validation contacts a mail server.

```yaml
mail:
  default:
    provider: smtp
    host: smtp.example.com
    port: 587
    from: App <noreply@example.com>
    auth: { user: noreply@example.com, pass: replace-with-the-smtp-password }
  marketing:
    provider: resend
    apiKey: replace-with-the-resend-api-key
    from: News <news@example.com>
auth:
  passwordReset: true
notification:
  channels:
    email:
      provider: email
    newsletter:
      provider: email
      mailer: marketing
```

`default` is the conventional outbound name. `auth.passwordReset: { mailer: marketing }` selects another sender without requiring `mail.default`; the object enables recovery unless explicitly disabled. A TypeScript `template(data, appName)` returns an `EmailMessage`. Keep `app.publicOrigin` operator-controlled: automatic recovery still requires a trusted reset origin. `false` disables recovery, including custom callbacks. A custom `emailAndPassword.sendResetPassword` takes precedence and needs no mail configuration. Omitting `passwordReset` keeps automatic recovery off and preserves custom callback behavior.

Reset emails are sent directly, outside notifications: no notification record, queue or retry contains their temporary links. Existing rate limits, bounded background execution, origin checks and sanitized diagnostics still apply. Ordinary notifications retain their original delivery records, queue and retry policy. Resend channels retain delivery-ID idempotency; SMTP does not advertise idempotency.

The mail factory maps `MAIL_PROVIDER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` and `MAIL_API_KEY` to `mail.default`. Specify `MAIL_PROVIDER=smtp` or `resend` when configuring only through the environment. Ports and booleans are parsed by type. Credentials are optional deployment variables (the selected provider still requires valid parameters), marked secret, and never published to browsers. Values in YAML are literal, including `${NAME}`. Add named environment variables explicitly:

```ts
import { defineMailConfig } from '@nocobase/app-server/mailer';
import { envString } from '@nocobase/app-server/config';

export default defineMailConfig({
  defaults: {},
  env: {
    MARKETING_API_KEY: envString('marketing.apiKey', {
      secret: true,
      required: false,
    }),
    MARKETING_PASSWORD: envString('marketing.auth.pass', {
      secret: true,
      required: false,
    }),
  },
});
```

The Mail account plugin also uses this section. Preserve its factory defaults and environment mappings when composing `defineMailConfig({ defaults: mailConfig, env: mailConfig.rules?.env })`. Its reserved keys are `providers`, `oauthCallbackUrl`, `oauthReturnUrl`, `automaticSyncIntervalMs`, `syncBatchSize`, `pushWebhookUrl`, `pushWebhookSecret` and `jobs`; choose another name for an outbound sender. Other direct keys are outbound configurations. Do not expose this section through public configuration.

## Migration before v4.0.0

Legacy `notification.channels.<name>` SMTP/Resend configurations, `auth.passwordReset.enabled/emailChannel`, `SMTP_PASSWORD` and `RESEND_API_KEY` continue working with a single startup migration warning. Keep `defineMailChannelsConfig` on the notification section while old variables are in use. These legacy forms will be removed in **v4.0.0**.

1. Copy each legacy channel's transport/sender fields to `mail.<name>` (use `default` for the common sender).
2. Replace the channel with `{ provider: email, mailer: <name> }`; omit `mailer` for `default`.
3. Replace `auth.passwordReset: { enabled: true, emailChannel: <name> }` with `{ mailer: <name> }`, or `true` for `default`. Replace `{ enabled: false }` with `false`.
4. Move old secret variables to `MAIL_PASSWORD` / `MAIL_API_KEY` for `default`, or explicitly mapped named variables. Remove legacy environment mappings after migrating.

An old `emailChannel` without `enabled: true` keeps automatic recovery off. Legacy references always resolve the old channel, even if `mail` contains the same name. `mailer` and `emailChannel` together are an error. Missing, invalid or disabled targets fail startup with a configuration path and correction hint; no credentials, recipients or reset links appear in these diagnostics. Custom callbacks do not require a default sender.
