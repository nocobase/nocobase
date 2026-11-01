# Application mailers

Configure a named sender once for password reset, invitations and notifications. `mailers.default` is a name; omitting it never selects the first service. Configuring mailers neither enables password reset nor creates notification channels. The mailbox plugin's `mail` and `MAIL_*` remain independent.

```yaml
mailers:
  default: transactional
  transactional:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
    from: App <notifications@example.com>
auth:
  passwordReset:
    enabled: true
  # email:
  #   mailer: transactional
users:
  invitations: {}
notification:
  channels:
    system-email:
      type: email
      # mailer: transactional
```

Set `app.publicOrigin` before enabling recovery. Inject the password through an explicitly declared environment mapping. An unauthenticated relay can omit `auth`. A Resend entry uses `provider: resend`, `apiKey` and `from`, without SMTP fields.

## Declaration and environment

```ts
// server/config/mailers.ts; include mailers in server/config/index.ts defaultAppConfigs.
import {
  defineMailersConfig,
  mailerEnvironment,
} from '@nocobase/app-server/mailers/config';

export default defineMailersConfig({
  defaults: {},
  env: { ...mailerEnvironment('transactional', 'MAILERS_TRANSACTIONAL') },
});
```

The helper explicitly declares only the chosen name and prefix. `MAILERS_TRANSACTIONAL_PROVIDER`, `_HOST`, `_PORT`, `_SECURE`, `_USER`, `_PASSWORD`, `_API_KEY`, `_FROM`, `_REPLY_TO` and `_ENABLED` appear in `pnpm nocobase config env`. Port is an integer and secure/enabled are booleans. Password/API key are secret. Use only the selected provider's variables. For entirely environment-based configuration, set `MAILERS_DEFAULT` (declared by the factory) to `transactional`. Arbitrary environment scanning and YAML `${NAME}` expansion are unsupported. Mailers cannot publish public paths; credentials stay out of `config.public`.

Validation is pure: startup/config check never connects or sends. Invalid providers, mixed fields, invalid defaults and missing/disabled references report safe configuration paths. No mailers is valid. Declare Auth, Users and Notification sections with their owner factories for cross-reference checks; manually composed hosts validate references on consumer activation too.

## API and lifecycle

```ts
import { applicationMailerToken } from '@nocobase/app-server/mailers';

const mailer = app.container.resolve(applicationMailerToken);
const result = await mailer.send(
  { to: 'recipient@example.com', subject: 'Notice', text: 'Hello' },
  {
    mailer: 'transactional', // optional: mailers.default
    signal,
    idempotencyKey,
  },
);
```

`Application` registers one `ApplicationMailer` before business providers. Import the original token. The service privately copies startup configuration, lazily creates transports and caches them before sending; separate applications never share instances. `bindInline(source, config)` gives compatibility owners a send-only handle keyed by a stable private object. Its first configuration is copied. Different sources cannot overwrite each other; credentials are never identifiers. Handles cannot close transports. `assertReference(name, path)` validates without sending; `provider(name?)` reports only the provider discriminator for notification idempotency capabilities.

Results remain `accepted`, `failed` (disposition `never` or `same_provider`) and `submission_unknown`. Accepted means submission accepted, not delivery received. Each call makes one submission, forwarding cancellation and idempotency keys. SMTP has no server-side idempotency promise. Each SMTP message opens/closes its own connection. There is no pooling, automatic retry, failover or sender switching. Notification retains existing durable retries, delivery identity and records. Reset/invitation messages bypass notification history and durable retry queues.

Stop and drain business producers and Jobs before closing the shared mailer. Provider shutdown runs in reverse registration order. Native Auth/Users sends cancel through their bounded wait, then drain original work; Users also drains post-submission invitation bookkeeping before the database closes. Custom Auth callbacks retain their existing bounded shutdown contract. The shared mailer retains original native sends past Notification timeout results. The shared service then refuses new sends, cancels transports and waits for original submissions before releasing resources. Channels never close it. Hand-composed legacy hosts automatically acquire one service per container, released after its last consumer stops. Standalone Auth and old Provider factories also receive centrally managed compatibility scopes without new arguments. Connection-bound Auth instances share the original service without acquiring its shutdown ownership. Explicit service injection remains optional.

Mailers, consumer selection and inline bindings use startup snapshots. `AppConfig.reload()` can replace validated configuration storage, but never hot-switches credentials or closes in-flight senders. Restart after changing email configuration.

## Compatibility and migration

Auth keeps explicit disablement first, including custom callbacks. Selection then is custom `auth.emailAndPassword.sendResetPassword`, explicit `auth.email.mailer`, complete legacy inline `auth.email`, explicit `auth.passwordReset.emailChannel`, `mailers.default`, implicit `system-email`. Built-in sending requires explicit `passwordReset.enabled: true`, enabled password authentication and a trusted origin. A custom callback retains its previous behavior without the switch. References and inline fields cannot share an object. Invalid explicit input never falls back. Custom callback implementations stay application-owned.

Users selects explicit `users.invitations.mailer`, explicit legacy `emailChannel`, application default, then implicit `system-email`. The new path needs no Notification installation. Legacy `sendTransient` still bypasses records/retries. Invitation permissions, token storage, post-commit sending, delivery budget, share links and manual resend remain unchanged. A timeout never triggers another submission or releases a slot occupied by original work.

Notification `type: email` selects its explicit `mailer` or the application default. Existing inline SMTP/Resend channels and `provider` aliases retain selection and use application-owned bindings. Message validation, recipient preparation, records, retries, cancellation, redaction and deliveryId idempotency identity remain with Notification.

To migrate, copy an existing provider configuration into a named mailer, declare its environment mappings and default, then replace business selections with references or remove them to use the default. Confirm sender identities before removing explicit old selections: a new default never takes them over. Preserve password-reset opt-in and public origin; retain legacy channels still used elsewhere. `AUTH_EMAIL_*`, `SMTP_PASSWORD` and `RESEND_API_KEY` keep their original paths. Clear inline environment variables when replacing an object with a reference, since mixing is invalid. Safe diagnostics point to mailers; no removal date is set.

The published `@nocobase/app-server/mailer` exports remain deprecated with original signatures. `Mailer.send(channel, ...)` still means a notification channel, never a mailer name. Standalone `createMailer` delegates resource management to `ApplicationMailer`; the old provider stays opt-in for external consumers. New consumers use `/mailers` and the shared token.
