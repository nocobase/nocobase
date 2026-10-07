import type { DatabaseConnection } from '@nocobase/db';

import type {
  AIConversationEntity,
  AIConversationRepository,
  AIMessageRepository,
  LCCheckpointBlobRepository,
  LCCheckpointRepository,
  LCCheckpointWriteRepository,
} from '../../repository/index.js';

/**
 * The thread of a conversation whose checkpoints were released. A conversation
 * starts at thread 1, which is also the column's default, so a conversation on
 * thread 0 is a released one: its next run replays its history from the
 * database onto a fresh thread.
 */
export const RELEASED_THREAD = 0;

/** Conversations examined, and released, per transaction. */
export const DEFAULT_CHECKPOINT_CLEANUP_BATCH_SIZE = 100;

/**
 * The most values one `IN` list carries. Oracle accepts at most 1000 values in
 * a list and SQL Server 2100 parameters in a statement, so every dialect takes
 * a list of this length.
 */
const IN_LIST_LIMIT = 500;

export interface CheckpointCleanerRepositories {
  readonly conversations: AIConversationRepository;
  readonly messages: AIMessageRepository;
  readonly checkpoints: LCCheckpointRepository;
  readonly blobs: LCCheckpointBlobRepository;
  readonly writes: LCCheckpointWriteRepository;
}

export interface CleanOutdatedOptions {
  readonly batchSize?: number;
  /** Stops between batches; a batch that has begun completes. */
  readonly signal?: AbortSignal;
}

type LatestMessageSource = {
  readonly sessionId: string;
  readonly messageId: string;
};

type ReleaseTarget = {
  readonly sessionId: string;
  readonly thread: number;
};

function hasToolCalls(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.length > 0 : Boolean(parsed);
    } catch {
      return value.length > 0;
    }
  }
  return Boolean(value);
}

function chunk<T>(values: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size)
    chunks.push(values.slice(index, index + size));
  return chunks;
}

/**
 * Releases the checkpoints of conversations nobody has used since a point in
 * time. A released conversation keeps every message: its thread is set to
 * {@link RELEASED_THREAD}, and the agent rebuilds its context from the stored
 * messages the next time it runs.
 */
export class CheckpointCleaner {
  public constructor(
    private readonly database: DatabaseConnection,
    private readonly repositories: CheckpointCleanerRepositories,
  ) {}

  /**
   * Releases every conversation last updated before `expiredAt` whose latest
   * message is older too and asks for no tool call. Such a call may be waiting
   * for a decision, and only its checkpoint can resume it. Returns how many
   * conversations were released.
   */
  public async cleanOutdated(
    expiredAt: Date,
    options: CleanOutdatedOptions = {},
  ): Promise<number> {
    const batchSize = Math.max(
      1,
      Math.floor(options.batchSize ?? DEFAULT_CHECKPOINT_CLEANUP_BATCH_SIZE),
    );
    let released = 0;
    // A conversation passed over stays a candidate, so the scan moves on by
    // session id rather than by asking again for the oldest candidates.
    let after: string | undefined;
    while (!options.signal?.aborted) {
      const conversations = await this.repositories.conversations.find({
        filter: {
          updatedAt: { $lt: expiredAt },
          thread: { $ne: RELEASED_THREAD },
          ...(after === undefined ? {} : { sessionId: { $gt: after } }),
        },
        sort: ['sessionId'],
        limit: batchSize,
      });
      const last = conversations.at(-1);
      if (!last?.sessionId) break;
      after = last.sessionId;
      const idle = await this.idleSessionIds(conversations, expiredAt);
      const targets: ReleaseTarget[] = conversations
        .filter((conversation) => idle.has(conversation.sessionId!))
        .map((conversation) => ({
          sessionId: conversation.sessionId!,
          thread: Number(conversation.thread),
        }));
      released += await this.release(targets, expiredAt);
      if (conversations.length < batchSize) break;
    }
    return released;
  }

  /**
   * The conversations whose latest message is older than `expiredAt` and asks
   * for no tool call, in two queries per batch however many it holds. A
   * conversation without messages has nothing to replay and is left alone.
   */
  private async idleSessionIds(
    conversations: readonly AIConversationEntity[],
    expiredAt: Date,
  ): Promise<Set<string>> {
    const sessionIds = conversations
      .map((conversation) => conversation.sessionId)
      .filter((sessionId): sessionId is string => Boolean(sessionId));
    const latestMessageIds: string[] = [];
    // Through the Repository rather than the query builder: it reads a bigint
    // aggregate back exactly on every dialect, and a message id is a snowflake
    // beyond the integers a JavaScript number holds.
    const messages =
      this.database.repository<LatestMessageSource>('aiMessages');
    for (const ids of chunk(sessionIds, IN_LIST_LIMIT)) {
      const rows = await messages.groupBy({
        by: ['sessionId'],
        aggregate: (aggregate) => ({
          latestMessageId: aggregate.max('messageId'),
        }),
        filter: (filter) =>
          filter.or(ids.map((id) => filter.string('sessionId').eq(id))),
      });
      for (const row of rows) {
        if (row.latestMessageId != null)
          latestMessageIds.push(String(row.latestMessageId));
      }
    }
    const idle = new Set<string>();
    for (const ids of chunk(latestMessageIds, IN_LIST_LIMIT)) {
      const latest = await this.repositories.messages.find({
        filter: { messageId: { $in: ids } },
      });
      for (const message of latest) {
        if (
          message.sessionId &&
          message.updatedAt &&
          new Date(message.updatedAt) < expiredAt &&
          !hasToolCalls(message.toolCalls)
        )
          idle.add(message.sessionId);
      }
    }
    return idle;
  }

  /**
   * Moves each conversation to the released thread and deletes the checkpoints
   * of every thread it has had, in one transaction. The move only succeeds
   * while the conversation is still unused, and a run starting meanwhile
   * updates the conversation first, so a conversation is released either
   * before that run reads its thread or not at all.
   */
  private async release(
    targets: readonly ReleaseTarget[],
    expiredAt: Date,
  ): Promise<number> {
    if (!targets.length) return 0;
    const { conversations, checkpoints, blobs, writes } = this.repositories;
    return this.database.transaction(async (connection) => {
      const threadIds: string[] = [];
      let released = 0;
      for (const target of targets) {
        const updated = await conversations.update(
          {
            values: { thread: RELEASED_THREAD },
            filter: {
              sessionId: target.sessionId,
              thread: target.thread,
              updatedAt: { $lt: expiredAt },
            },
          },
          { connection },
        );
        if (!updated) continue;
        released += 1;
        // Thread 0 included: a conversation created on it before thread 1
        // became the default kept checkpoints there until its first fork.
        for (let thread = RELEASED_THREAD; thread <= target.thread; thread++)
          threadIds.push(`${target.sessionId}:${thread}`);
      }
      for (const ids of chunk(threadIds, IN_LIST_LIMIT)) {
        const filter = { threadId: { $in: ids } };
        await writes.destroy({ filter }, { connection });
        await blobs.destroy({ filter }, { connection });
        await checkpoints.destroy({ filter }, { connection });
      }
      return released;
    });
  }
}
