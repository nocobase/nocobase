import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';

import {
  CheckpointCleaner,
  RELEASED_THREAD,
} from '../server/agent/checkpoint/index.js';
import { RepositoryFactory } from '../server/factory/repository-factory.js';
import { aiEmployeeMigrations } from './support/migrations.js';

const testDatabases: TestDatabase[] = [];

afterEach(async () => {
  await Promise.all(
    testDatabases.splice(0).map((testDatabase) => testDatabase.destroy()),
  );
});

let generatedId = 1000n;

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const expiredAt = new Date(now - 7 * DAY);
const old = new Date(now - 30 * DAY);
const recent = new Date(now - DAY);

/** A uuid for each label, since `sessionId` is a uuid column. */
function session(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

async function setup() {
  const testDatabase = await createTestDatabase();
  testDatabases.push(testDatabase);
  const database: DatabaseManager = testDatabase.database;
  await createMigrator({ database, sources: aiEmployeeMigrations }).latest();
  const repositories = new RepositoryFactory({
    connection: database.connection(),
    generateId: () => String(generatedId++),
  });
  const cleanerRepositories = {
    conversations: repositories.aiConversations,
    messages: repositories.aiMessages,
    checkpoints: repositories.lcCheckpoints,
    blobs: repositories.lcCheckpointBlobs,
    writes: repositories.lcCheckpointWrites,
  };
  const cleaner = new CheckpointCleaner(
    database.connection(),
    cleanerRepositories,
  );

  async function conversation(
    sessionId: string,
    options: {
      thread: number;
      updatedAt?: Date;
      messageAt?: Date | null;
      toolCalls?: unknown[];
      /** The two messages' ids, earlier first; generated when omitted. */
      messageIds?: readonly [string, string];
    },
  ): Promise<void> {
    await repositories.aiConversations.create({
      values: {
        sessionId,
        thread: options.thread,
        category: 'chat',
        read: true,
        createdAt: old,
        updatedAt: options.updatedAt ?? old,
      },
    });
    if (options.messageAt !== null) {
      await repositories.aiMessages.create({
        values: {
          sessionId,
          ...(options.messageIds ? { messageId: options.messageIds[0] } : {}),
          role: 'user',
          content: { type: 'text', content: 'earlier' },
          createdAt: old,
          updatedAt: old,
        },
      });
      await repositories.aiMessages.create({
        values: {
          sessionId,
          ...(options.messageIds ? { messageId: options.messageIds[1] } : {}),
          role: 'assistant',
          content: { type: 'text', content: 'latest' },
          ...(options.toolCalls ? { toolCalls: options.toolCalls } : {}),
          createdAt: options.messageAt ?? old,
          updatedAt: options.messageAt ?? old,
        },
      });
    }
    for (let thread = 0; thread <= options.thread; thread++) {
      const threadId = `${sessionId}:${thread}`;
      await repositories.lcCheckpoints.create({
        values: {
          threadId,
          checkpointNs: '',
          checkpointId: 'checkpoint-1',
          checkpoint: { v: 1 },
          metadata: {},
        },
      });
      await repositories.lcCheckpointBlobs.create({
        values: {
          threadId,
          checkpointNs: '',
          channel: 'messages',
          version: '1',
          type: 'json',
          blob: new Uint8Array([1]),
        },
      });
      await repositories.lcCheckpointWrites.create({
        values: {
          threadId,
          checkpointNs: '',
          checkpointId: 'checkpoint-1',
          taskId: 'task-1',
          idx: 0,
          channel: 'messages',
          type: 'json',
          blob: new Uint8Array([1]),
        },
      });
    }
  }

  /** How many rows each checkpoint table holds for a conversation's threads. */
  async function checkpointRows(sessionId: string, thread: number) {
    const threadId = {
      $in: Array.from(
        { length: thread + 1 },
        (_value, index) => `${sessionId}:${index}`,
      ),
    };
    return [
      await repositories.lcCheckpoints.count({ filter: { threadId } }),
      await repositories.lcCheckpointBlobs.count({ filter: { threadId } }),
      await repositories.lcCheckpointWrites.count({ filter: { threadId } }),
    ];
  }

  async function threadOf(sessionId: string): Promise<number> {
    const row = await repositories.aiConversations.findOne({
      filter: { sessionId },
    });
    return Number(row?.thread);
  }

  return {
    cleaner,
    cleanerRepositories,
    database,
    repositories,
    conversation,
    checkpointRows,
    threadOf,
  };
}

describe('CheckpointCleaner', () => {
  it('releases an unused conversation: every thread checkpoint goes, every message stays', async () => {
    const { cleaner, repositories, conversation, checkpointRows, threadOf } =
      await setup();
    await conversation(session(1), { thread: 2 });

    await expect(cleaner.cleanOutdated(expiredAt)).resolves.toBe(1);

    expect(await threadOf(session(1))).toBe(RELEASED_THREAD);
    expect(await checkpointRows(session(1), 2)).toEqual([0, 0, 0]);
    expect(
      await repositories.aiMessages.count({
        filter: { sessionId: session(1) },
      }),
    ).toBe(2);
  });

  it('keeps every conversation that is still in use, waiting, empty or already released', async () => {
    const { cleaner, conversation, checkpointRows, threadOf } = await setup();
    // Used recently.
    await conversation(session(1), { thread: 1, updatedAt: recent });
    // Its latest message changed recently, as a tool call status does.
    await conversation(session(2), { thread: 1, messageAt: recent });
    // Its latest message asks for a tool call, which may await a decision.
    await conversation(session(3), {
      thread: 1,
      toolCalls: [{ id: 'call-1', name: 'lookup', args: {} }],
    });
    // Nothing to replay it from.
    await conversation(session(4), { thread: 1, messageAt: null });
    // Released already.
    await conversation(session(5), { thread: 0 });

    await expect(cleaner.cleanOutdated(expiredAt)).resolves.toBe(0);

    for (const index of [1, 2, 3, 4]) {
      expect(await threadOf(session(index))).toBe(1);
      expect(await checkpointRows(session(index), 1)).toEqual([2, 2, 2]);
    }
    expect(await checkpointRows(session(5), 0)).toEqual([1, 1, 1]);
  });

  it('finds the latest message by an id beyond what a JavaScript number holds', async () => {
    const { cleaner, conversation, checkpointRows, threadOf } = await setup();
    // Rounded to a number, both ids are 9007199254740992, which names the
    // earlier message, so the call the latest one asks for would go unseen.
    await conversation(session(1), {
      thread: 1,
      messageIds: ['9007199254740992', '9007199254740993'],
      toolCalls: [{ id: 'call-1', name: 'lookup', args: {} }],
    });

    await expect(cleaner.cleanOutdated(expiredAt)).resolves.toBe(0);

    expect(await threadOf(session(1))).toBe(1);
    expect(await checkpointRows(session(1), 1)).toEqual([2, 2, 2]);
  });

  it('reads the latest messages of a whole batch at once', async () => {
    const { cleaner, cleanerRepositories, conversation } = await setup();
    for (const index of [1, 2, 3, 4, 5])
      await conversation(session(index), { thread: 1 });
    const find = vi.spyOn(cleanerRepositories.messages, 'find');
    const findOne = vi.spyOn(cleanerRepositories.messages, 'findOne');

    await expect(cleaner.cleanOutdated(expiredAt)).resolves.toBe(5);

    expect(find).toHaveBeenCalledOnce();
    expect(findOne).not.toHaveBeenCalled();
  });

  it('goes through every batch, past the conversations it keeps', async () => {
    const { cleaner, conversation, checkpointRows, threadOf } = await setup();
    for (const index of [1, 2, 3, 4, 5, 6, 7]) {
      await conversation(session(index), {
        thread: 1,
        // Every other one is kept, so no batch is released whole.
        ...(index % 2 === 0 ? { updatedAt: recent } : {}),
      });
    }

    await expect(
      cleaner.cleanOutdated(expiredAt, { batchSize: 2 }),
    ).resolves.toBe(4);

    for (const index of [1, 3, 5, 7]) {
      expect(await threadOf(session(index))).toBe(RELEASED_THREAD);
      expect(await checkpointRows(session(index), 1)).toEqual([0, 0, 0]);
    }
    for (const index of [2, 4, 6]) {
      expect(await threadOf(session(index))).toBe(1);
      expect(await checkpointRows(session(index), 1)).toEqual([2, 2, 2]);
    }
  });

  it('leaves a conversation alone when a run starts on it while it is examined', async () => {
    const { database, cleanerRepositories, conversation, checkpointRows } =
      await setup();
    await conversation(session(1), { thread: 1 });
    const { conversations, messages } = cleanerRepositories;
    // A run starting now updates the conversation before reading its thread.
    const cleaner = new CheckpointCleaner(database.connection(), {
      ...cleanerRepositories,
      messages: Object.assign(Object.create(messages), {
        find: async (...args: Parameters<typeof messages.find>) => {
          await conversations.update({
            values: { llmActiveState: 'streaming', updatedAt: new Date() },
            filter: { sessionId: session(1) },
          });
          return messages.find(...args);
        },
      }),
    });

    await expect(cleaner.cleanOutdated(expiredAt)).resolves.toBe(0);

    expect(
      await conversations.findOne({ filter: { sessionId: session(1) } }),
    ).toMatchObject({ thread: 1 });
    expect(await checkpointRows(session(1), 1)).toEqual([2, 2, 2]);
  });

  it('stops before the next batch once its signal is aborted', async () => {
    const { cleaner, conversation, threadOf } = await setup();
    await conversation(session(1), { thread: 1 });
    const controller = new AbortController();
    controller.abort();

    await expect(
      cleaner.cleanOutdated(expiredAt, { signal: controller.signal }),
    ).resolves.toBe(0);

    expect(await threadOf(session(1))).toBe(1);
  });
});
