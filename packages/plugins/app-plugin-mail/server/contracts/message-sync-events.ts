export interface MailMessagesSyncedEvent {
  readonly eventId: string;
  readonly accountId: string;
  readonly ownerId: string;
  readonly syncRunId: string;
  readonly phase: 'history' | 'catchUp' | 'incremental';
  readonly syncedAt: string;
  readonly messageIds: readonly string[];
}

export type MailMessagesSyncedListener = (
  event: MailMessagesSyncedEvent,
) => void | Promise<void>;

export type MailUnsubscribe = () => void;

export interface MailListMessageSyncEventsInput {
  readonly accountId: string;
  readonly syncedSince?: string;
  readonly after?: string;
  readonly pageToken?: string;
  readonly pageSize?: number;
}

export interface MailMessageSyncEventsPage {
  readonly items: readonly MailMessagesSyncedEvent[];
  readonly nextPageToken?: string;
  readonly checkpoint?: string;
}
