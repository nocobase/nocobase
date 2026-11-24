import {
  isUniqueConstraintViolation,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import type {
  BrokerTransaction,
  EncodedMessage,
  InboxOutcome,
  MessageInbox,
  MessageOutbox,
} from '@nocobase/message-broker';

export const OUTBOX_COLLECTION = 'messageBrokerOutbox';
export const INBOX_COLLECTION = 'messageBrokerInbox';

/** Longest `lastError` kept on an outbox row. */
const LAST_ERROR_LENGTH = 1024;

/**
 * Largest body the outbox stores. MySQL's BLOB holds 64 KB; the same limit applies on every dialect so that a message
 * accepted on one database is accepted on all of them.
 */
export const MAX_OUTBOX_BODY_BYTES = 65_535;

export interface OutboxRow {
  readonly id: number | string;
  readonly publisher: string;
  readonly messageId: string;
  readonly body: Uint8Array;
  readonly contentType: string | null;
  readonly headers: Record<string, string>;
  readonly key: string | null;
  readonly correlationId: string | null;
  readonly replyTo: string | null;
  readonly type: string | null;
  readonly timestamp: number | string;
  readonly attempts: number;
  readonly nextAttemptAt: number | string;
  readonly lastError: string | null;
  readonly sentAt: number | string | null;
}

export interface MessageBrokerStoreOptions {
  readonly database: () => DatabaseManager;
  /** A unique, roughly increasing ID for each outbox row. */
  readonly generateId: () => number;
  /** Called after the transaction that wrote outbox rows committed. */
  readonly onCommitted: () => void;
  readonly now?: () => number;
}

function isConnection(value: unknown): value is DatabaseConnection {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as DatabaseConnection).repository === 'function' &&
    typeof (value as DatabaseConnection).afterCommit === 'function'
  );
}

export function decodeOutboxRow(row: OutboxRow): EncodedMessage {
  return {
    body: Buffer.from(row.body),
    headers: row.headers ?? {},
    messageId: row.messageId,
    timestamp: new Date(Number(row.timestamp)),
    ...(row.contentType === null ? {} : { contentType: row.contentType }),
    ...(row.key === null ? {} : { key: row.key }),
    ...(row.correlationId === null ? {} : { correlationId: row.correlationId }),
    ...(row.replyTo === null ? {} : { replyTo: row.replyTo }),
    ...(row.type === null ? {} : { type: row.type }),
  };
}

export function truncateError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > LAST_ERROR_LENGTH
    ? message.slice(0, LAST_ERROR_LENGTH)
    : message;
}

/** The outbox and inbox on the application's default database connection. */
export class MessageBrokerStore implements MessageOutbox, MessageInbox {
  private readonly now: () => number;

  public constructor(private readonly options: MessageBrokerStoreOptions) {
    this.now = options.now ?? Date.now;
  }

  public async enqueue(
    transaction: BrokerTransaction,
    publisher: string,
    message: EncodedMessage,
  ): Promise<void> {
    if (!isConnection(transaction)) {
      throw new TypeError(
        'The outbox takes a database transaction connection, such as the one database.transaction() passes to its callback.',
      );
    }
    const defaultConnection = this.options.database().connection().name;
    if (transaction.name !== defaultConnection) {
      throw new Error(
        `The outbox lives on the "${defaultConnection}" connection; publish inside a transaction on it, not on "${transaction.name}".`,
      );
    }
    // Outside a transaction, afterCommit() runs its callback at once; a row written through such a connection would
    // stay behind when the caller's business transaction rolls back.
    let committed = false;
    transaction.afterCommit(() => {
      committed = true;
    });
    if (committed) {
      throw new TypeError(
        'The outbox takes the connection database.transaction() passes to its callback; the connection given is not inside a transaction.',
      );
    }
    if (message.body.length > MAX_OUTBOX_BODY_BYTES) {
      throw new RangeError(
        `Message "${message.messageId}" has a ${message.body.length}-byte body; the outbox stores bodies of up to ${MAX_OUTBOX_BODY_BYTES} bytes. Publish a reference to the data instead.`,
      );
    }
    const now = this.now();
    await transaction.repository(OUTBOX_COLLECTION).createOne({
      values: {
        id: this.options.generateId(),
        publisher,
        messageId: message.messageId,
        body: message.body,
        contentType: message.contentType ?? null,
        headers: { ...message.headers },
        key: message.key ?? null,
        correlationId: message.correlationId ?? null,
        replyTo: message.replyTo ?? null,
        type: message.type ?? null,
        timestamp: message.timestamp.getTime(),
        attempts: 0,
        nextAttemptAt: now,
        lastError: null,
        sentAt: null,
      },
    });
    // The relay only gets scheduled here: transaction() resolves after its commit callbacks, so waiting for the
    // middleware in one would hold the business request.
    transaction.afterCommit(() => this.options.onCommitted());
  }

  public async process<T>(
    subscription: string,
    messageId: string,
    run: (transaction: unknown) => Promise<T>,
  ): Promise<InboxOutcome<T>> {
    let duplicate = false;
    try {
      return await this.options.database().transaction(async (transaction) => {
        try {
          await transaction.repository(INBOX_COLLECTION).createOne({
            values: { subscription, messageId, processedAt: this.now() },
          });
        } catch (error) {
          // Only the inbox row's own key counts as a duplicate; a unique violation from the handler's writes is a
          // failure that retries.
          duplicate = isUniqueConstraintViolation(error);
          throw error;
        }
        return { duplicate: false, value: await run(transaction) };
      });
    } catch (error) {
      if (duplicate) return { duplicate: true };
      throw error;
    }
  }
}
