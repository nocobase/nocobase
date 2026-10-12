export interface ImapSmtpCredential {
  readonly username: string;
  readonly password: string;
}

export interface ImapFolderCursor {
  readonly uidValidity: string;
  readonly uidNext: number;
}

export interface ImapSyncCursor {
  readonly version: 1;
  readonly folders: Readonly<Record<string, ImapFolderCursor>>;
  readonly verify?: ImapVerifyState;
}

export interface MessageLocator {
  readonly folder: string;
  readonly uidValidity: string;
  readonly uid: number;
}

export interface AttachmentLocator extends MessageLocator {
  readonly attachment: number;
}

/** Which value backs an IMAP message's providerMessageId. Not part of the identity key. */
export type ImapIdSource =
  'objectid' | 'x-gm-msgid' | 'rfc-message-id' | 'locator';

export type ImapLocationStatus = 'valid' | 'pending' | 'invalid';

export interface ImapLocationTuple {
  readonly folder: string;
  readonly uidValidity: string;
  readonly uid: number;
}

/** A persisted copy of a business message, read through the account-bound persistence. */
export interface ImapStoredLocation extends ImapLocationTuple {
  readonly id: string;
  readonly messageId: string;
  readonly providerMessageId: string;
  readonly source?: ImapIdSource;
  readonly status: ImapLocationStatus;
}

/** One fetched copy, verified in this step, with the identity chosen for it. */
export interface ImapCopyEvidence extends ImapLocationTuple {
  /** Used only when this tuple has no persisted location yet. */
  readonly locationId: string;
  readonly providerMessageId: string;
  readonly source: ImapIdSource;
  readonly read: boolean;
  readonly starred: boolean;
  readonly receivedAt?: string;
}

export interface ImapLocationChange {
  readonly id: string;
  readonly status: ImapLocationStatus;
  readonly reason?: string;
}

/** Location evidence of one sync step; committed with that step or discarded. */
export interface ImapSyncEvidence {
  readonly copies: readonly ImapCopyEvidence[];
  readonly changes: readonly ImapLocationChange[];
  /** Set only after two complete, matching verification passes. */
  readonly cleanup: boolean;
}

export interface ImapVerifyFolder {
  readonly uidValidity: string;
  readonly uidNext: number;
  /** Compressed UID set from a complete SEARCH ALL, such as "1:5,9". */
  readonly uids: string;
}

/** First verification pass, kept in the change cursor until the second pass compares it. */
export interface ImapVerifyState {
  readonly attempts: number;
  readonly folders?: Readonly<Record<string, ImapVerifyFolder>>;
}

/**
 * Account-bound persistence given to one IMAP adapter instance. It exposes only
 * the location reads and commits the adapter needs; each commit locks the
 * account and rechecks ownership inside its own transaction.
 */
export interface ImapLocationPersistence {
  findLocations(
    tuples: readonly ImapLocationTuple[],
  ): Promise<readonly ImapStoredLocation[]>;
  findMessageSources(
    providerMessageIds: readonly string[],
  ): Promise<ReadonlyMap<string, ImapIdSource | undefined>>;
  /** Valid copies of the message owning this provider ID (or remote draft ID). */
  listValidLocations(
    providerMessageId: string,
  ): Promise<readonly ImapStoredLocation[]>;
  /** Valid and pending copies of the account, for verification. */
  listKnownLocations(): Promise<readonly ImapStoredLocation[]>;
  commitFlags(
    location: ImapStoredLocation,
    flags: { readonly read?: boolean; readonly starred?: boolean },
  ): Promise<void>;
  commitDeleted(location: ImapStoredLocation): Promise<void>;
  commitSyncStep(
    input: import('../../contracts/persistence.js').MailSyncStepCommit,
    evidence: ImapSyncEvidence,
  ): Promise<import('../../../shared/mail.js').MailSyncRun>;
}
