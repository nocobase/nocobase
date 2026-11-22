---
'@nocobase/app-plugin-notification': minor
'@nocobase/app-plugin-notification-in-app': minor
'@nocobase/app-plugin-notification-providers': minor
'@nocobase/app-plugin-notification-web-push': minor
'@nocobase/app-plugin-projects': minor
'@nocobase/app-plugin-notification-example': minor
'@nocobase/app-plugin-foundation': patch
'@nocobase/app-skills': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
---

Notify people instead of channels. Notification templates become notification kinds that declare a policy per channel type (`required`, `on` or `off`), and the notification service gains `notify(kind, { to: userIds, data, target, source, idempotencyKey })`, which applies each person's choices, reaches them through every channel type that can (in-app by user, email by account address, web-push by enabled device) and makes one ordinary `send()`; `send()` and `sendTransient()` are unchanged. Each person chooses channels per kind in the new `notificationPreferences` table through `GET`/`PUT /api/notifications/preferences`; required channels cannot be turned off. In-app items record their kind, category and source, and the inbox list filters by `category`. The plugins now own every notification page: the in-app client plugin registers the `/inbox` page and the header's inbox button with a pending-or-unread badge and exports inbox entry renderers and pending sources as extension points, replacing `NotificationInAppInbox` and `NotificationInAppProvider`; the notification client plugin registers System settings › Messages › Notifications (channels with a test send to yourself, kinds, and a filterable delivery log with retry) and Personal settings › Messages › Notifications, with channel type displays and personal sections as extension points, and web-push adds its devices section. The settings pages and their API check the new `notification` settings item (`read`, `manage`) instead of `page:notification.templates` and `page:notification.logs`, and `/api/notifications/templates` is replaced by `/api/notifications/kinds`. Projects and the notification example send with `notify()`; Projects drops its `inboxChannel` option. Both templates drop their copied inbox and notification template pages and only register the plugins, and Examples registers web-push with a sample channel.
