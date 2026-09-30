import { fileURLToPath } from 'node:url';
import type { AIMessage } from '@nocobase/ai-employee';
import sqlite from '@nocobase/db-sqlite';
import {
  createDatabaseManager,
  createMigrator,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildAIUsageEventValues,
  normalizeUsageMetadata,
  recordAIUsageEventsForMessages,
} from '../server/agent/conversation/persistence/usage-events.js';
import { createAIChatConversation } from '../server/agent/conversation/persistence/ai-chat-conversation.js';
import { RepositoryFactory } from '../server/factory/repository-factory.js';
import { DatabaseAIUsageEventRepository } from '../server/repository/database/ai-usage-event.js';

const SESSION_ID = '123e4567-e89b-12d3-a456-426614174000';
const ROLLBACK_SESSION_ID = '123e4567-e89b-12d3-a456-426614174001';
const managers: DatabaseManager[] = [];

function message(overrides: Partial<AIMessage> = {}): AIMessage {
  return {
    messageId: '9007199254740993',
    sessionId: SESSION_ID,
    role: 'nathan',
    createdAt: '2026-07-06T01:02:03.004Z',
    content: { type: 'text', content: 'Done' },
    metadata: {
      provider: 'openai',
      llmService: 'primary-openai',
      model: 'gpt-5.2',
      usage_metadata: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15,
      },
      response_metadata: { id: 'response-1' },
      autoCallTools: ['search'],
    },
    toolCalls: [{ id: 'tool-1', name: 'search', type: 'function', args: {} }],
    ...overrides,
  };
}

async function createDatabase(): Promise<DatabaseManager> {
  const database = createDatabaseManager({
    drivers: { sqlite },
    default: 'main',
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });
  managers.push(database);
  await database.connect();
  const builder = database.builder();
  await builder.createCollection('user', (collection) => {
    collection.string('id').notNull();
    collection.primary('id');
  });
  await builder.createCollection('roles', (collection) => {
    collection.string('name').notNull();
    collection.boolean('allowNewAiEmployee').nullable();
    collection.primary('name');
  });
  const migrator = createMigrator({
    database,
    packageName: '@nocobase/app-plugin-ai-employee',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  });
  await migrator.latest();
  return database;
}

async function seedConversation(
  repositories: RepositoryFactory,
  sessionId: string,
): Promise<void> {
  const employee = await repositories.aiEmployees.findOne({
    filter: { username: 'nathan' },
  });
  if (!employee) {
    await repositories.aiEmployees.create({
      values: {
        username: 'nathan',
        nickname: 'Nathan',
        enabled: true,
        builtIn: false,
        category: 'business',
        deprecated: false,
        enableKnowledgeBase: false,
      },
    });
  }
  await repositories.aiConversations.create({
    values: {
      sessionId,
      aiEmployeeUsername: 'nathan',
      from: 'sub-agent',
      category: 'chat',
      thread: 0,
      read: true,
    },
  });
}

afterEach(async () => {
  await Promise.all(managers.splice(0).map((database) => database.destroy()));
});

