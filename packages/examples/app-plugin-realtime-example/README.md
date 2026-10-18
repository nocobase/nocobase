# @nocobase/app-plugin-realtime-example

Three connected business workflows demonstrate where realtime updates help: collaborating on assigned tasks, following personal notifications, and downloading background task exports. A separate capability lab explains the underlying subscription, authorization and recovery APIs.

## Open the examples

The examples application registers both the Server and Client exports. Start it with `pnpm --filter @nocobase/app-template-examples dev`, open the application entry URL printed as `Local:`, sign in, and select **Realtime examples** in the sidebar (`/realtime-example`, beneath any application base path). English and Chinese are supported.

The default route opens **Tasks**. The **Inbox**, **Exports**, and **Capability lab** views have their own URLs under `/realtime-example`, so links, refresh and browser history retain the selected view.

## Try the business workflows

| Scenario              | Try it                                                                                                                                                                                                                                                                                                 | What changes live                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task collaboration    | Open Tasks in two windows. Create “Review the customer renewal quote”, describe the work, and assign it to yourself. Start it in the second window, then complete it. For collaboration between people, assign it to another active account and sign in as that account in a separate browser profile. | Both participants' boards follow creation and status changes. Details open over the current board. A reassigned former assignee loses access and their view refetches without receiving task contents in an event.                                    |
| Personal inbox        | Create a task assigned to yourself, open Inbox in two windows, then mark its notification read or unread. For cross-user updates, have the assignee change the status: the other participants receive a notification.                                                                                  | A real, durable notification arrives through the existing notification module. Read status changes in both windows. Clicking a task notification opens its details over the inbox. The inbox includes all of the account's application notifications. |
| Background CSV export | Create several tasks, open Exports and click Export tasks. Leave the page and return, or follow the same export in a second window. Download the completed file and open it in a spreadsheet.                                                                                                          | A real background job reads the requester's permitted tasks, encodes CSV in batches and saves progress and the file. Only the owner can list or download the result. Small exports may complete immediately; no timer stretches the progress.         |

Tasks and notifications are normal application records, not disposable counters. The board reuses the notification example's task API and its creator-or-assignee policy. The task HTTP API remains authoritative after every invalidation, subscription acknowledgement, reconnection and visibility change. Status changes submit only the status field, preserving unrelated changes.

Exports are snapshots of the tasks visible to their requester at generation time. A completed snapshot stays owned by that requester even if a task is subsequently reassigned. Up to 5,000 rows are supported; larger exports fail explicitly. The latest 20 export records and files are retained, with files stored in the example's database table. Quoting handles commas, quotes and multiline descriptions, and spreadsheet formula prefixes are neutralized. Failed exports can be submitted again. Interrupted jobs and an export recorded immediately before a process crash are recovered on startup; completed files survive restarts. This example targets one application process with the default jobs backend; cross-process realtime delivery and coordinated export execution are not demonstrated.

The original public clock at `/realtime` is also available without signing in. It is a small native WebSocket protocol example; the interactive page demonstrates the application client and React hooks.

For another application, first register authentication, the notification core, in-app notifications and the notification task example on the Server, and their corresponding Client plugins. This plugin uses their public APIs and requires the application's database and jobs runtimes. Then register the exports explicitly in its respective `server/plugins.ts` and `client/plugins.ts` composition roots:

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

## Walk through the capability lab

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

## Capability lab data and access boundaries

Each authenticated account owns a personal counter, a refresh counter and a randomly identified room. HTTP requests derive the owner from the session; callers cannot provide an arbitrary recipient or topic. The room's HTTP reads and event delivery share an owner-and-access check. Revocation publishes an internal invalidation to force existing subscribers through that check immediately. A read started before revocation cannot restore the cleared snapshot when it finishes late.

All capability lab state is local to one process, expires after one hour without activity, and resets on restart. At most 1,000 accounts have active demo state. An expired room offers **Reload demonstration**; a full demo offers a retry. The capability lab does not modify business records. The business export scenario separately installs the `realtimeExampleExports` migration and modifies real task and notification data through their owning plugins. Realtime events are transient invalidations with HTTP snapshot recovery; task records, inbox messages and export files are persisted separately. Redis and cross-process delivery are outside this example's current scope.

Every page requires authentication and intentionally skips page permission resources. Business APIs independently enforce task participation or current-account ownership; the capability lab is scoped to the current account. The `/realtimeExample/*` API contribution owns its authentication middleware. The legacy `/realtime` page and `clock:now` topic are explicitly public.

## Read the business implementation

| Source                                                                       | Responsibility                                                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `client/pages/business/tasks.tsx`, `task-create.tsx`, `task-detail.tsx`      | URL-addressable board, create form and detail drawer over the task API             |
| `client/pages/business/inbox.tsx`                                            | Reuses the in-app notification package's public query, mutation and refresh hooks  |
| `client/pages/business/exports.tsx`                                          | Follows durable export history and downloads an authorized CSV                     |
| `client/pages/business/use-business-data.ts`                                 | Authoritative reads, stale-request cancellation and `useRealtimeRefresh`           |
| `server/export-service.ts`, `providers/task-exports.ts`, `routes/exports.ts` | Real jobs, persistent progress/results, owner-only endpoints and OpenAPI contracts |
| `database/migrations/202610180001_create_realtime_example_exports.ts`        | Export persistence and the active-user uniqueness constraint                       |
| `@nocobase/app-plugin-notification-example/realtime`                         | Public task invalidation topic and task types                                      |
| `@nocobase/app-plugin-notification-example/server`                           | Owner-filtered task snapshot contract used by the export job                       |

## Read the capability lab implementation

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
