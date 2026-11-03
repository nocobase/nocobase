# Application mailers

Configure a named sender once for password reset, invitations and notifications. `mailers.default` is a name; omitting it never selects the first service. Configuring mailers neither enables password reset nor creates notification channels. The mailbox plugin's `mail` and `MAIL_*` remain independent.

```yaml
mailers:
  default: system
  system:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
    from: 'Studio <notifications@example.com>'
auth:
  passwordReset:
    enabled: true
  # email:
  #   mailer: system
users:
  invitations: {}
notification:
  channels:
    system-email:
      type: email
      # mailer: system
```

`system` is the templates' example name, not a reserved name or fallback. Applications can use any valid service name, such as `transactional` or `marketing`, and can choose a matching custom environment prefix. The factory only uses an explicit name or `mailers.default`; it never hard-codes `system`. Set `app.publicOrigin` before enabling recovery. Inject the password through an explicitly declared environment mapping. An unauthenticated relay can omit `auth`.

A Resend configuration uses only its own provider fields:

```yaml
mailers:
  default: system
  system:
    provider: resend
    apiKey: replace-with-the-api-key
    from: 'Studio <notifications@example.com>'
    # replyTo: support@example.com
```

## Declaration and environment

```ts
// server/config/mailers.ts; include mailers in server/config/index.ts defaultAppConfigs.
import {
  defineMailersConfig,
  mailerEnvironment,
} from '@nocobase/app-server/mailers/config';

export default defineMailersConfig({
  defaults: {},
  env: { ...mailerEnvironment('system', 'MAILERS_SYSTEM') },
});
```

The helper explicitly declares only the chosen name and prefix. The template declaration makes `MAILERS_SYSTEM_PROVIDER`, `_HOST`, `_PORT`, `_SECURE`, `_USER`, `_PASSWORD`, `_API_KEY`, `_FROM`, `_REPLY_TO` and `_ENABLED` discoverable through `pnpm nocobase config env`. Port is an integer and secure/enabled are booleans. Password/API key are secret. Use only the selected provider's variables. For entirely environment-based configuration, set `MAILERS_DEFAULT=system` (the default-name mapping is declared by the factory). Arbitrary environment scanning and YAML `${NAME}` expansion are unsupported. Mailers cannot publish public paths; credentials stay out of `config.public`.

Example `.env` values for SMTP:

```dotenv
MAILERS_DEFAULT=system
MAILERS_SYSTEM_PROVIDER=smtp
MAILERS_SYSTEM_HOST=smtp.example.com
MAILERS_SYSTEM_PORT=587
MAILERS_SYSTEM_SECURE=false
MAILERS_SYSTEM_USER=notifications@example.com
MAILERS_SYSTEM_PASSWORD=replace-with-the-password
MAILERS_SYSTEM_FROM=Studio <notifications@example.com>
# MAILERS_SYSTEM_REPLY_TO=support@example.com
# MAILERS_SYSTEM_ENABLED=true
```

For Resend, use a separate set of provider fields:

```dotenv
MAILERS_DEFAULT=system
MAILERS_SYSTEM_PROVIDER=resend
MAILERS_SYSTEM_API_KEY=replace-with-the-api-key
MAILERS_SYSTEM_FROM=Studio <notifications@example.com>
# MAILERS_SYSTEM_REPLY_TO=support@example.com
# MAILERS_SYSTEM_ENABLED=true
```

The SMTP and Resend sets are alternatives; do not combine their provider-specific keys. A service may instead be named `transactional`, `marketing` or another valid name by changing the name and prefix passed to `mailerEnvironment`.

Validation is pure: startup/config check never connects or sends. Invalid providers, mixed fields, invalid defaults and missing/disabled references report safe configuration paths. No mailers is valid. Declare Auth, Users and Notification sections with their owner factories for cross-reference checks; manually composed hosts validate references when a consumer creates its sender too.

## API and lifecycle

```ts
import { mailSenderFactoryToken } from '@nocobase/app-server/mailers';

// At an assembly boundary (a Provider's register, a channel constructor), never inside business services.
const sender = app.container.resolve(mailSenderFactoryToken).create('system'); // omit the name for mailers.default
const result = await sender.send(
  { to: 'recipient@example.com', subject: 'Notice', text: 'Hello' },
  { signal, idempotencyKey },
);
// The owner stops new work and closes this sender while waiting for completion:
await sender.close();
```

