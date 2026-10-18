# @nocobase/app-plugin-realtime-example

An interactive guide to acknowledged subscriptions, resource authorization, React hooks and connection recovery. It uses the application's real WebSocket connection and authenticated HTTP APIs.

## Open the examples

The examples application registers both the Server and Client exports. Start it with `pnpm --filter @nocobase/app-template-examples dev`, open the application entry URL printed as `Local:`, sign in, and select **Realtime examples** in the sidebar (`/realtime-example`, beneath any application base path). English and Chinese are supported.

The original public clock at `/realtime` is also available without signing in. It is a small native WebSocket protocol example; the interactive page demonstrates the application client and React hooks.

For another application, register the exports explicitly in its respective `server/plugins.ts` and `client/plugins.ts` composition roots:

```ts
// Server registration, alongside the application's authentication plugin.
import realtimeExample from '@nocobase/app-plugin-realtime-example/server';
// Add realtimeExample() to defineServerPlugins([...]).
```

```ts
// Client registration, alongside the application's authentication plugin.
import realtimeExample from '@nocobase/app-plugin-realtime-example/client';
// Add realtimeExample() to defineClientPlugins([...]).
```

## Walk through every scenario

| Scenario                               | Steps                                                                                                                                                              | Observable result                                                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public topic and `useRealtimeTopic`    | Watch the clock, pause its subscription, then resume.                                                                                                              | Server time and event count advance only while this card subscribes. Resume obtains another acknowledgement.                                                                                     |
| Personal events and `publishFor`       | Open two tabs signed in to the same account and send a personal event. Also open a separate browser profile signed in as another account.                          | Both tabs of the sender receive it; the other account does not. Each account reads its own snapshot. The publication receipt identifies the accepted event.                                      |
| Dynamic topic family and authorization | The room initially rejects its watch with `FORBIDDEN`. Grant access, retry the subscription, publish a room change, then revoke access in the confirmation dialog. | Granting changes the server policy; retry obtains an acknowledgement. Revocation rechecks existing subscriptions and clears the protected snapshot. Grant and retry again to resume.             |
| `useRealtimeRefresh` coalescing        | After the initial read finishes, publish five changes. Compare the increases in events received and completed snapshot reads.                                      | Five invalidations normally produce one debounced read. The snapshot comes from HTTP, never from the publish response. Timing, visibility and concurrent changes can affect the number of reads. |
| Pause and catch up                     | Pause live refresh, publish another five changes, then resume.                                                                                                     | The independent event observer continues counting, while the displayed snapshot stays unchanged. Resume reads the latest snapshot through the acknowledged subscription.                         |
| Hidden-tab recovery                    | Leave this page in a background tab and publish from a second tab of the same account. Return to the first tab.                                                    | Refresh waits while hidden and fetches current state when visible again. Missed event payloads are not replayed.                                                                                 |
| Per-topic failure                      | Try the unknown topic, then send a personal event or publish counter changes.                                                                                      | `TOPIC_NOT_FOUND` appears for the deliberately undeclared topic. Permitted topics continue receiving events and executing their own `onReady` callbacks.                                         |
| Automatic connection recovery          | Click **Simulate disconnect**.                                                                                                                                     | The server disconnects this account's local sockets, including its other tabs. Connection history records recovery; subscriptions are acknowledged again and snapshots are refetched.            |
| Manual reconnect                       | Click **Reconnect** in the page header.                                                                                                                            | The shared application connection reopens, affecting all watches in this tab. Active snapshot watchers catch up independently. A paused refresh stays paused until explicitly resumed.           |
| Cleanup and account changes            | Pause the clock, leave the page, sign out, or switch accounts.                                                                                                     | The owning hooks close their watches and abort pending reads. Session changes unmount the demonstration so the previous account's snapshots cannot remain visible.                               |

An open socket is not the same as an acknowledged subscription. The room and unknown-topic examples deliberately reject subscriptions, so aggregate `client.ready` can remain false while permitted topics work. Use a topic's `onReady` for its initial read and recovery, as the personal and room cards do.

## Data and access boundaries

Each authenticated account owns a personal counter, a refresh counter and a randomly identified room. HTTP requests derive the owner from the session; callers cannot provide an arbitrary recipient or topic. The room's HTTP reads and event delivery share an owner-and-access check. Revocation publishes an internal invalidation to force existing subscribers through that check immediately. A read started before revocation cannot restore the cleared snapshot when it finishes late.

All demo state is local to one process, expires after one hour without activity, and resets on restart. At most 1,000 accounts have active demo state. An expired room offers **Reload demonstration**; a full demo offers a retry. No business records are modified and no migrations are required. These are transient notifications with snapshot recovery, not durable event storage or replay. Redis and cross-process delivery are outside this example's current scope.

The page requires authentication and intentionally skips business permission resources because its data and actions are scoped to the current account. The `/realtimeExample/*` API contribution owns its authentication middleware. The legacy `/realtime` page and `clock:now` topic are explicitly public.

## Read the implementation

| Source                                   | Responsibility                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `server/demo-service.ts`                 | Typed personal topics, topic family, shared room policy, bounded snapshots and account disconnects |
| `server/providers/realtime-example.ts`   | Topic registration, clock publisher lifecycle and shutdown cleanup                                 |
| `server/routes/api.ts` and `schemas.ts`  | Authenticated endpoints, validated inputs, standard responses and OpenAPI declarations             |
| `client/components/topic-examples.tsx`   | `useRealtimeTopic`, personal `watch`, `onReady`, receipts and expected subscription errors         |
| `client/components/room-example.tsx`     | Grant, explicit `retry()`, revoke confirmation and stale-read protection                           |
| `client/components/refresh-example.tsx`  | `useRealtimeRefresh`, coalescing, pause and catch-up                                               |
| `client/components/recovery-example.tsx` | Connection state history and server-triggered disconnect                                           |
| `client/hooks/demo.ts`                   | Owned watch cleanup, cancellable snapshot reads and action feedback                                |
| `tests/`                                 | Delivery isolation, authorization, production API contracts and interactive client recovery tests  |

## Validate

```bash
pnpm --filter @nocobase/app-plugin-realtime-example check
```
