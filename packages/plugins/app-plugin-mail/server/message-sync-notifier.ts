import type {
  MailMessagesSyncedEvent,
  MailMessagesSyncedListener,
  MailUnsubscribe,
} from './contracts/message-sync-events.js';
import { writeMailLog, type MailLogger } from './logging.js';

/** Instance-owned, best-effort wakeups; durable consumption uses the event log. */
export class MailMessageSyncNotifier {
  private readonly listeners = new Set<MailMessagesSyncedListener>();
  private closed = false;

  public constructor(
    private readonly logger: MailLogger | undefined = undefined,
  ) {}

  public subscribe(listener: MailMessagesSyncedListener): MailUnsubscribe {
    if (this.closed) return (): void => {};
    // Each registration has its own identity, including repeated use of one callback.
    const subscription: MailMessagesSyncedListener = (event) => listener(event);
    this.listeners.add(subscription);
    return (): void => {
      this.listeners.delete(subscription);
    };
  }

  public notify(events: readonly MailMessagesSyncedEvent[]): void {
    if (this.closed) return;
    for (const event of events) {
      if (this.closed) return;
      const snapshot: MailMessagesSyncedEvent = Object.freeze({
        ...event,
        messageIds: Object.freeze([...event.messageIds]),
      });
      // Snapshot registrations so a listener added during dispatch waits for the next event.
      for (const listener of [...this.listeners]) {
        if (this.closed) return;
        if (!this.listeners.has(listener)) continue;
        try {
          const result = listener(snapshot);
          if (result !== undefined) {
            void Promise.resolve(result).catch((): void => {
              this.logFailure(snapshot);
            });
          }
        } catch {
          this.logFailure(snapshot);
        }
      }
    }
  }

  private logFailure(event: MailMessagesSyncedEvent): void {
    // Consumer errors may contain message bodies or credentials. Log identities only.
    writeMailLog(
      this.logger,
      'error',
      {
        event: 'mail.message_sync.listener_failed',
        eventId: event.eventId,
        accountId: event.accountId,
        syncRunId: event.syncRunId,
      },
      'Mail message sync listener failed.',
    );
  }

  public close(): void {
    this.closed = true;
    this.listeners.clear();
  }
}