`Application` registers one `MailSenderFactory` under `mailSenderFactoryToken` before business providers. The factory holds only the validated startup snapshot of `mailers`; it keeps, tracks and closes no senders. Each `create(name?, path?)` returns a new exclusive `MailSender`; a missing name uses `mailers.default`, and a missing default or a missing/disabled reference throws with the given safe path instead of choosing another service. `createFromConfig(config)` builds a sender from a legacy inline SMTP/Resend configuration recognized by its owning module, validated the same way the transport always validated it. `assertReference(name, path)` validates without sending; `provider(name?)` reports only the provider discriminator, which Notification uses to declare Resend idempotency. A sender allocates its transport on the first send, so a sender that never sends holds nothing. Business services receive the `MailSendView` (send only); the assembly owner keeps `close`. Hosts composed without the token use `resolveMailSenderFactory(container, config)`, which falls back to a factory built from the given configuration.

Results remain `accepted`, `failed` (disposition `never` or `same_provider`) and `submission_unknown`. Accepted means submission accepted, not delivery received. Each call makes one submission, forwarding cancellation and idempotency keys. SMTP has no server-side idempotency promise. Each SMTP message opens/closes its own connection. There is no pooling, automatic retry, failover or sender switching. Notification retains existing durable retries, delivery identity and records. Reset/invitation messages bypass notification history and durable retry queues.

Ownership is single and local: whoever creates a sender closes it, after stopping its own work. Senders are never shared, so closing one never affects another consumer. `close()` refuses new sends, then closes the transport while it waits for original submissions to finish. It has no local timeout. The application's `APP_SHUTDOWN_TIMEOUT_MS` remains the outer process budget. Owners in the native application:

- `AuthenticationProvider` selects and creates the reset sender at registration, injects it into Auth, and closes it while Auth waits for native work to finish. Provider shutdown starts both branches together and reports failures after observing both. Custom Auth callbacks retain their five-second bounded shutdown wait; a timeout reports unfinished work and leaves its completion tracked. Connection-bound Auth instances borrow the sender.
- `UsersProvider` creates the invitation sender through its invitation adapter. On shutdown it refuses new invitations, cancels and closes the sender while waiting for sends, then waits through post-submission bookkeeping before the database closes.
- Each Notification email channel (`type: email`, and legacy `smtp`/`resend`) creates its sender in its constructor and closes it in `close()`, which Notification calls after draining its Jobs; an `initialize()` failure also calls `close()`.
- A standalone `new Auth({ email, ... })` without an injected sender selects and owns its own sender and closes it in `close()`.

Mailers, consumer selection and legacy inline configurations use startup snapshots. `AppConfig.reload()` can replace validated configuration storage, but never hot-switches credentials or closes in-flight senders. Restart after changing email configuration.

## Compatibility and migration

Auth keeps explicit disablement first, including custom callbacks. Selection then is custom `auth.emailAndPassword.sendResetPassword`, explicit `auth.email.mailer`, complete legacy inline `auth.email`, explicit `auth.passwordReset.emailChannel`, `mailers.default`, implicit `system-email`. Built-in sending requires explicit `passwordReset.enabled: true`, enabled password authentication and a trusted origin. A custom callback retains its previous behavior without the switch. References and inline fields cannot share an object. Invalid explicit input never falls back. Custom callback implementations stay application-owned.

Users selects explicit `users.invitations.mailer`, explicit legacy `emailChannel`, application default, then implicit `system-email`. The new path needs no Notification installation. Legacy `sendTransient` still bypasses records/retries. Invitation permissions, token storage, post-commit sending, delivery budget, share links and manual resend remain unchanged. A timeout never triggers another submission or releases a slot occupied by original work.

Notification `type: email` selects its explicit `mailer` or the application default. Existing inline SMTP/Resend channels and `provider` aliases retain selection and create their own senders through the same factory. Message validation, recipient preparation, records, retries, cancellation, redaction and deliveryId idempotency identity remain with Notification.

To migrate, copy an existing provider configuration into a named mailer, declare its environment mappings and default, then replace business selections with references or remove them to use the default. Confirm sender identities before removing explicit old selections: a new default never takes them over. Preserve password-reset opt-in and public origin; retain legacy channels still used elsewhere. `AUTH_EMAIL_*`, `SMTP_PASSWORD` and `RESEND_API_KEY` keep their original paths. Clear inline environment variables when replacing an object with a reference, since mixing is invalid. Safe diagnostics point to mailers; no removal date is set.

The earlier `MAILERS_TRANSACTIONAL_*` mapping appeared only in this unmerged change branch and was absent from published application-template packages. No released alias is needed; the explicit `mailerEnvironment` helper still supports an application's existing custom names and prefixes.

The published `@nocobase/app-server/mailer` subpath has been removed as a breaking API change. Create an exclusive sender from `/mailers` at the assembly boundary; close it from the component that created it. Move notification configuration helpers to `@nocobase/app-plugin-notification-providers/config`. Existing inline SMTP/Resend YAML and environment-variable mappings remain supported; this removal applies to the old TypeScript module, not those configuration paths.
