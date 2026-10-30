# `@nocobase/realtime`

Realtime protocol, browser client and transport-independent server service. Import `@nocobase/realtime/client` in browsers and `@nocobase/realtime/server` on servers. The root entry remains browser-safe. NocoBase applications own the singleton service, URL resolution and lifecycle through `@nocobase/app-server/realtime` and `@nocobase/app-client`.

## Delivery contract

Events are transient invalidations. Reconnect does not replay missed events: read authoritative state through an authorized API after each successful subscription. Publishing resolves to `{ eventId, topic }` when the broker operation finishes; this is neither a durable receipt nor proof that a browser processed the event. Publication failures reject the promise. Business operations that already committed must handle these failures separately. Counts and diagnostics describe this service's local connections only.

The default `inMemory` broker isolates each service instance. Install and explicitly register the commercial `@nocobase/app-plugin-realtime-redis/server` plugin to use Redis Pub/Sub for multiple processes with the same namespace. A namespace alone does not connect memory brokers. Never suppress publication based on a local subscriber count: subscribers may be connected to another process. See [distributed delivery](docs/distributed.md).

## Server lifecycle and declared topics

```ts
import { createRealtimeService } from '@nocobase/realtime/server';

const realtime = createRealtimeService({ namespace: 'my-app' });
const clock = realtime.defineTopic<string, 'public'>('clock:now', {
  audience: 'public',
});
const changes = realtime.defineTopic<{ id: string }, 'public'>(
  'orders:changed',
  {
    audience: 'public',
    authenticated: true,
  },
);
const inbox = realtime.defineTopic<{ kind: 'changed' }, 'user'>(
  'inbox:changed',
  {
    audience: 'user',
  },
);
await realtime.setup();

await clock.publish(new Date().toISOString());
await changes.publish({ id: 'order-1' });
await inbox.publishFor('user-1', { kind: 'changed' });

clock.close();
changes.close();
inbox.close();
await realtime.close();
```

Declare topics during provider boot, before clients can subscribe. Unknown topics reject both subscription and publication. Public topics may explicitly require authentication; user topics always require it and derive their audience from the connection principal. Clients cannot publish or choose a user audience. A closed declaration cannot publish through a later declaration with the same name. Overlapping topic definitions fail at registration.

Payloads must be finite, acyclic JSON values with plain objects and dense arrays. Dates, `undefined`, functions, accessors, symbols and custom objects are rejected. The service snapshots and size-checks payloads before its first asynchronous boundary, including with zero subscribers. An optional `parsePayload` validates or converts a domain payload before this check.

## Resource authorization

```ts
const runs = realtime.defineTopicFamily<{ runId: string }, { changed: true }>(
  'agents:runs:{runId}',
  {
    audience: 'public',
    authenticated: true,
    authorize: async ({ principal, params, signal }) => {
      if (!principal) return false;
      return access.canReadRun(principal.userId, params.runId, signal);
    },
  },
);

const topic = runs.topic({ runId: 'run-1' });
await runs.publish({ runId: 'run-1' }, { changed: true });
runs.close();
```

Use the same access policy as the resource's HTTP API. Topic parameters occupy entire colon-separated segments and accept lowercase letters, digits and hyphens. Authorization runs before subscription and before each delivery, receives an abort signal, and has a bounded deadline. Unsubscribe, disconnect and declaration removal cancel pending subscription work. A revoked resource permission removes the subscription; it cannot keep receiving events because it was previously authorized. Payloads should contain the minimum information needed to refresh authorized API data.

## Adapting a transport

```ts
const connection = realtime.connect(socket, {
  principal: { userId: session.user.id, sessionId: session.id },
  validatePrincipal: async (signal) => sessions.isActive(session.id, signal),
});
await realtime.handleClientMessage(connection, incomingMessage);
realtime.disconnect(connection);
await realtime.disconnectUser(session.user.id);
```

A transport exposes `readyState`, `send`, `close` and optionally `bufferedAmount`. Adapters own origin checks, transport message limits and native ping/pong. The NocoBase adapter uses `@nocobase/app-websocket`, rejects other browser origins, preserves the original session identity, rechecks stored session state without cookie caching or extending expiry, and closes failed connections without recreating them on later messages. Idle authenticated connections are periodically checked too. A slow or failing socket cannot prevent other sockets from receiving an event.

Defaults: 10,000 local connections, 64 subscriptions including pending subscriptions per connection, 64 KiB messages, 1 MiB buffered output, 64 queued deliveries per connection, a 5 second authorization deadline and staggered idle session checks within about 30 seconds. Global authorization work is limited to 256 active callbacks and 2,048 queued callbacks; timed-out callbacks retain their slot until their underlying operation settles. Positive integer options on `createRealtimeService` can tighten these limits. `diagnostics()` exposes local queue and authorization occupancy, lifetime publication/delivery/failure/coalescing counters, authorization duration totals, duplicate counts and Broker state. It contains no user IDs or payloads. `flush()` waits for the current local delivery queues; use it in local tests or controlled shutdown coordination, never as a browser acknowledgement. Close is idempotent and cancels pending operations. Deliveries are ordered per subscription; a slow policy cannot block unrelated topics on the same connection. Topic declarations may opt into `delivery: 'latest'` for replaceable snapshots or invalidations. The default delivers every admitted event; keep it for logs, deltas and business events whose intermediate values matter.