describe('AI usage metadata normalization', () => {
  it('normalizes snake_case, string, floating-point, and nested token fields', () => {
    expect(
      normalizeUsageMetadata({
        prompt_tokens: '12',
        completion_tokens: 8.7,
        prompt_tokens_details: { cached_tokens: '3.9' },
        completion_tokens_details: { reasoning_tokens: 2.8 },
      }),
    ).toEqual({
      inputTokens: 12,
      outputTokens: 8,
      totalTokens: 20,
      cachedTokens: 3,
      reasoningTokens: 2,
    });
  });

  it('normalizes camelCase and alternate nested provider fields', () => {
    expect(
      normalizeUsageMetadata({
        inputTokens: 7,
        completionTokens: '4',
        totalTokens: '15',
        input_token_details: { cache_read: 6 },
        output_token_details: { reasoning: 5 },
      }),
    ).toEqual({
      inputTokens: 7,
      outputTokens: 4,
      totalTokens: 15,
      cachedTokens: 6,
      reasoningTokens: 5,
    });
  });

  it.each([
    [{ cached_tokens: 4 }, 4],
    [{ cachedTokens: 4 }, 4],
    [{ input_token_details: { cache_read: 4 } }, 4],
    [{ input_token_details: { cached_tokens: 4 } }, 4],
    [{ prompt_tokens_details: { cached_tokens: 4 } }, 4],
  ])('normalizes cached token variant %#', (usage, expected) => {
    expect(normalizeUsageMetadata(usage).cachedTokens).toBe(expected);
  });

  it.each([
    [{ reasoning_tokens: 5 }, 5],
    [{ reasoningTokens: 5 }, 5],
    [{ output_token_details: { reasoning: 5 } }, 5],
    [{ completion_tokens_details: { reasoning_tokens: 5 } }, 5],
  ])('normalizes reasoning token variant %#', (usage, expected) => {
    expect(normalizeUsageMetadata(usage).reasoningTokens).toBe(expected);
  });

  it('clamps negatives and treats non-finite or unsupported values as zero', () => {
    expect(
      normalizeUsageMetadata({
        input_tokens: -4.8,
        output_tokens: 'not-a-number',
        total_tokens: Number.POSITIVE_INFINITY,
        cached_tokens: Number.NaN,
        reasoning_tokens: null,
      }),
    ).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cachedTokens: 0,
      reasoningTokens: 0,
    });
  });
});

describe('AI usage event values', () => {
  it('builds complete values with conversation dimensions and raw metadata', () => {
    const values = buildAIUsageEventValues(SESSION_ID, message(), {
      userId: 7,
      aiEmployeeUsername: 'nathan',
      from: 'sub-agent',
      category: 'task',
    });

    expect(values).toMatchObject({
      sessionId: SESSION_ID,
      messageId: '9007199254740993',
      userId: 7,
      aiEmployeeUsername: 'nathan',
      from: 'sub-agent',
      category: 'task',
      eventType: 'llm_message',
      role: 'nathan',
      provider: 'openai',
      llmService: 'primary-openai',
      model: 'gpt-5.2',
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
      cachedTokens: 0,
      reasoningTokens: 0,
      toolCallCount: 1,
      autoToolCallCount: 1,
      status: 'success',
      rawUsageMetadata: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15,
      },
      rawResponseMetadata: { id: 'response-1' },
    });
    expect(values?.occurredAt.toISOString()).toBe('2026-07-06T01:02:03.004Z');
    expect(values?.occurredHour).toBe(
      Math.floor(Date.parse('2026-07-06T01:02:03.004Z') / 3_600_000),
    );
  });

  it.each(['user', 'tool', 'system'])('skips %s messages', (role) => {
    expect(
      buildAIUsageEventValues(SESSION_ID, message({ role }), {}),
    ).toBeNull();
  });

  it('skips messages without provider, model, or message ID', () => {
    expect(
      buildAIUsageEventValues(
        SESSION_ID,
        message({ metadata: { model: 'gpt-5.2' } }),
        {},
      ),
    ).toBeNull();
    expect(
      buildAIUsageEventValues(
        SESSION_ID,
        message({ metadata: { provider: 'openai' } }),
        {},
      ),
    ).toBeNull();
    expect(
      buildAIUsageEventValues(SESSION_ID, message({ messageId: '' }), {}),
    ).toBeNull();
  });

  it('uses defaults and the current time for an invalid createdAt value', () => {
    const before = Date.now();
    const values = buildAIUsageEventValues(
      SESSION_ID,
      message({ createdAt: 'invalid', toolCalls: undefined }),
      {},
    );
    const after = Date.now();

    expect(values).toMatchObject({
      from: 'main-agent',
      category: 'chat',
      eventType: 'llm_message',
      status: 'success',
      toolCallCount: 0,
    });
    expect(values?.occurredAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(values?.occurredAt.getTime()).toBeLessThanOrEqual(after);
  });
});

