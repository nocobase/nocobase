# Legacy host email API migration

The published `@nocobase/app-server/mailer` module is deprecated and frozen for existing applications. Its exports remain available with their existing behavior; no removal date is set. App-server does not re-export a notification plugin. New configuration code imports `defineMailChannelsConfig`, `validateMailChannels` and `MailChannelsConfig` from `@nocobase/app-plugin-notification-providers/config` instead.

```ts
import { defineMailChannelsConfig } from '@nocobase/app-plugin-notification-providers/config';

export default defineMailChannelsConfig({ defaults: { channels: {} } });
```

The new pure configuration export needs no notification plugin startup and loads no SMTP or Resend SDK. Both factories preserve `type`/`provider` resolution, enabled-channel validation, application validators and environment overrides. `SMTP_PASSWORD` still maps to `channels.system-email.auth.pass` and `RESEND_API_KEY` to `channels.system-email.apiKey`; both mappings stay optional and private. Mappings neither select a provider nor enable a channel. Nothing is public by default.

For direct service-owned sending, use a transport from `@nocobase/mailer` and own its shutdown lifecycle. Configuration-only consumers can import contracts and validators from `@nocobase/mailer/config`. Notification channels continue owning their transports and delivery behavior independently.

Keep `MailerProvider` registrations required by an existing host-mailer consumer until that consumer has migrated. In particular, legacy Authentication password recovery currently still requires this provider when neither a custom callback nor `auth.email` is configured. New Authentication sender configuration uses `auth.email` through `defineAuthConfig` and does not need the host mailer. Changing a configuration import alone does not migrate a sending service.
