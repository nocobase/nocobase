# Sending Notifications

Resolve `notificationServiceToken` from the shared application container. Select configured Channel names through `messages`; each value is the complete message for its Provider.

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

Email requires a native email address or a non-empty readonly array of addresses, a subject, and text or HTML. Each address receives a separate email and retries independently. In-app messages require application user IDs in the same string/array shape, title, and body; final delivery checks that each user still exists. Webhook messages forbid `to`. An SMS message takes E.164 numbers and a configured `template`; its channel settings are in the `nocobase-app-plugin-notification-providers` Skill. The service does not resolve application users into email addresses or phone numbers and never defaults to the current user.

IM targets accept complete HTTP(S) URLs only. In-app targets accept a route without a deployment prefix or a complete HTTP(S) URL. React Router supplies the basename once for routes; URL targets use native links. Email links belong in text/HTML. Legacy `actionUrl` is ignored.

Unknown or disabled Channels and invalid messages or recipient formats reject the entire request before persistence or queue dispatch. Delivery-time failures are recorded independently. Reuse one stable `idempotencyKey` only for the same logical request; changing messages with that key is a conflict. Optional `source` adds business correlation. Use `getByIdempotencyKey`, `getNotification`, and `onStatusChanged` to observe results. A `retrying` Delivery is waiting for automatic execution; a terminal `failed` Delivery may be passed to `retryDelivery({ deliveryId, reason })`. An `unknown` Delivery must be checked externally before creating a new logical send.

For typed custom hosts, pass a literal Channel map to `createNotificationManager`. `ConfiguredNotificationChannels<typeof channels>` maps each key through its Provider identifier to the registered message contract. Import the relevant Provider package so its declaration merging is loaded.

There is no legacy sending API, shared content, per-Channel override, Provider routing, grouping, condition selection, or cross-Channel fallback. Intentional multi-send uses multiple `messages` entries.
