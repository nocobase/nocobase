---
"@nocobase/realtime": minor
"@nocobase/app-server": minor
---

Isolate delivery queues by subscription, bound global authorization work and expose delivery, authorization and broker diagnostics. Publish receipts now describe broker admission; `flush()` observes current local queues without claiming remote delivery. Add optional latest-snapshot coalescing, bounded event deduplication and event IDs for tracing.

Add an optional Redis Pub/Sub broker with namespace isolation, distributed user/session revocation and resubscription recovery. Broker recovery requests fresh client subscriptions and authoritative snapshots. Redis publication is never retried automatically after an ambiguous result; applications remain responsible for durable state, cursors and outbox retry.