## Browser subscription, errors and recovery

```ts
import { createRealtimeClient } from '@nocobase/realtime/client';

const realtime = createRealtimeClient({
  resolveUrl: () => '/main/ws',
  subscriptionTimeout: 10_000,
  pingInterval: 30_000,
  pongTimeout: 10_000,
});
const watch = realtime.watch<{ id: string }>('orders:changed', {
  onEvent: ({ payload }) => invalidateOrder(payload.id),
  onReady: () => refreshVisibleOrders(),
  onStateChange: (state) => showSubscriptionState(state),
  onError: (error) => reportSubscriptionError(error.code),
});

watch.retry(); // Explicit retry after a denied or timed-out subscription.
realtime.reconnect(); // Reopen with current cookies after an identity change.
watch.close();
realtime.close();
```

`connected` and `state` describe the transport. A watch becomes `subscribed` only after a matching acknowledgement. Other watch states are `pending`, `subscribing`, `error` and `closed`. `onReady` runs after every successful acknowledgement, including reconnects. An error on one topic does not prevent another topic's readiness callback. Global `ready` and `onReady` require all active topics to be acknowledged; do not make login depend on unrelated topic permissions. `onOpen` remains a transport-only notification.

Multiple watches of one topic share one server subscription. Closing a handle is idempotent; the last handle sends an unsubscribe. Request ids are unique across retries and reconnects, and late replies from old requests or old sockets are ignored. Events arriving before acknowledgement are ignored. Subscription acknowledgement timeouts cancel pending server work and expose a retriable error.

Reconnect uses bounded exponential backoff with jitter. Correlated application ping/pong detects half-open connections while visible; the Node adapter's native ping/pong also works when browser timers are suspended. Returning online or making a tab visible probes an open socket and reconnects only if it is unhealthy. Transient subscription timeouts and authorization service errors retry independently with jittered backoff, up to five retries by default. Configure `subscriptionRetries`, `subscriptionRetryInterval` and `subscriptionRetryMaxInterval`; explicit authentication and permission refusals require an identity change or manual `retry()`. Manual close removes recovery listeners and timers. `subscribe(topic, listener)` remains a compatibility shorthand that returns a cleanup function; use `watch` when readiness or per-topic errors matter. `active` means there are local watches, even while disconnected.

## React and query refresh

Application components reuse the host client. Use `enabled: false` or a null topic for an inactive page; do not create a client per component.

```tsx
import {
  useRealtimeTopic,
  useRealtimeRefresh,
  refreshRealtimeQueries,
  useRealtimeConnectionState,
} from '@nocobase/app-client';

function Orders({ visible }: { visible: boolean }) {
  const connection = useRealtimeConnectionState();
  useRealtimeRefresh(
    'orders:changed',
    (signal) =>
      refreshRealtimeQueries(queryClient, { queryKey: ['orders'] }, signal),
    { enabled: visible, delayMs: 100 },
  );
  return <OrdersTable connection={connection} />;
}

function Run({ runId }: { runId: string | null }) {
  useRealtimeTopic(
    runId ? `agents:runs:${runId}` : null,
    ({ payload }) => {
      applyRunInvalidation(payload);
    },
    { onReady: () => refreshRun() },
  );
  return <RunDetails />;
}
```

The hooks keep callbacks current without resubscribing on each render and release subscriptions on cleanup. `useRealtimeRefresh` coalesces bursts, pauses hidden documents, and preserves one follow-up refresh when events arrive during an in-flight request. It aborts its signal only on cleanup. Return the refresh promise so the scheduler can observe completion. For non-React code, `createRealtimeRefresh` from `@nocobase/app-client` offers the same scheduler with `request()`, `retry()`, `snapshot` and `close()`. Failed reads remain stale and retry transient failures up to three times by default, with `retries`, `retryDelayMs`, `retryMaxDelayMs` and `shouldRetry` overrides. HTTP refusals such as 401 and 403 stop automatic retries; forbidden query snapshots are cleared. After exhaustion, new events preserve the stale state; explicit `retry()`, subscription readiness, or a foreground/online recovery for transient errors starts a new attempt. The hook returns `status`, `stale`, `failures`, `error`, `lastSuccessfulRefresh` and `retry()`. Handle transport failures separately through `onSubscriptionError` and `onSubscriptionStateChange`; `onError` describes snapshot reads.

## Migration checklist

- Register every static topic and dynamic topic family before accepting subscriptions. Remove permissive fallback subscriptions.
- Await `publish`, `publishFor`, `disconnectUser` and service shutdown. Catch asynchronous publication failures at the business boundary or attach an explicit rejection handler to best-effort announcements.
- Replace publication `subscriberCount` with a receipt's `eventId`; use local diagnostics only for local observation.
- Recover cached data from a watch's `onReady`, and keep transport `onOpen` only for transport or identity lifecycle work.
- Reconnect after sign-in, sign-out or session replacement. Do not reuse the former account's socket or caches.
- Update transport/test doubles to return publication promises and emit correlated subscription acknowledgements.

## Integration Skill and polling inventory

The package includes `skills/nocobase-realtime/SKILL.md`. Applications with a direct dependency receive it through `pnpm nocobase skills sync`. See [polling and reconciliation](docs/polling.md) for the consumer inventory and retained polling boundaries.
