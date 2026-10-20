# Server integration

Resolve `realtimeServiceToken` from `@nocobase/app-server/realtime` in the provider. The application owns setup and shutdown. Declare handles in `boot()` before clients subscribe; close the handles in the provider's shutdown. Standalone services use `createRealtimeService` from `@nocobase/realtime/server` and own its lifecycle explicitly.

```ts
const changes = realtime.defineTopic<{ id: string; revision: number }, 'user'>(
  'orders:changed',
  { audience: 'user' },
);
// Publish this after the order transaction commits.
await changes.publishFor(ownerId, { id: order.id, revision: order.revision });
```

If clients use changed IDs to selectively refresh several records, keep the default `delivery: 'all'`: replacing one ID with another would lose an invalidation. `latest` is suitable for whole-list invalidations or successive complete snapshots of one record, not per-record deltas, increments, log entries or intermediate transitions with independent meaning.

For a shared resource, use `defineTopicFamily<Params, Payload>('orders:{orderId}', { audience: 'public', authenticated: true, authorize })`. Public describes routing, not access permission. The callback receives `{ principal, params, topic, signal }`; reject anonymous callers and use the same policy as the snapshot endpoint. Topic parameter segments accept lowercase letters, digits and hyphens. The family handle formats the topic and publishes with validated parameters. Authorization failures remove a subscription; a later grant requires an explicit retry or new subscription.

Payloads are finite plain JSON, snapshotted before publication yields. Use ISO date strings. Validate domain shape with `parsePayload` when useful. Client publication is forbidden. Authentication is checked before subscription, on delivery and during idle session checks; account replacement still closes the old client and clears its caches.

## Committed notifications

A transaction owns its state change. Announce through its after-commit mechanism, or after the awaited transaction has returned. Do not publish from inside a transaction that can roll back. An empty result, cancellation, failure or retry can still change visible task state and needs its own announcement. Catch best-effort publication failures without converting committed business success into an HTTP failure. If delivery retry is required, persist an outbox/job with the state and let its owner retry idempotently.

## Distributed deployment

The default memory broker is local to one service. For several processes, configure `realtime.adapter: redis`, a stable application `namespace`, and private `redis.connection` options. Standalone consumers inject `createRedisRealtimeBroker({ namespace, connection, onError })`. Match namespace and Redis endpoint across the application's instances; isolate other applications with separate namespaces. Configure Redis credentials privately. Pub/Sub does not provide durable replay.

The Redis adapter waits for subscription acknowledgement before readiness, rejects publications while unready and disables ambiguous automatic resend. After broker recovery it sends `resync`; current clients reconnect with jitter, reauthorize and run topic readiness callbacks. `disconnectUser` and `disconnectSession` broadcast revocations, return the local count, and reject a failed broadcast after local closure. Persisted session validity remains authoritative if the control message is missed.

Deliveries are ordered per subscription and isolated from other topics. Global authorization limits include callbacks that ignore cancellation; a timed-out callback keeps capacity until it actually settles. `diagnostics()` reports queues, authorization occupancy/failures/timeouts/duration, publication/delivery/duplicate/coalescing counts and broker state without record contents. `flush()` waits only for the current local queues, useful in tests, and never proves remote delivery. Check the package README for the exact limit defaults and adapter contract.
