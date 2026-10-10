# Server synchronization events and incremental consumption

## Public contract and guarantees

Resolve `mailServiceToken` from `@nocobase/app-plugin-mail/server`. `MailService.onMessagesSynced(listener)` subscribes to successful synchronization inserts and returns an idempotent `MailUnsubscribe`. The exported `MailMessagesSyncedEvent` contains `eventId`, `accountId`, `ownerId`, `syncRunId`, `phase` (`history`, `catchUp`, or `incremental`), local `syncedAt` (RFC 3339), and a bounded `messageIds` array of local message IDs. These IDs work with `getMessage()` and `getManagedMessage()`; they are not Provider IDs or globally unique logical-mail identities.

A new message means a record first inserted locally by synchronization, not necessarily mail just delivered to an inbox. History, sent mail and remote drafts can all appear. Updates, deletes, folder-only removals, skipped/protected drafts, duplicate Provider input and inserts deleted in the same transaction do not generate a new-message event. Send confirmation, draft writes and content retries do not generate these events. A nonempty page emits after its own transaction commits, without waiting for the whole run; later run failure does not retract committed pages. Mail and folder relations, event rows and sequence, sync revision, lease checks, cursors and the next task outbox commit or roll back together.

Notifications are **best effort in this process only**, not persistent business delivery or cross-process broadcast. They can be lost between commit and dispatch, during downtime, or before subscription. Listener failures are isolated and do not retry committed synchronization. Listener Promises are not awaited. Every consumer needs startup and periodic incremental compensation, an application-owned durable Job, and its own lifecycle and retry policy. Multiple processes must arrange account assignment or consumer election themselves.

The existing user-scoped `mail:messages` payload remains `{ kind: 'mail.changed' }`; it is a UI invalidation signal, not a business event. No new HTTP route, Client subscription, webhook or external message bus is provided.

## Register through a Server ServiceProvider

Register during `boot()`, before Mail starts consuming recovery tasks in `start()`, and unsubscribe during `shutdown()`. Declare Mail as a peer dependency and import only its public Server entry. This example expects an application-owned consumer service: `wake()` schedules bounded work without performing matching, network requests or content retries inline; `start()` arranges both startup recovery and periodic compensation; `close()` drains or cancels its own work.

```ts
import {
  ServiceProvider,
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  mailServiceToken,
  type MailUnsubscribe,
} from '@nocobase/app-plugin-mail/server';

interface MailActivityConsumer {
  wake(accountId: string): void;
  start(): Promise<void>;
  close(): Promise<void>;
}

// Bind this token to the application's own durable Job consumer.
export const mailActivityConsumerToken: ServiceToken<MailActivityConsumer> =
  createServiceToken<MailActivityConsumer>(
    'application/mail-activity-consumer',
  );

export class MailActivityProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = 'application/mail-activities';
  private unsubscribe?: MailUnsubscribe;

  public override async boot(): Promise<void> {
    const consumer = this.app.container.resolve(mailActivityConsumerToken);
    this.unsubscribe = this.app.container
      .resolve(mailServiceToken)
      .onMessagesSynced((event): void => consumer.wake(event.accountId));
  }

  public override async start(): Promise<void> {
    await this.app.container.resolve(mailActivityConsumerToken).start();
  }

  public override async shutdown(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    await this.app.container
      .resolveIfCreated(mailActivityConsumerToken)
      ?.close();
  }
}
```

Do not construct a user session or `MailOperationContext` from `event.ownerId` or browser-provided values. The notification is trusted Server integration data, but receiving it grants no read permission. Use a context whose actor identity the application already trusts. Personal `listMessageSyncEvents(context, input)` checks account ownership before reading the log. Cross-user `listManagedMessageSyncEvents(context, input)` follows the existing managed-read boundary: **the calling application must explicitly authorize `mail.management` or establish a trusted system-processing policy before calling it**. Mail does not turn `actorId` into an authorization grant for managed operations.

## Read a finite increment and save a checkpoint

`MailListMessageSyncEventsInput` requires `accountId`, and accepts `syncedSince`, `after`, `pageToken` and `pageSize`. `MailMessageSyncEventsPage` returns `items` and either `nextPageToken` or the final `checkpoint`.

- Start with no boundary to read all recorded events, or RFC 3339 `syncedSince` to read events whose **local** `syncedAt >= syncedSince`. Mail received years ago but imported today is included. An inclusive timestamp boundary may replay records; use idempotency rather than subtracting milliseconds.
- Use `after` with the last fully consumed checkpoint on subsequent rounds. `after` and `syncedSince` are mutually exclusive. Do not manufacture checkpoints from notification IDs, message IDs or timestamps.
- The first request captures a highest committed account sequence. All pages in that round share this upper bound. Synchronization occurring during pagination is read in the next round rather than prolonging this round indefinitely.
- Follow `pageToken` alone with the same `accountId` and optional `pageSize`; do not repeat `after` or `syncedSince`. Page size defaults to 50 and must be an integer from 1 to 200.
- Only the last page returns `checkpoint`, including an empty result. Intermediate pages have only `nextPageToken`. Tokens are opaque, account-bound and strictly validated; they do not substitute for authorization. Preserve them verbatim.
- Account sequence resolves timestamp ties. Event time is a nondecreasing local observation inside the account lock, not an exact database commit timestamp or Provider delivery time. Continued consumption relies on sequence checkpoints, not mailbox sort order.

