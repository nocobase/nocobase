# Distributed delivery and operations

Memory is the default, isolated to one service and needs no infrastructure. Redis Pub/Sub is provided by the commercial `@nocobase/app-plugin-realtime-redis`, not by the core realtime package. Install a compatible cohort and explicitly add the default export from `@nocobase/app-plugin-realtime-redis/server` to the application's existing Server plugin list. Installation or Skill sync alone does not enable it.

```yaml
realtime:
  adapter: redis
  namespace: orders-production
  redis:
    connection:
      host: 127.0.0.1
      port: 6379
    setupTimeoutMs: 5000
```

The configuration paths and namespace default (app.name, otherwise `default`) are unchanged. Unselected Redis configuration does not require the plugin or open connections. An explicitly selected unknown or unregistered adapter fails startup; a connection failure never falls back to Memory. Config check is not a network or plugin-enablement check. Server registration does not automatically contribute a configuration factory or environment mappings.

Standalone consumers keep the core service and change only the factory import:

```ts
import { createRealtimeService } from '@nocobase/realtime/server';
import { createRedisRealtimeBroker } from '@nocobase/app-plugin-realtime-redis/broker';

const namespace = 'orders-production';
const realtime = createRealtimeService({
  namespace,
  broker: createRedisRealtimeBroker({
    namespace,
    connection: { host: '127.0.0.1', port: 6379 },
  }),
});
await realtime.setup();
// Declare topics, publish, and recover authoritative data through authorized APIs.
await realtime.close();
```

## Ownership and extension contracts

The application owns Providers, the core RealtimeProvider owns the original realtimeServiceToken, the service owns one broker, and the broker owns its connections. Commercial factories register during register, before any service resolution, and construct lazy brokers. Core start drives setup; commercial shutdown does not close host resources. Custom WebSocket applications must explicitly compose the core Provider and transport adaptation. Each Application has its own registry; duplicate, late and repeated selections fail. Business plugins keep using the original service Token and declare topics during boot.

## Admission, security and recovery

All replicas use the same Redis endpoint and namespace. Channel remains `nocobase:realtime:${namespace}` with unchanged event/control envelopes. Different logical Redis DB numbers do not isolate Pub/Sub. Namespace is not a security boundary against holders of the same credentials; use Redis channel ACLs and network isolation. Each receiving instance authorizes its local subscribers; publish even with zero local subscribers.

A successful publish means Redis admission, not browser delivery. Offline queues and automatic resend of ambiguous commands are disabled. A timeout may occur after Redis executed the original publish; do not blindly retry. Pub/Sub has no durable replay, permanent deduplication, exactly-once delivery or global ordering. Persist business intent in the domain's own outbox/job and read authoritative snapshots on subscription readiness.

After acknowledged Redis recovery, the core sends resync; current clients reconnect, reauthorize and run onReady for API catch-up. Old browsers need periodic reconciliation or reload. disconnectUser/disconnectSession close local connections first and broadcast namespaced controls; returned counts are local only. Broadcast failure can reject after local closure. Persisted session state and idle/delivery validation recover missed controls.

## Verification and rollout

Core tests retain Memory, authorization, backpressure, deduplication and generic broker recovery/control contracts. Redis implementation tests belong to the commercial package. Its required integration command must fail without an isolated Redis port; optional skipped cases are not acceptance evidence. Same-process services, real multi-process sockets, authenticated browsers and external production artifacts are separate verification levels.

Release in order: additive OSS API retaining the old factory, compatible commercial package and application registration, then final OSS removal. Final-removal worktree changes are not authorization to release. Resolve real published peer floors before promotion. Roll back OSS, commercial package, application lockfile, Server composition and configuration as one cohort. Memory and Redis nodes do not communicate; never use mixed Memory replicas as fallback. Standalone Redis is the initial supported topology; Cluster/Sentinel failover and production capacity require separate validation.
