# Notification App Plugin

The notification runtime sends complete messages through configured Channels. A Channel is a named configuration, such as `system-email`; its `type` selects a registered class, such as `SmtpChannel`. SMTP, Resend, in-app, Feishu webhook, DingTalk webhook and Web Push are peer channel types supplied by their respective plugins.

```yaml
notification:
  channels:
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      auth:
        {
          user: notifications@example.com,
          pass: replace-with-the-smtp-password,
        }
      from: notifications@example.com
    marketing-email:
      type: resend
      apiKey: replace-with-the-resend-api-key
      from: marketing@example.com
    ops-feishu:
      type: feishu-webhook
      webhookUrl: https://open.feishu.cn/open-apis/bot/v2/hook/replace-with-the-token
    inbox:
      type: in-app
```

```ts
const notification = app.container.resolve(notificationServiceToken);
await notification.send({
  idempotencyKey: 'approval-123',
  source: { type: 'approval', referenceId: '123' },
  messages: {
    'system-email': {
      to: ['customer@example.com', 'reviewer@example.com'],
      subject: 'Approval result',
      html: '<p>Approved</p>',
    },
    'ops-feishu': {
      text: 'Approved',
      target: { type: 'url', url: 'https://example.com/main/approvals/123' },
    },
    inbox: {
      to: '123',
      title: 'Approval result',
      body: 'Approved',
      target: { type: 'route', path: '/approvals/123' },
    },
  },
});
```

All messages are validated before persistence. Email and in-app arrays produce one Delivery per native recipient; Webhooks forbid `to`. Delivery failures remain independent. Queues, timeouts, leases, idempotency, status queries, retry audits, and realtime inbox events remain part of the runtime. Retries stay bound to the original Channel and Provider.

`type` is the preferred discriminator. Existing `provider` configuration remains supported as a deprecated alias; when both are present they must match. Application configuration reads expose both `type` and `provider` with the same value after loading, merging defaults, and reloading, so existing business code reading `config.provider` continues to work. New code should read `type`. The host mailer accepts the same aliases.

Values in YAML are literal: map secrets from environment variables in `server/config/notification.ts` using `defineMailChannelsConfig` and `envString`. Its default `SMTP_PASSWORD` mapping targets `channels.system-email.auth.pass`; map a marketing Resend key explicitly to `channels.marketing-email.apiKey`.

Extend notifications with a class implementing `ChannelInstance`, then call `registry.registerChannelType(MyChannel)`. Its context contains only `channelName` and `container`. Official plugins and examples use `registerChannelType()` exclusively for channel extensions. Deprecated `registerChannel()` / `registerProvider()` APIs and factory exports remain supported for existing third-party extensions. Built-in server plugins install their legacy message handlers through dedicated compatibility modules; new extensions need no separate message-handler registration. This extension change preserves `send()`, `sendTransient()`, `messages`, result DTOs and stored delivery identities; it adds no `submit()` API or database migration.

See the [integration guide](skills/nocobase-app-plugin-notification/references/integration-and-configuration.md), [sending contract](skills/nocobase-app-plugin-notification/references/sending-notifications.md), and [extension guide](skills/nocobase-app-plugin-notification/references/channel-and-provider-extensions.md). Verify delivery through a normal business flow or server-side `send()` call and inspect the returned notification ID in the protected logs API.

### Sensitive messages

Use `notificationService.sendTransient({ channel, message })` for a message containing a one-time credential. It validates and prepares the message with the configured channel and submits it once with the provider timeout, without creating notification rows, jobs, retry state, or status events. The result is one provider outcome per recipient; raw provider diagnostics are replaced with generic errors while retaining an allowlisted category and submission status for credential-free troubleshooting. There is no durable idempotency or automatic retry, and a timeout is `submission_unknown`. The caller owns safe recovery, rate limits, and any credential-free audit. The external mail provider and recipient still receive the message.