describe('AI usage event repository behavior', () => {
  it('passes one connection to the atomic upsert', async () => {
    const transaction = { id: 'transaction' } as unknown as DatabaseConnection;
    const conversations = {
      findOne: vi.fn(async () => ({ from: 'main-agent', category: 'chat' })),
    };
    const usageEvents = { upsert: vi.fn(async () => undefined) };
    const repositories = { conversations, usageEvents } as never;

    await recordAIUsageEventsForMessages(
      SESSION_ID,
      [message()],
      repositories,
      transaction,
    );

    expect(conversations.findOne).toHaveBeenCalledWith(
      { filter: { sessionId: SESSION_ID } },
      { connection: transaction },
    );
    expect(usageEvents.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: '9007199254740993',
        eventType: 'llm_message',
      }),
      { connection: transaction },
    );
  });

  it('propagates upsert failures', async () => {
    const failure = new Error('database unavailable');
    await expect(
      recordAIUsageEventsForMessages(SESSION_ID, [message()], {
        conversations: { findOne: vi.fn(async () => ({})) },
        usageEvents: { upsert: vi.fn().mockRejectedValue(failure) },
      } as never),
    ).rejects.toBe(failure);
  });

  it('does not query a conversation for skipped messages and creates no orphan', async () => {
    const conversations = { findOne: vi.fn(async () => null) };
    const usageEvents = { upsert: vi.fn() };
    await recordAIUsageEventsForMessages(
      SESSION_ID,
      [message({ role: 'user' })],
      { conversations, usageEvents } as never,
    );
    expect(conversations.findOne).not.toHaveBeenCalled();

    await recordAIUsageEventsForMessages(SESSION_ID, [message()], {
      conversations,
      usageEvents,
    } as never);
    expect(usageEvents.upsert).not.toHaveBeenCalled();
  });
});

describe('database AI usage event upsert', () => {
  function values() {
    const result = buildAIUsageEventValues(SESSION_ID, message(), {});
    if (!result) throw new Error('Expected a recordable usage event');
    return result;
  }

  it('rolls back a unique conflict to a savepoint before updating', async () => {
    const savepoint = { id: 'savepoint' } as unknown as DatabaseConnection;
    const transaction = vi.fn(
      async (callback: (connection: DatabaseConnection) => Promise<unknown>) =>
        callback(savepoint),
    );
    const connection = { transaction } as unknown as DatabaseConnection;
    const repository = new DatabaseAIUsageEventRepository(
      connection,
      () => '1000',
    );
    vi.spyOn(repository, 'findOne').mockResolvedValue(null);
    vi.spyOn(repository, 'create').mockRejectedValue({
      code: 'SQLITE_CONSTRAINT_UNIQUE',
    });
    const update = vi.spyOn(repository, 'update').mockResolvedValue(1);

    await repository.upsert(values(), { connection });

    expect(transaction).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          messageId: '9007199254740993',
          eventType: 'llm_message',
        },
      }),
      { connection },
    );
  });

  it('does not retry non-unique errors', async () => {
    const failure = new Error('database unavailable');
    const connection = {
      transaction: vi.fn(async () => Promise.reject(failure)),
    } as unknown as DatabaseConnection;
    const repository = new DatabaseAIUsageEventRepository(
      connection,
      () => '1000',
    );
    const update = vi.spyOn(repository, 'update');

    await expect(repository.upsert(values(), { connection })).rejects.toBe(
      failure,
    );
    expect(update).not.toHaveBeenCalled();
  });
});

