import type { DatabaseManager, FilterBuilder, Repository } from '@nocobase/db';
import type {
  MessageBrokerLogger,
  MessageBrokerService,
} from '@nocobase/message-broker';

import {
  decodeOutboxRow,
  INBOX_COLLECTION,
  OUTBOX_COLLECTION,
  truncateError,
  type OutboxRow,
} from './store.js';

/** Runs `tick` only while no other instance runs it; resolves `false` when another instance holds it. */
export type RelayExclusion = (tick: () => Promise<void>) => Promise<boolean>;

export interface OutboxRelayOptions {
  readonly database: () => DatabaseManager;
  readonly broker: () => MessageBrokerService;
  readonly exclusive: RelayExclusion;
  readonly logger: MessageBrokerLogger;
  /** Milliseconds between fallback polls. */
  readonly pollInterval: number;
  /** Milliseconds sent outbox rows are kept; `0` deletes them at the next cleanup. */
  readonly outboxRetention: number;
  /** Milliseconds inbox rows are kept: the window in which a repeated messageId is recognized. */
  readonly inboxRetention: number;
  readonly batchSize?: number;
  readonly now?: () => number;
}

/**
 * An exclusion created on first use, such as one from the concurrency plugin's lock. Creating it again after a
 * failure keeps a lock backend that was unavailable at startup from failing every later round.
 */
export function lazyExclusion(
  create: () => Promise<RelayExclusion>,
): RelayExclusion {
  let created: Promise<RelayExclusion> | undefined;
  return async (tick) => {
    const pending = (created ??= create());
    let exclusion: RelayExclusion;
    try {
      exclusion = await pending;
    } catch (error) {
      if (created === pending) created = undefined;
      throw error;
    }
    return exclusion(tick);
  };
}

const DEFAULT_BATCH_SIZE = 100;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

/** The wait before attempt `attempts + 1`: 2 s, 4 s, 8 s … up to 5 minutes. */
export function backoff(attempts: number): number {
  return Math.min(2 ** attempts * 1000, MAX_BACKOFF_MS);
}

/**
 * Sends committed outbox rows. Each round reads due rows in ID order, publishes them, marks the confirmed ones sent
 * and schedules the others for a later attempt. Rounds never overlap within the process, and `exclusive` keeps them
 * from overlapping across instances, so each row is sent by one instance at a time.
 */
export class OutboxRelay {
  private timer: NodeJS.Timeout | undefined;
  private running: Promise<void> | undefined;
  private again = false;
  private stopped = true;
  private lastCleanup = 0;
  private readonly now: () => number;
  private readonly batchSize: number;

  public constructor(private readonly options: OutboxRelayOptions) {
    this.now = options.now ?? Date.now;
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  }

  public start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.timer = setInterval(() => this.kick(), this.options.pollInterval);
    this.timer.unref();
    this.kick();
  }

  /** Schedules a round; a round already running runs once more after it ends. Never waits. */
  public kick(): void {
    if (this.stopped) return;
    if (this.running) {
      this.again = true;
      return;
    }
    this.running = this.loop().finally(() => {
      this.running = undefined;
    });
  }

  /** Resolves once a round is no longer running, for callers that need the outbox drained. */
  public async idle(): Promise<void> {
    while (this.running) await this.running;
  }

  /** Stops polling and waits for the current round. */
  public async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    await this.idle();
  }

  private async loop(): Promise<void> {
    do {
      this.again = false;
      try {
        await this.round();
      } catch (error) {
        this.options.logger.error(
          { error: truncateError(error) },
          'Message broker outbox relay round failed.',
        );
      }
    } while (this.again && !this.stopped);
  }

  /**
   * One round: sends due rows when there are any, then cleans up once the cleanup interval passed. The lock is taken
   * only for work: an idle poll is a single indexed read on each instance. Exposed for tests; production code calls
   * `kick()`.
   */
  public async round(): Promise<void> {
    const database = this.options.database();
    const outbox = database.repository<OutboxRow>(OUTBOX_COLLECTION);
    if ((await this.due(outbox, 1)).length > 0) {
      await this.options.exclusive(() => this.send(outbox));
    }
    const now = this.now();
    if (now - this.lastCleanup >= CLEANUP_INTERVAL_MS) {
      // Another instance holding the lock is sending; this one cleans up at its next round instead.
      if (await this.options.exclusive(() => this.cleanup(database, now))) {
        this.lastCleanup = now;
      }
    }
  }

  private async due(
    outbox: Repository<OutboxRow>,
    limit: number,
  ): Promise<OutboxRow[]> {
    const now = this.now();
    return await outbox.findMany({
      filter: (f: FilterBuilder<OutboxRow>) =>
        f.and([f.number('sentAt').empty(), f.number('nextAttemptAt').lte(now)]),
      sort: (sort) => sort.field('id').asc(),
      limit,
    });
  }

  /** Sends one batch of due rows; runs under the lock, so it reads them again. */
  private async send(outbox: Repository<OutboxRow>): Promise<void> {
    const rows = await this.due(outbox, this.batchSize);
    const broker = this.options.broker();
    const sent: (number | string)[] = [];
    // A failed message holds back later ones with the same publisher and key within this round.
    const blocked = new Set<string>();
    for (const row of rows) {
      const order =
        row.key === null ? undefined : `${row.publisher}\0${row.key}`;
      if (order !== undefined && blocked.has(order)) continue;
      try {
        await broker.publishEncoded(row.publisher, decodeOutboxRow(row));
        sent.push(row.id);
      } catch (error) {
        if (order !== undefined) blocked.add(order);
        const attempts = Number(row.attempts) + 1;
        const lastError = truncateError(error);
        this.options.logger.warn(
          {
            publisher: row.publisher,
            messageId: row.messageId,
            attempts,
            error: lastError,
          },
          'Message broker outbox could not send a message; it will retry.',
        );
        await outbox.updateOne({
          filter: (f: FilterBuilder<OutboxRow>) => f.number('id').eq(row.id),
          values: {
            attempts,
            nextAttemptAt: this.now() + backoff(attempts),
            lastError,
          },
        });
      }
    }
    if (sent.length > 0) {
      const sentAt = this.now();
      await outbox.updateMany({
        filter: (f: FilterBuilder<OutboxRow>) =>
          f.and([
            f.or(sent.map((id) => f.number('id').eq(id))),
            f.number('sentAt').empty(),
          ]),
        values: { sentAt, lastError: null },
      });
    }
    if (rows.length === this.batchSize) this.again = true;
  }

  private async cleanup(database: DatabaseManager, now: number): Promise<void> {
    await database.repository<OutboxRow>(OUTBOX_COLLECTION).deleteMany({
      filter: (f: FilterBuilder<OutboxRow>) =>
        f.number('sentAt').lte(now - this.options.outboxRetention),
    });
    await database
      .repository<{ processedAt: number }>(INBOX_COLLECTION)
      .deleteMany({
        filter: (f: FilterBuilder<{ processedAt: number }>) =>
          f.number('processedAt').lt(now - this.options.inboxRetention),
      });
  }
}
