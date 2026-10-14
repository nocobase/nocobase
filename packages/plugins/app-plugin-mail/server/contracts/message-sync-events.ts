/** A bounded snapshot of local records inserted by a committed synchronization step. */
export interface MailMessagesSyncedEvent {
  readonly eventId: string;
  readonly accountId: string;
  readonly ownerId: string;
  readonly syncRunId: string;
  readonly phase: 'history' | 'catchUp' | 'incremental';
  readonly syncedAt: string;
  readonly messageIds: readonly string[];
}

/** Queue handlers may run again; use idempotent effects and honor cancellation. */
export type MailMessagesSyncedListener = (
  event: MailMessagesSyncedEvent,
  signal: AbortSignal,
) => void | Promise<void>;

/** Removes the subscription and waits for its already-started calls to settle. */
export type MailUnsubscribe = () => Promise<void>;
