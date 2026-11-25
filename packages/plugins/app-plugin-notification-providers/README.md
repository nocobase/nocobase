# Notification Providers App Plugin

Built-in channel types are `email`, `smtp`, `resend`, `feishu-webhook`, `dingtalk-webhook` and `sms`. Their classes are `EmailChannel`, `SmtpChannel`, `ResendChannel`, `FeishuWebhookChannel`, `DingTalkWebhookChannel` and `SmsChannel`. Email and IM validation helpers are shared internally; only the concrete class is registered. Register the Server plugin after the core notification plugin, or call `registerBuiltInNotificationProviders(registry)` in a custom host.

```yaml
mailers:
  default: system
  system:
    provider: smtp
    host: smtp.example.com
    port: 587
    from: notifications@example.com
notification:
  channels:
    system-email:
      type: email
      # mailer: system
    ops-feishu:
      type: feishu-webhook
      webhookUrl: https://open.feishu.cn/open-apis/bot/v2/hook/replace-with-the-token
    inbox:
      type: in-app
```

Each named Channel owns one flat configuration and defaults to enabled. Several Email Channels can reference the same application mailer; each Channel still creates and closes its own sender. The `provider` alias remains supported; if both discriminators are supplied, they must match. YAML values are literal; the host maps environment variables to configuration paths. The separate in-app plugin supplies the inbox in this example. Feishu and DingTalk accept their official HTTPS Webhook hosts and reject redirects.

Declare the application's `notification` section with `defineMailChannelsConfig` from `@nocobase/app-plugin-notification-providers/config`. This pure configuration export provides `validateMailChannels` and `MailChannelsConfig` without loading notification delivery code, email transports or provider SDKs, and requires no plugin startup. The same helpers are also exported from `/email` for existing email integrations. The former `@nocobase/app-server/mailer` subpath has been removed; migrate configuration helper imports here and sender creation to `@nocobase/app-server/mailers`.

The factory validates enabled SMTP/Resend channels and merges application validators after built-in validation. Its optional private `SMTP_PASSWORD` and `RESEND_API_KEY` mappings target `channels.system-email.auth.pass` and `channels.system-email.apiKey`; application `env` entries override matching defaults. Custom channel providers retain their own validation. No configuration is public by default.

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

Register one class directly with `registry.registerChannelType(SmtpChannel)`, or use the Server plugin to register all four. `SmtpChannelConfig`, `ResendChannelConfig`, `FeishuWebhookChannelConfig` and `DingTalkWebhookChannelConfig` describe their normalized `type` configurations. See the [complete extension example](../app-plugin-notification/skills/nocobase-app-plugin-notification/references/channel-and-provider-extensions.md).

The Server plugin also installs the legacy `email` and `im` message handlers from its compatibility module, preserving third-party `registerProvider()` extensions. This compatibility setup is separate from the class registration path. New extensions and application code should only call `registerChannelType()`; direct class registration does not install legacy handlers.

Legacy helpers such as `defineSmtpProviderConfig` still produce supported `provider` configurations, and the old `create*Definition` exports remain available for existing extensions. The built-in bootstrap now uses class registration exclusively.

Prefer `type: email` with application mailers. Declare `defineMailersConfig` and explicit `mailerEnvironment` mappings from `@nocobase/app-server/mailers/config`. Restart to apply sender changes. Every email Channel, including legacy inline SMTP/Resend Channels and their mappings, creates an exclusive sender through the application's `MailSenderFactory` when it is constructed and closes it in `close()`; closing one Channel never affects another or Auth and Users.

## SMS

The `sms` channel sends template messages to E.164 phone numbers through Alibaba Cloud (`service: aliyun`) or Tencent Cloud (`service: tencent`); another service registers with `smsProviderRegistryToken`. The `provider` alias already means `type`, so the service is named `service`.

```yaml
notification:
  channels:
    system-sms:
      type: sms
      service: aliyun
      signName: Example
      templates:
        code: { templateId: SMS_123456789, params: { code: code } }
        notification:
          { templateId: SMS_987654321, params: { title: title, body: body } }
```

`defineMailChannelsConfig` maps the private variables `SMS_ALIYUN_ACCESS_KEY_ID`, `SMS_ALIYUN_ACCESS_KEY_SECRET`, `SMS_TENCENT_SECRET_ID`, `SMS_TENCENT_SECRET_KEY` and the public `SMS_SIGN_NAME` onto a channel named `system-sms`. Credentials are never public configuration, never appear in the settings page summary, and are not logged. Both services call the provider's signed HTTPS API directly, without its SDK.

Send a one-time code with `notification.sendTransient()`, never `send()`, so it is not stored or logged. A failure carries a stable code (`SMS_SIGNATURE_INVALID`, `SMS_TEMPLATE_INVALID`, `SMS_RATE_LIMITED`, `SMS_INSUFFICIENT_BALANCE` and others) and a readable message. The channel's test send reaches the administrator's verified phone, and a notification kind selects SMS with `channels: { sms: 'on' }`; both resolve phones through `userPhoneDirectoryToken`, which the verification plugin provides. The package's Skill, `nocobase-app-plugin-notification-providers`, has the details.
