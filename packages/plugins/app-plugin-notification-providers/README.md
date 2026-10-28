# Notification Providers App Plugin

Built-in channel types are `email`, legacy `smtp` / `resend`, `feishu-webhook`, and `dingtalk-webhook`. Their classes are `EmailChannel`, `SmtpChannel`, `ResendChannel`, `FeishuWebhookChannel` and `DingTalkWebhookChannel`. Email and IM validation helpers are shared internally; only the concrete class is registered. Register the Server plugin after the core notification plugin, or call `registerBuiltInNotificationProviders(registry)` in a custom host.

```yaml
mail:
  default:
    provider: smtp
    host: smtp.example.com
    port: 587
    from: notifications@example.com
  marketing:
    provider: resend
    apiKey: replace-with-the-resend-api-key
    from: marketing@example.com
notification:
  channels:
    system-email:
      provider: email
    marketing-email:
      provider: email
      mailer: marketing
    ops-feishu:
      type: feishu-webhook
      webhookUrl: https://open.feishu.cn/open-apis/bot/v2/hook/replace-with-the-token
    inbox:
      type: in-app
```

Each named Channel owns one flat configuration and defaults to enabled. Email channels reference a shared host mailer; multiple channels and password recovery reuse its transport. Register `MailerProvider` and declare `mail` with `defineMailConfig`. Missing or disabled references fail startup. The `provider` alias remains supported; if both discriminators are supplied, they must match. YAML values are literal; the host maps environment variables to configuration paths. The separate in-app plugin supplies the inbox in this example. Feishu and DingTalk accept their official HTTPS Webhook hosts and reject redirects.

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

Email requires native email addresses and subject plus text or HTML. Arrays create separate emails and retries. Webhooks forbid recipients and accept only complete HTTP(S) targets. There is no user-to-address resolution, common content renderer, Provider instance name, or Provider routing. Use the normal `send()` API for delivery verification and keep credentials on the server.

Register one class directly with `registry.registerChannelType(SmtpChannel)`, or use the Server plugin to register all built-ins. `EmailNotificationChannelConfig`, `SmtpChannelConfig`, `ResendChannelConfig`, `FeishuWebhookChannelConfig` and `DingTalkWebhookChannelConfig` describe their normalized `type` configurations. See the [complete extension example](../app-plugin-notification/skills/nocobase-app-plugin-notification/references/channel-and-provider-extensions.md).

The Server plugin also installs the legacy `email` and `im` message handlers from its compatibility module, preserving third-party `registerProvider()` extensions. This compatibility setup is separate from the class registration path. New extensions and application code should only call `registerChannelType()`; direct class registration does not install legacy handlers.

Legacy helpers such as `defineSmtpProviderConfig` still produce supported `provider` configurations, and the old `create*Definition` exports remain available for existing extensions. The built-in bootstrap now uses class registration exclusively.

## Legacy migration

SMTP/Resend channel credentials and `SMTP_PASSWORD` / `RESEND_API_KEY` remain supported until v4.0.0, with one startup warning. Move those fields to `mail.<name>` and replace the channel with `provider: email` and optional `mailer`; omit the reference for `mail.default`. New default secrets use `MAIL_PASSWORD` / `MAIL_API_KEY`; named configurations use explicit secret mappings. See [outbound mail](../../app/app-server/docs/mail.md) for the complete migration, mailbox-setting coexistence and password-reset examples. Legacy channel classes delegate transport ownership to the host; their shutdown never closes a shared sender. Standalone deprecated provider-definition helpers still own their own transport because they have no application container.
