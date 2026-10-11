# Server synchronization events through the application queue

## Public contract

Resolve `mailServiceToken` from `@nocobase/app-plugin-mail/server`. `MailService.onMessagesSynced(listener)` registers a queue handler and returns an idempotent asynchronous `MailUnsubscribe`. `MailMessagesSyncedEvent` contains `eventId`, `accountId`, `ownerId`, `syncRunId`, `phase` (`history`, `catchUp`, or `incremental`), local `syncedAt` (RFC 3339), and 1–100 local `messageIds`. These IDs work with `getMessage()` and `getManagedMessage()`; they are not Provider IDs or globally unique logical-mail identities. The event and its ID array are immutable snapshots.

A new message means a record first inserted locally by synchronization, not necessarily mail just delivered to an inbox. History, sent mail and remote drafts can all appear. Updates, deletes, folder-only removals, skipped/protected drafts, duplicate Provider input and inserts deleted in the same transaction do not generate insertion events. Send confirmation, draft writes and content retries do not generate these events. A nonempty page publishes after its own transaction commits, without waiting for the whole run; later run failure does not retract committed pages. Ordinary Mail messages, folder relations, sync revision, lease checks, cursors and the existing synchronization task outbox retain their transaction boundaries. Event snapshots are returned from that transaction but are not stored in it.

There are **no Mail event-log or event-sequence tables, incremental event-read methods, or event checkpoints**. The plugin uses the application's `queueServiceToken`, not a privately constructed queue. The internal queue is `mail/message-sync` and its channel is `messages.synced`; applications use the public subscription rather than publishing directly to these implementation names. The normal application composition must include `QueueServiceProvider` from `@nocobase/app-server/queue`. Mail does not set up or shut down the shared backend.

Events use the application queue's default configuration; `mail.jobs` still chooses the synchronization/sending executor and does not choose the event backend. Configure the queue default's adapter, retry and retention settings through the normal application queue configuration.

## Delivery, retries and limits

Mail awaits queue acceptance after commit, not handler completion. The queue awaits each asynchronous listener; a thrown or rejected handler is safely logged and fails the queue job for its configured retry policy. The default queue configuration makes only one attempt, so an application that needs retries must configure them on its selected backend. Handler errors are not synchronization failures and never retry the committed mailbox page. Publication failures are safely logged and do not retry synchronization either.

Multiple handlers registered on one worker receive the same event. Redis workers **compete for jobs; this is not a broadcast to every application instance**. The queue may retry the complete job and invoke a handler that already succeeded again. Keep effects idempotent, for example on `(activityType, accountId, localMessageId)`, and preserve failures until work is durably submitted or complete. `eventId` is the stable job ID for retries of that publication; it is not a global logical-mail identity or an exactly-once guarantee. Jobs may run concurrently or out of order. Late registrations do not replay already completed jobs.

Persistence, retry counts, backoff, completed/failed retention and shutdown recovery belong to the selected queue backend. Redis provides backend-managed persistence subject to its Redis configuration. `inMemory` uses process memory and queue state files saved on clean shutdown; hard termination can lose work accepted since startup. Pending jobs can remain queued when no handler is registered. Configure backend resources and retention for the application's load; removal of a Mail account does not purge its queued jobs, so consumers must handle missing accounts/messages.

There is deliberately **no atomic database-to-queue delivery guarantee**: process failure between committing messages and queue acceptance, or a failed publication, can lose the event. No Mail event outbox or journal is retained for recovery. Applications requiring completeness must arrange their own idempotent reconciliation/backfill through public message lists or a separately designed delivery mechanism; mailbox list cursors and Provider dates are not local insertion checkpoints. Do not describe queue retries as closing this commit-to-publish gap.

The existing user-scoped `mail:messages` payload remains `{ kind: 'mail.changed' }`; it is a UI invalidation signal, not this business event stream. No new HTTP route, Client subscription or webhook is provided.

## Register through a Server ServiceProvider

Register during `boot()`, before the shared queue and Mail start processing work, and await unsubscription during `shutdown()`. Declare Mail as a peer dependency and import only its public Server entry. Implement the following Provider's `process()` with the application's authorized, idempotent business handler; returning successfully acknowledges processing to the queue.

