---
name: nocobase-app-plugin-notification-web-push
description: Integrate encrypted browser push subscriptions and the Web Push notification channel in a NocoBase 3 application.
---

# Web Push integration

Read this package's README before integration. Register its server plugin after authentication, authorization and notification, and its client factory for localized device preferences. Add `pushConfig` under `push` to application default configuration and configure `notification.channels.webPush.provider` as `web-push`. Mount the exported `PushPreferences` on an authenticated preferences page and call `unsubscribeDevice` during sign-out. Provide HTTPS, persistent VAPID and secrets keys, and application-owned installation metadata using `pushManifest` where installation is needed.

Send `title/body/url/dedupeKey` with explicit device and user recipients using the existing notification service. URLs include the application's public base path. Business authorization and foreground takeover belong to the application; use the optional named `beforeSend` hook on every attempt and never put business state into the generic channel. A missing named hook refuses delivery.

The device API is fixed at `/api/webPush`; browser storage and logout use the framework defaults. `defineWebPushPlugin({ title, icon })` accepts application branding, and the worker remains at `<publicBasePath>/push-worker.js`. Register named `afterSubscribe` hooks on the service for application initialization after a device is saved; do not mount aliases or customize browser protocols.
