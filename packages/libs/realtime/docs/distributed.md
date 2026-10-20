# Distributed delivery and operations

The memory adapter is the default and has no infrastructure requirement. Redis Pub/Sub provides cross-process transient fan-out; it does not add durable replay. Every process registers its own topic policies and authorizes its local subscribers. A worker can publish with no local subscribers. All instances of one application use the same namespace and Redis endpoint; different applications use different namespaces.

```ts
import {
  createRealtimeService,
  createRedisRealtimeBroker,
} from '@nocobase/realtime/server';

const namespace = 'orders-production';
const realtime = createRealtimeService({
  namespace,
  broker: createRedisRealtimeBroker({
    namespace,
    connection: { host: '127.0.0.1', port: 6379 },
    onError: (error) => logger.error({ err: error }, 'Realtime Redis failed.'),
  }),
});
await realtime.setup();
```

NocoBase applications can select the adapter through server configuration:

```yaml
realtime:
  adapter: redis
  namespace: orders-production
  redis:
    connection:
      host: 127.0.0.1
      port: 6379
  limits:
    maxConcurrentAuthorizations: 256
    maxPendingAuthorizations: 2048
```

Keep Redis credentials in private server configuration. A namespace separates application channels, but is not a security boundary against a party that holds the same Redis credentials. Apply Redis ACLs and network isolation in the deployment that owns Redis.

## Admission, ordering and recovery

`publish()` resolves after broker admission, independently of local delivery authorization or browser processing. A Redis error can be ambiguous: the event may have been published before the reply was lost. Offline command queuing and automatic resend are disabled. Retry a durable business operation through its own idempotent outbox/job, and reconcile persisted state on subscription readiness or a suitable fallback interval.

Local deliveries preserve order per subscription. There is no global business order across publishers. Events expose an `eventId` for tracing and bounded deduplication (10,000 recent IDs per service by default); that cache is neither persistent history nor a sequence. Ordered logs require a persisted cursor; snapshots may carry a business revision. `delivery: 'latest'` replaces only a waiting snapshot in one subscription. It is opt-in and unsuitable for increments, log entries or intermediate transitions that must be observed.

Two Redis connections separate publication from subscription. The adapter becomes ready only after the subscriber has acknowledged its channel and the publisher is ready. After either connection recovers, existing browser sockets receive `resync`; the client reconnects with jitter, reauthorizes its topics and runs each watch's `onReady`. Read an authoritative snapshot there, even if the browser socket itself never appeared offline. Older clients that do not understand `resync` still need periodic reconciliation during a rolling upgrade.

`disconnectUser()` and `disconnectSession()` immediately close matching local connections and broadcast a namespaced control message. Their returned count is local only. A failed broadcast rejects after local revocation; persisted session state and delivery/idle revalidation remain authoritative. Missed controls during a Redis outage are therefore recovered through session validation, not a claim of reliable Pub/Sub delivery.

## Diagnostics and limits

`diagnostics()` reports current connections, subscriptions, pending subscriptions, delivery queues, active/waiting authorizations and broker state. Lifetime counters cover admitted publications, publication failures, received/delivered events, duplicates, coalesced snapshots, authorization failures/timeouts and total authorization time. Delivered means the local transport accepted `send()`, not that a user saw the event. Metrics carry no identities or record contents.

Tune limits against actual workload. Authorization callbacks should honor their abort signal; callbacks that ignore it retain capacity until they settle, preventing unbounded database work after timeouts. A saturated gate returns `AUTHORIZATION_BUSY`, which the client treats as transient. Excess connection buffers or pending deliveries disconnect that connection so its next subscription can recover from the API.

## Reproducible checks

The ordinary package test suite covers slow-topic isolation, same-topic ordering, cancellation, authorization saturation, denied deliveries, bounded backlogs, latest-snapshot coalescing and browser resynchronization. Run the optional real-Redis cases against an isolated local Redis instance:

```bash
REALTIME_TEST_REDIS_PORT=6379 pnpm --filter @nocobase/realtime test
```

These tests use two services to verify cross-process-style fan-out, zero local subscribers, namespace isolation, duplicate IDs, user/session revocation and acknowledged resubscription after a killed Redis subscription connection. They are deterministic functional checks, not a production throughput benchmark. Redis Cluster/Sentinel topology failover and production capacity still need validation in the deployment that uses them.