```ts
import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  mailServiceToken,
  type MailMessagesSyncedEvent,
  type MailUnsubscribe,
} from '@nocobase/app-plugin-mail/server';

export abstract class MailSyncConsumerProvider extends ServiceProvider<AppPluginApplication> {
  private unsubscribe?: MailUnsubscribe;

  protected abstract process(
    event: MailMessagesSyncedEvent,
    signal: AbortSignal,
  ): Promise<void>;

  public override boot(): Promise<void> {
    this.unsubscribe = this.app.container
      .resolve(mailServiceToken)
      .onMessagesSynced((event, signal) => this.process(event, signal));
    return Promise.resolve();
  }

  public override async shutdown(): Promise<void> {
    const unsubscribe = this.unsubscribe;
    this.unsubscribe = undefined;
    await unsubscribe?.();
  }
}
```

The listener receives the queue cancellation signal combined with subscription cancellation. Honor it in work and outbound requests. Unsubscription stops new calls, aborts cooperative in-flight work and waits for calls already started to settle. **Never await your own unsubscription from inside that same handler**: it would wait for itself. Initiate cancellation without awaiting there, or arrange cancellation from outside the callback. Mail Core first drains synchronization workers, then closes its subscriptions with a bounded shutdown wait; an uncooperative handler can make shutdown fail rather than hang forever. The application queue Provider owns the shared backend's final shutdown.

## Authorization, business filtering and content recovery

Receiving an event grants no read permission. Do not construct a user session or trusted `MailOperationContext` from `event.ownerId` or browser-provided values. Use an actor identity the application already trusts. Personal `getMessage()` checks ownership; **the calling application must explicitly authorize `mail.management` or establish a trusted system-processing policy before calling `getManagedMessage()`**. Mail does not turn an actor ID into a managed authorization grant.

The following helper deliberately excludes history, then reads details from an already authorized managed context. An application may choose another phase, draft, sent-message or folder policy. Both sink operations must be durable and idempotent: if a later message fails, queue retry can repeat the earlier operation. `deferContent()` records an application-owned content-recovery task rather than treating an unavailable body as empty.

```ts
import type {
  MailService,
  MailOperationContext,
  MailMessagesSyncedEvent,
} from '@nocobase/app-plugin-mail/server';

export interface MailSyncEventSink {
  recordActivity(accountId: string, messageId: string): Promise<void>;
  deferContent(accountId: string, messageId: string): Promise<void>;
}

export async function processMailSyncEvent(
  mail: MailService,
  context: MailOperationContext,
  event: MailMessagesSyncedEvent,
  signal: AbortSignal,
  sink: MailSyncEventSink,
): Promise<void> {
  if (event.phase === 'history') return;
  for (const messageId of event.messageIds) {
    signal.throwIfAborted();
    const message = await mail.getManagedMessage(
      { ...context, signal },
      event.accountId,
      messageId,
    );
    if (!message) continue;
    if (
      message.contentStatus === 'deferred' ||
      message.contentStatus === 'failed'
    ) {
      await sink.deferContent(event.accountId, messageId);
    } else {
      await sink.recordActivity(event.accountId, messageId);
    }
  }
}
```

For content recovery, the account owner may use the existing `retryMessageContent()` under a separately trusted owner context; managed-read permission does not grant arbitrary owner mutations. Content retry does not generate another insertion event, so the application owns that recovery schedule. A message or account may disappear before delivery: use an explicit skip/tombstone policy, and do not retry missing data forever or synthesize content. Local IDs deduplicate only that local record; IMAP copies in different folders can be separate local messages.

No event migration or historical event backfill is required. Existing messages do not generate artificial insertion events. If business activities are needed for them, run an explicit idempotent backfill using public personal or managed lists. Such reconciliation is an application policy, not a guaranteed replacement for a durable synchronization journal.

## Verification

Verify public-token subscription on the actual application queue after committed history/catch-up/incremental pages; details and folder relations must already be visible. Test failed commits without publication, publication failure without mailbox retry, stable event IDs on delivery retry, idempotent repeated effects, cancellation/drain during shutdown and absence of Mail event Collections. Exercise both configured queue backends where deployed; memory-only tests do not prove Redis competing-worker behavior. Verify the application's explicit managed authorization and its policies for history, incomplete bodies and missing records. Mocked mail Providers prove this integration boundary, not live Gmail, Microsoft or IMAP connectivity.
