---
"@nocobase/app-plugin-web-push": minor
---

Add a reusable Web Push notification channel with encrypted owner-bound device subscriptions, persistent VAPID configuration, scoped notification worker, device preferences and test notifications. Reuse notification queue retries and remove expired devices. Applications extracting an existing implementation must preserve keys, worker identity and queued channel/provider identities, and migrate encrypted subscriptions with verification before dropping their old collection.
