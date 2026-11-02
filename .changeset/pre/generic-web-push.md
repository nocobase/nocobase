---
'@nocobase/app-plugin-notification-web-push': minor
---

Add a reusable Web Push notification channel with encrypted owner-bound device subscriptions, persistent VAPID configuration, scoped notification worker, device preferences and test notifications. Reuse notification queue retries and remove expired devices. The plugin uses fixed `/api/webPush` endpoints and framework browser conventions, with branding options and named service hooks for authorization, foreground takeover and subscription initialization.

Accept application language identifiers with English fallback, retain device enablement on renewed subscriptions, and return standard device API responses. Validate scoped click URLs and reject serialized payloads above 3993 UTF-8 bytes before queueing, reserving encryption overhead within 4096 bytes.
