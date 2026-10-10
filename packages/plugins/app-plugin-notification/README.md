# Notification App Plugin

The notification runtime sends complete messages through configured Channels. Each Channel name maps to one Provider configuration; Provider identifiers are globally unique and determine the message type.

```yaml
notification:
  channels:
    system-email:
      provider: smtp
      host: smtp.example.com
      port: 587
      auth: { user: '${SMTP_USER}', pass: '${SMTP_PASSWORD}' }
      from: notifications@example.com
    marketing-email:
      provider: resend
      apiKey: '${RESEND_API_KEY}'
      from: marketing@example.com
    ops-feishu:
      provider: feishu-webhook
      webhookUrl: '${FEISHU_WEBHOOK_URL}'
    inbox:
      provider: in-app
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

This contract replaces the previous configuration and send API without compatibility aliases. Update configuration and callers together before upgrading. The single-Provider migration removes `providerName` from delivery and attempt records; rolling it back restores the columns using Provider identifiers, not the deleted instance names.

See the [integration guide](skills/nocobase-app-plugin-notification/references/integration-and-configuration.md), [sending contract](skills/nocobase-app-plugin-notification/references/sending-notifications.md), and [extension guide](skills/nocobase-app-plugin-notification/references/channel-and-provider-extensions.md). The protected test-send form selects one Channel and shows its message fields.

### Sensitive messages

Use `notificationService.sendTransient({ channel, message })` for a message containing a one-time credential. It validates and prepares the message with the configured channel and submits it once with the provider timeout, without creating notification rows, jobs, retry state, or status events. The result is one provider outcome per recipient; provider diagnostics are replaced with a generic error to avoid leaking credentials. There is no durable idempotency or automatic retry, and a timeout is `submission_unknown`. The caller owns safe recovery, rate limits, and any credential-free audit. The external mail provider and recipient still receive the message.
