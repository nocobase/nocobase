---
"@nocobase/lifecycle": minor
"@nocobase/app-plugin-lifecycle-example": patch
---

Add committed record-change notifications for effect and continuation updates, a cancellable snapshot refresh API, and event-driven Lifecycle examples with serialized retries and periodic reconciliation. Preserve existing transition events and the React hook's default polling interval while allowing slow reads to finish. Keep effect cancellation active while asynchronous change notifications are pending.
