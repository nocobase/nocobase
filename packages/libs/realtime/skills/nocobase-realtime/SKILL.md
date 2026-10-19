---
name: nocobase-realtime
description: Design and implement live updates in NocoBase 3 applications and plugins using @nocobase/realtime, host client hooks and authorized server topics. Use for replacing business polling, snapshot recovery, task progress, personal notifications, streamed logs or multi-process fan-out. Not for OpenAI audio Realtime APIs.
---

# NocoBase Realtime

Use the installed package declarations as the API authority. Applications reuse the host server service through `realtimeServiceToken` from `@nocobase/app-server/realtime` and the host browser client through `@nocobase/app-client`. Do not create a socket or service per component. In a source workspace, this Skill lives under `packages/libs/realtime/skills/nocobase-realtime`; in generated applications, package Skills are synchronized copies.

## Choose the data contract first

Identify the authoritative snapshot endpoint, its access policy, the committed writes that announce changes, and how a disconnected client catches up. Realtime events are transient hints; durable business data remains in its owning service. A successful publication means broker admission, not browser processing. Prefer small invalidations containing a record ID or revision over copying protected record contents into an event.

- Read [server integration](references/server.md) for topic declaration, resource authorization, transaction boundaries, limits and distributed deployment.
- Read [client integration](references/client.md) for query correctness, coalesced refresh, readiness, errors, manual retry and cleanup.
- Read [business scenarios](references/scenarios.md) when choosing between snapshots, cursors, progress and periodic reconciliation.
- Read [verification](references/testing.md) for meaningful acceptance cases and adapter recovery tests.

## Boundaries to preserve

Register topics during provider boot and release them during shutdown. Unknown topics are denied. A user topic derives the subscriber's user from the authenticated connection; publishing uses the intended recipient, never a user ID supplied as subscription authority by the browser. Resource families reuse the HTTP endpoint's policy and recheck it on delivery.

Publish only after commit. Treat a notification failure separately from an already successful write; use the domain's durable job/outbox when announcements must be retried. Never skip distributed publication because this process has no subscribers. `eventId` supports tracing and bounded duplicate suppression; business revisions and persisted cursors own ordering and gap recovery.

Read snapshots after the topic's `onReady`, including initial subscription and reconnect. Transport `onOpen` is too early. For TanStack Query use `refreshRealtimeQueries`, which waits for pre-event reads and follows them with a new read. Return the actual refresh promise to the scheduler so failures and trailing events are observed.

Remove a poll only after identifying all its producers and failure recovery. Time-based expiry, external systems without announcements, bounded initialization waits and failed best-effort publication can still require reconciliation. A healthy WebSocket alone does not prove the snapshot is fresh.
