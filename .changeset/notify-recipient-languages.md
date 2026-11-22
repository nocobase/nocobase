---
'@nocobase/app-plugin-users': minor
'@nocobase/app-plugin-notification': minor
'@nocobase/app-plugin-notification-web-push': patch
---

`notify()` writes to each person in the language they chose, as one send: the users plugin tells the notification plugin each person's language through the new `notificationUserLocalesToken`, and the user preferences service gains `getForUsers(userIds, key)`. A repeated `notify()` call returns the first send only when it is the same request (kind, people, data, target and source); another request under the same idempotency key, including a direct `send()`, fails with `IDEMPOTENCY_KEY_CONFLICT`. Channels can name the key the delivery log files a recipient under with `recipientKey()`, and web-push files each push under its device, so the delivery log finds every device's push. Saving the same personal notification choice from two places at once no longer fails.