describe('AI usage event database integration', () => {
  it('persists normalized events, remains idempotent, and enforces the unique key', async () => {
    const database = await createDatabase();
    let generatedId = 1000n;
    const repositories = new RepositoryFactory({
      connection: database.connection(),
      generateId: () => String(generatedId++),
    });
    await seedConversation(repositories, SESSION_ID);

    await recordAIUsageEventsForMessages(SESSION_ID, [message()], {
      conversations: repositories.aiConversations,
      usageEvents: repositories.aiUsageEvents,
    });
    await recordAIUsageEventsForMessages(
      SESSION_ID,
      [message({ metadata: { ...message().metadata, model: 'gpt-5.3' } })],
      {
        conversations: repositories.aiConversations,
        usageEvents: repositories.aiUsageEvents,
      },
    );

    expect(await repositories.aiUsageEvents.count()).toBe(1);
    await expect(
      repositories.aiUsageEvents.findOne({
        filter: { messageId: '9007199254740993' },
      }),
    ).resolves.toMatchObject({
      id: '1000',
      occurredAt: String(Date.parse('2026-07-06T01:02:03.004Z')),
      occurredHour: String(
        Math.floor(Date.parse('2026-07-06T01:02:03.004Z') / 3_600_000),
      ),
      sessionId: SESSION_ID,
      aiEmployeeUsername: 'nathan',
      from: 'sub-agent',
      category: 'chat',
      eventType: 'llm_message',
      provider: 'openai',
      model: 'gpt-5.3',
      inputTokens: '10',
      outputTokens: '5',
      totalTokens: '15',
      rawUsageMetadata: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15,
      },
      rawResponseMetadata: { id: 'response-1' },
    });

    const duplicate = buildAIUsageEventValues(SESSION_ID, message(), {});
    await expect(
      repositories.aiUsageEvents.create({ values: duplicate ?? {} }),
    ).rejects.toBeDefined();
  });

  it('keeps concurrent processing idempotent', async () => {
    const database = await createDatabase();
    let generatedId = 1500n;
    const repositories = new RepositoryFactory({
      connection: database.connection(),
      generateId: () => String(generatedId++),
    });
    await seedConversation(repositories, SESSION_ID);
    const dependencies = {
      conversations: repositories.aiConversations,
      usageEvents: repositories.aiUsageEvents,
    };

    await Promise.all([
      recordAIUsageEventsForMessages(SESSION_ID, [message()], dependencies),
      recordAIUsageEventsForMessages(SESSION_ID, [message()], dependencies),
    ]);

    expect(await repositories.aiUsageEvents.count()).toBe(1);
  });

  it('writes messages and usage events together and rolls both back on failure', async () => {
    const database = await createDatabase();
    let generatedId = 2000n;
    const repositories = new RepositoryFactory({
      connection: database.connection(),
      generateId: () => String(generatedId++),
    });
    await seedConversation(repositories, SESSION_ID);
    await seedConversation(repositories, ROLLBACK_SESSION_ID);
    const snowflake = { generate: () => String(generatedId++) };
    const conversation = createAIChatConversation({
      messages: repositories.aiMessages,
      conversations: repositories.aiConversations,
      usageEvents: repositories.aiUsageEvents,
      database: database.connection(),
      snowflake,
      sessionId: SESSION_ID,
    } as never);

    await conversation.withTransaction(async (target) => {
      await target.addMessages({
        role: 'nathan',
        content: { type: 'text', content: 'Committed' },
        metadata: message().metadata,
      });
    });

    expect(await repositories.aiMessages.count()).toBe(1);
    expect(await repositories.aiUsageEvents.count()).toBe(1);

    const rollbackConversation = createAIChatConversation({
      messages: repositories.aiMessages,
      conversations: repositories.aiConversations,
      usageEvents: repositories.aiUsageEvents,
      database: database.connection(),
      snowflake,
      sessionId: ROLLBACK_SESSION_ID,
    } as never);
    await expect(
      rollbackConversation.withTransaction(async (target) => {
        await target.addMessages({
          role: 'nathan',
          content: { type: 'text', content: 'Rolled back' },
          metadata: message().metadata,
        });
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    expect(await repositories.aiMessages.count()).toBe(1);
    expect(await repositories.aiUsageEvents.count()).toBe(1);
    expect(
      await repositories.aiMessages.findOne({
        filter: { sessionId: ROLLBACK_SESSION_ID },
      }),
    ).toBeNull();
    expect(
      await repositories.aiUsageEvents.findOne({
        filter: { sessionId: ROLLBACK_SESSION_ID },
      }),
    ).toBeNull();
  });
});
