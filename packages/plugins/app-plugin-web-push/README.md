# Web Push

A browser notification channel for NocoBase 3 applications. Owns VAPID validation, encrypted device subscriptions, the notification worker and reusable device preferences. Delivery, deadlines and retries use `@nocobase/app-plugin-notification`; this plugin adds no scheduler or polling.

## Install in an application

Install this package and register its default server plugin after authentication, authorization and notification. Register the default client factory from `@nocobase/app-plugin-web-push/client` so its localized messages are loaded. The application needs the usual database, secrets, logging and job executor providers; these already ship in the application templates.

Add the exported `pushConfig` factory to the application's `defaultAppConfigs({ push: pushConfig, ... })`. Preserve `push.privateKey` / `WEB_PUSH_PRIVATE_KEY` and `push.contact` / `WEB_PUSH_CONTACT`. The private key is a persistent P-256 32-byte hex or base64url value, never a per-start random key. Changing it requires browsers to subscribe again. Keep `SECRETS_KEYS` available: subscription encryption uses `web-push/subscription` with `[deviceId,userId]` binding and participates in the host secrets rotation store.

Configure `notification.channels.webPush: { provider: 'web-push' }`. `push.channel` can select a different configured channel for device test messages. Mount `<PushPreferences />` from the client export inside an authenticated application page with the host API client, locale, toaster and query providers. Each device can subscribe, pause, resume, test or remove itself. Removal of another owned device is also supported. The application should call `unsubscribeDevice(api, base, userId)` during sign-out and stop sign-out if that operation fails.

Use HTTPS (localhost is supported for development). The worker is served at `<publicBasePath>/push-worker.js` without authentication and uses the application's existing scope. There is no fetch handler or offline cache. Applications supply their own installation branding: `pushManifest(base, { name, shortName, icons, ... })` builds minimal same-scope installation metadata; serve it as a manifest and link it in the application HTML. On iOS/iPadOS the person must install the application on the home screen before subscribing.

## Send

```ts
await notifications.send({
  idempotencyKey: 'approval:123',
  messages: {
    webPush: {
      to: [{ id: deviceId, userId }],
      title: 'Approval requested',
      body: 'Review the purchase request.',
      url: '/main/approvals/123',
      dedupeKey: 'approval:123',
    },
  },
});
```

Only trusted server code sends notifications. Resolve devices through `webPushServiceToken.subscriptions.forUser(userId)`. URLs are application paths including the public base path; external origins and paths outside the application are rejected, and the worker validates again on click. `dedupeKey` becomes the browser notification tag, replacing a still-visible notification with the same key. The channel does not replace application event idempotency or a foreground reminder coordinator.

Applications that need permission rechecks or foreground takeover register `webPushServiceToken.beforeSend(name, hook)` during provider registration and send `beforeSend: { name, context }`. This context is private queue data and never sent to the browser. The hook executes for each attempt after reading the current enabled device; returning `false` accepts the delivery without submitting push. It can localize the generic fields and supply application-specific worker compatibility payload. A missing hook fails closed. Hooks must recheck business authorization and respect the queue abort signal.

## Device API

All endpoints under `/api/webPush` require native application authentication; owner identity is read from the session. API keys and other authentication types follow the host's authentication policy. Responses never contain endpoints, subscription keys or ciphertext.

| Method | Path                      | Result                                                            |
| ------ | ------------------------- | ----------------------------------------------------------------- |
| GET    | `/key`                    | Public VAPID key, or null when unavailable                        |
| GET    | `/subscriptions`          | Caller-owned device summaries                                     |
| POST   | `/subscriptions`          | Save `{name, locale, subscription:{endpoint,keys:{p256dh,auth}}}` |
| PATCH  | `/subscriptions/:id`      | Change `{enabled}` on an owned device                             |
| DELETE | `/subscriptions/:id`      | Remove an owned device                                            |
| POST   | `/subscriptions/:id/test` | Queue a test, limited to once per person per 30 seconds           |

Locale is `en-US` or `zh-CN`. Endpoints accept HTTPS services of Google, Mozilla, Apple and Windows only. Transport follows no redirects, encrypts the payload with the browser's keys and uses VAPID authentication. HTTP 404/410 removes the subscription; rate limits and server errors use the notification runtime's finite retries. Subscription ownership cannot be reassigned by registering an existing endpoint under another user.

## Existing applications

When extracting a previous implementation, stop all old processes before upgrading and preserve both VAPID and encryption keys. Use an application migration to decrypt old subscriptions with their original purpose/AAD, reencrypt into `webPushSubscriptions`, verify persisted values and only then drop the source collection. Do not copy ciphertext across purposes. This plugin does not own another application's data migration.

`defineWebPushPlugin(workerOptions)` and `<PushPreferences browser={browserOptions} />` allow preservation of existing worker cache, device identity and logout protocols. `createDeviceRoutes({path,operationPrefix,subscribed})` supports thin legacy API aliases. Preserve the original notification channel/provider configuration for queued deliveries: the notification runtime rejects attempts whose channel or provider type changed. New messages can use a separate channel; both use one subscription table.

## Cost and validation

No work is added to ordinary requests, polls, runner claims or heartbeats. Device list is one read; registration looks up the endpoint hash and writes one device; enable and removal each write only the caller-owned row. Delivery reads one device before optional application authorization. Expiry adds one delete. Test throttling is bounded, process-local memory; queue operations remain owned by the notification runtime.

Tests apply and reverse the schema on the selected test database, start a non-Studio application with native sign-up/sign-in and run subscription, device management and test delivery through the real notification queue. The HTTPS socket is substituted in this fixture; real browser vendor delivery and physical Android/iOS devices require separate release verification.