Here is a bounded-round consumption helper. The caller supplies a trusted context and authorizes managed access **before** calling it. `enqueue()` must durably submit an application-owned task with an idempotency key such as `(activityType, accountId, localMessageId)`; `saveCheckpoint()` must persist only after every event has been reliably submitted or deliberately skipped. Serialize concurrent rounds for one consumer/account so an older round cannot overwrite a newer checkpoint.

```ts
import type {
  MailService,
  MailOperationContext,
  MailMessagesSyncedEvent,
} from '@nocobase/app-plugin-mail/server';

interface SyncEventSink {
  enqueue(event: MailMessagesSyncedEvent): Promise<void>;
  saveCheckpoint(accountId: string, checkpoint: string): Promise<void>;
}

export async function consumeMailIncrement(
  mail: MailService,
  context: MailOperationContext,
  accountId: string,
  after: string | undefined,
  sink: SyncEventSink,
): Promise<void> {
  let pageToken: string | undefined;
  do {
    const page = await mail.listManagedMessageSyncEvents(context, {
      accountId,
      ...(pageToken ? { pageToken } : after ? { after } : {}),
      pageSize: 50,
    });
    for (const event of page.items) await sink.enqueue(event);
    if (page.checkpoint !== undefined) {
      await sink.saveCheckpoint(accountId, page.checkpoint);
      return;
    }
    pageToken = page.nextPageToken;
    if (!pageToken) throw new Error('Mail event page has no continuation.');
  } while (pageToken);
}
```

A failed enqueue or processing attempt must not advance the checkpoint. Retrying from the preceding checkpoint intentionally repeats events; make the durable jobs and their activity writes idempotent. Merely receiving a callback, fetching a page or finishing the last message in a notification is not evidence that a round is complete. If `enqueue()` reliably persists jobs, the event checkpoint may advance before those jobs complete, because their separate retries own processing from that point.

## Business filtering and content recovery

Read details through the public service inside the application task. Decide explicitly whether to include `history`, `catchUp` and `incremental`, and whether drafts, sent messages or a particular folder belong in the activity stream. Mail does not guess a message's business direction. History can produce a large number of activities; keep application task batches bounded.

`contentStatus: 'deferred'` or `'failed'` is not a complete empty body. Keep the task pending or persist a content-recovery task; when appropriate the account owner can call the existing `retryMessageContent()`. Use a separately trusted owner context for that operation; a system's managed-read permission does not grant arbitrary owner mutations. Content retry does not generate another insertion event, so the application owns its retry schedule.

A message can be deleted before the task reads its details. Treat a missing message according to a documented skip/tombstone policy; do not retry forever or synthesize content. Account removal ends the recoverable stream: while removal is in progress reads can be refused, and final account deletion cascades both event state and log. Deleting a message or resetting/deleting sync runs or Provider cursors does not erase its previously recorded event. Local IDs deduplicate only that local record; IMAP copies in different folders can still be separate local messages. This capability does not solve global mail identity.

## Installation, history backfill and retention

After upgrading Mail, run the application's normal `pnpm nocobase db apply` before starting synchronization so the new event-state and event-log Collections exist. The migration does **not** fabricate events for existing messages. Event recording begins only for synchronization inserts after the migration is applied.

If the application needs activities for pre-upgrade mail, perform one explicit, idempotent backfill through public personal or managed message lists. Capture a valid event checkpoint first, backfill with the same per-message idempotency constraint, then consume from that checkpoint to cover concurrent arrivals without losing them. Do not skip the delta at the end of backfill. A mailbox listing is not itself a synchronization checkpoint and cannot supply one.

There is no automatic retention or event expiry in this version. Storage grows with synchronization inserts; event rows contain bounded ID arrays and metadata, not bodies, addresses or credentials. Final account deletion removes all its event rows and state. A future retention policy must define expired-cursor errors and rebuilding before pruning; manually deleting rows breaks the incremental guarantee.

## Verification

Verify actual public-token subscription after a committed history/catch-up/incremental page; details and folder relations must already be visible. Verify startup compensation with no callback, enqueue failure without checkpoint advancement, idempotent replay, fixed-bound pagination while new mail is synchronized, an empty valid checkpoint, personal ownership denial and the caller's explicit managed authorization. Test history filtering, incomplete-body retries and the missing-message/account policy in the application's own tasks. Mocked providers prove this integration boundary, not live Gmail, Microsoft or IMAP connectivity.
