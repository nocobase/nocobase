import { withChannel, type QueueService } from '@nocobase/queue';
import { z } from 'zod';

import type {
  MailMessagesSyncedEvent,
  MailMessagesSyncedListener,
  MailUnsubscribe,
} from './contracts/message-sync-events.js';
import { writeMailLog, type MailLogger } from './logging.js';

export const MAIL_MESSAGE_SYNC_QUEUE: string = 'mail/message-sync';
export const MAIL_MESSAGE_SYNC_CHANNEL: string = 'messages.synced';
export const MAIL_MESSAGE_SYNC_SHUTDOWN_TIMEOUT_MS: number = 5000;

const eventSchema = z.strictObject({
  eventId: z.string().min(1),
  accountId: z.string().min(1),
  ownerId: z.string().min(1),
  syncRunId: z.string().min(1),
  phase: z.enum(['history', 'catchUp', 'incremental']),
  syncedAt: z.iso.datetime({ offset: true }),
  messageIds: z.array(z.string().min(1)).min(1).max(100),
});

interface Subscription {
  readonly cancellation: AbortController;
  readonly unregister: MailUnsubscribe;
  unregistering?: Promise<void>;
}

function snapshotEvent(payload: unknown): MailMessagesSyncedEvent {
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) {
    // Validation details can include private payload fields; never expose them.
    throw new Error('Invalid Mail message sync event payload.');
  }
  return Object.freeze({
    ...parsed.data,
    messageIds: Object.freeze([...parsed.data.messageIds]),
  });
}

/** Queue pub/sub on this worker; Redis workers compete, not globally broadcast. */
export class MailMessageSyncNotifier {
  private readonly subscriptions = new Set<Subscription>();
  private readonly unregistering = new Set<Promise<void>>();
  private readonly publishing = new Set<Promise<void>>();
  private closed = false;
  private closing: Promise<void> | undefined;

  public constructor(
    private readonly queue: QueueService,
    private readonly logger: MailLogger | undefined = undefined,
  ) {}

  public subscribe(listener: MailMessagesSyncedListener): MailUnsubscribe {
    if (this.closed)
      throw new Error('The Mail message sync notifier is closed.');
    const cancellation = new AbortController();
    const subscription: Subscription = {
      cancellation,
      unregister: this.queue.consumer(MAIL_MESSAGE_SYNC_QUEUE).consume(
        withChannel(
          MAIL_MESSAGE_SYNC_CHANNEL,
          async (_channel, payload, signal): Promise<void> => {
            let event: MailMessagesSyncedEvent;
            try {
              event = snapshotEvent(payload);
            } catch {
              this.logFailure('payload_invalid');
              throw new Error('Invalid Mail message sync event payload.');
            }
            const combined = AbortSignal.any([signal, cancellation.signal]);
            try {
              combined.throwIfAborted();
              await listener(event, combined);
            } catch {
              this.logFailure('listener_failed', event);
              // Queue owns retries; neither the exception nor its cause may leak secrets.
              throw new Error('Mail message sync listener failed.');
            }
          },
        ),
      ),
    };
    this.subscriptions.add(subscription);
    // As with Queue consumers, never await this drain from its own listener.
    return (): Promise<void> => this.unregister(subscription);
  }

  /** Waits for acceptance, not delivery; failure must not retry an already committed sync. */
  public async publish(
    events: readonly MailMessagesSyncedEvent[],
  ): Promise<void> {
    if (this.closed) return;
    const accepted: Promise<void>[] = [];
    for (const event of events) {
      let snapshot: MailMessagesSyncedEvent;
      try {
        snapshot = snapshotEvent(event);
      } catch {
        this.logFailure('publication_failed');
        continue;
      }
      const publication = Promise.resolve().then(async (): Promise<void> => {
        try {
          await this.queue
            .producer(MAIL_MESSAGE_SYNC_QUEUE)
            .publish(MAIL_MESSAGE_SYNC_CHANNEL, snapshot, {
              jobIdProducer: (): string => snapshot.eventId,
            });
        } catch {
          this.logFailure('publication_failed', snapshot);
        }
      });
      this.publishing.add(publication);
      void publication.then(() => this.publishing.delete(publication));
      accepted.push(publication);
    }
    await Promise.all(accepted);
  }

  private unregister(subscription: Subscription): Promise<void> {
    if (subscription.unregistering) return subscription.unregistering;
    this.subscriptions.delete(subscription);
    const draining = Promise.resolve().then(() => subscription.unregister());
    subscription.unregistering = draining;
    this.unregistering.add(draining);
    void draining.then(
      () => this.unregistering.delete(draining),
      () => undefined,
    );
    subscription.cancellation.abort(
      new Error('The Mail subscription is stopping.'),
    );
    return draining;
  }

  private logFailure(
    kind: 'listener_failed' | 'publication_failed' | 'payload_invalid',
    event?: MailMessagesSyncedEvent,
  ): void {
    writeMailLog(
      this.logger,
      'error',
      {
        event: `mail.message_sync.${kind}`,
        ...(event
          ? {
              eventId: event.eventId,
              accountId: event.accountId,
              syncRunId: event.syncRunId,
            }
          : {}),
      },
      'Mail message sync event transport failed.',
    );
  }

  /** Drain from outside listeners: their own unregistration waits for them. */
  public close(): Promise<void> {
    this.closed = true;
    this.closing ??= Promise.resolve().then(() => this.drain());
    for (const subscription of this.subscriptions) {
      void this.unregister(subscription);
    }
    return this.closing;
  }

  private async drain(): Promise<void> {
    const pending = Promise.allSettled([
      ...this.unregistering,
      ...this.publishing,
    ]);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const results = await Promise.race([
        pending,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  'Mail message sync notifier shutdown timed out: handlers or publications did not settle.',
                ),
              ),
            MAIL_MESSAGE_SYNC_SHUTDOWN_TIMEOUT_MS,
          );
        }),
      ]);
      if (results.some((result) => result.status === 'rejected')) {
        throw new Error(
          'Mail message sync subscriptions did not unregister cleanly.',
        );
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
