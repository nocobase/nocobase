import { afterEach, describe, expect, it } from 'vitest';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';
import { RepositoryFactory } from '../server/factory/repository-factory.js';
import { aiEmployeeMigrations } from './support/migrations.js';

const testDatabases: TestDatabase[] = [];

async function createDatabase(): Promise<DatabaseManager> {
  const testDatabase = await createTestDatabase();
  testDatabases.push(testDatabase);
  const { database } = testDatabase;
  await createMigrator({ database, sources: aiEmployeeMigrations }).latest();
  return database;
}

let generatedId = 1000n;

/**
 * A factory that generates numeric identifiers, as the application's
 * Snowflake generator does: `aiToolMessages.id` and `aiUsageEvents.id` are
 * bigint columns, which only SQLite accepts a UUID string into.
 */
function repositoryFactory(database: DatabaseManager): RepositoryFactory {
  return new RepositoryFactory({
    connection: database.connection(),
    generateId: () => String(generatedId++),
  });
}

afterEach(async () => {
  await Promise.all(
    testDatabases.splice(0).map((testDatabase) => testDatabase.destroy()),
  );
});

describe('native AI employee persistence', () => {
  it('resolves logical field types after running the complete migration chain', async () => {
    const database = await createDatabase();
    const connection = database.connection();
    const employee = await connection.collections.get('aiEmployees');
    for (const name of [
      'enabled',
      'builtIn',
      'deprecated',
      'enableKnowledgeBase',
    ]) {
      expect(
        employee?.fields.find((field) => field.name === name),
      ).toMatchObject({
        type: 'boolean',
      });
    }
    expect(
      employee?.fields.find((field) => field.name === 'sort'),
    ).toMatchObject({
      type: 'integer',
    });
    await expect(
      connection.collectionMetadata.get('aiEmployees'),
    ).resolves.toMatchObject({
      document: {
        fields: {
          enabled: { type: 'boolean' },
          skillSettings: { type: 'json' },
          sort: { type: 'integer' },
        },
      },
    });
    const files = await connection.collections.get('aiFiles');
    expect(files?.fields.some((field) => field.name === 'disk')).toBe(true);
    expect(files?.fields.some((field) => field.name === 'storageId')).toBe(
      false,
    );
    const settings = await connection.collections.get('aiSettings');
    expect(
      settings?.fields.some((field) => field.name === 'defaultLlmService'),
    ).toBe(true);
  });

  it('creates native tables and shares records across repository factories', async () => {
    const database = await createDatabase();
    const first = repositoryFactory(database);
    const second = repositoryFactory(database);
    await first.aiEmployees.create({
      values: {
        username: 'nathan',
        nickname: 'Nathan',
        description: 'Developer assistant',
        enabled: true,
        builtIn: true,
        category: 'developer',
        deprecated: false,
        enableKnowledgeBase: false,
      },
    });
    await first.usersAiEmployees.create({
      values: {
        userId: 'user-1',
        aiEmployee: 'nathan',
        prompt: 'Keep answers concise',
      },
    });
    await first.aiConversations.create({
      values: {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        aiEmployeeUsername: 'nathan',
        thread: 1,
        read: true,
      },
    });
    await first.aiMessages.create({
      values: {
        messageId: '9007199254740993',
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'assistant',
        content: { type: 'text', content: 'hello' },
      },
    });
    expect(
      await second.aiEmployees.findOne({ filter: { username: 'nathan' } }),
    ).toMatchObject({
      nickname: 'Nathan',
      description: 'Developer assistant',
      enabled: true,
      builtIn: true,
      deprecated: false,
      enableKnowledgeBase: false,
    });
    expect(
      await second.aiMessages.find({
        filter: { sessionId: '123e4567-e89b-12d3-a456-426614174000' },
        sort: ['-messageId'],
      }),
    ).toHaveLength(1);
    expect(
      await second.aiMessages.findOne({
        filter: { messageId: '9007199254740993' },
      }),
    ).toMatchObject({ content: { type: 'text', content: 'hello' } });
  });

  it('filters nullable fields with SQL null semantics', async () => {
    const database = await createDatabase();
    const repositories = repositoryFactory(database);
    const messageId = '9007199254740993';
    await repositories.aiToolMessages.create({
      values: [
        {
          messageId,
          toolCallId: 'not-interrupted',
          toolName: 'exampleTool',
          invokeStatus: 'done',
          interruptActionOrder: null,
        },
        {
          messageId,
          toolCallId: 'interrupt-0',
          toolName: 'exampleTool',
          invokeStatus: 'waiting',
          interruptActionOrder: 0,
        },
        {
          messageId,
          toolCallId: 'interrupt-1',
          toolName: 'exampleTool',
          invokeStatus: 'waiting',
          interruptActionOrder: 1,
        },
      ],
    });

    await expect(
      repositories.aiToolMessages.find({
        filter: {
          messageId,
          interruptActionOrder: { $ne: null as unknown as number },
        },
        sort: ['interruptActionOrder'],
      }),
    ).resolves.toMatchObject([
      { toolCallId: 'interrupt-0', interruptActionOrder: 0 },
      { toolCallId: 'interrupt-1', interruptActionOrder: 1 },
    ]);
    await expect(
      repositories.aiToolMessages.find({
        filter: {
          messageId,
          interruptActionOrder: null as unknown as number,
        },
      }),
    ).resolves.toMatchObject([{ toolCallId: 'not-interrupted' }]);
  });

  it('sorts AI employee lists by sort ascending by default', async () => {
    const database = await createDatabase();
    const repositories = repositoryFactory(database);
    await repositories.aiEmployees.create({
      values: [
        {
          username: 'third',
          sort: 30,
          skillSettings: { skills: [], tools: [] },
        },
        {
          username: 'first',
          sort: 10,
          skillSettings: { skills: [], tools: [] },
        },
        {
          username: 'second',
          sort: 20,
          skillSettings: { skills: [], tools: [] },
        },
      ],
    });

    await expect(repositories.aiEmployees.find()).resolves.toMatchObject([
      { username: 'first', sort: 10 },
      { username: 'second', sort: 20 },
      { username: 'third', sort: 30 },
    ]);
  });

  it('round-trips plain-text values stored in JSON tool-message content', async () => {
    const database = await createDatabase();
    const repositories = repositoryFactory(database);
    const toolMessage = await repositories.aiToolMessages.create({
      values: {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        messageId: '9007199254740993',
        toolCallId: 'tool-call-1',
        toolName: 'exampleTool',
        invokeStatus: 'pending',
      },
    });
    const content =
      'The user ignored the application for tools usage and continued asking questions';
    const invokeStartTime = new Date('2026-08-26T02:17:53.814+08:00');
    const invokeEndTime = '2026-08-26T02:17:54.814+08:00';

    await repositories.aiToolMessages.update({
      values: {
        invokeStatus: 'confirmed',
        status: 'success',
        content,
        invokeStartTime,
        invokeEndTime,
      },
      filter: { id: toolMessage.id, invokeStatus: 'pending' },
    });

    await expect(
      repositories.aiToolMessages.findOne({ filter: { id: toolMessage.id } }),
    ).resolves.toMatchObject({
      invokeStatus: 'confirmed',
      status: 'success',
      content,
      invokeStartTime: String(invokeStartTime.getTime()),
      invokeEndTime: String(Date.parse(invokeEndTime)),
    });
  });

  it('round-trips array-backed JSON fields used by LLM service configuration', async () => {
    const database = await createDatabase();
    const repositories = repositoryFactory(database);
    await repositories.llmServices.create({
      values: {
        name: 'openai',
        title: 'OpenAI',
        provider: 'openai',
        options: { apiKey: 'secret' },
        enabledModels: ['gpt-4o', 'gpt-4.1'],
        enabled: true,
        sort: 0,
      },
    });

    await expect(
      repositories.llmServices.findOne({ filter: { name: 'openai' } }),
    ).resolves.toMatchObject({
      options: { apiKey: 'secret' },
      enabledModels: ['gpt-4o', 'gpt-4.1'],
    });
  });

  it.each(['0', 'false', '{"enabled":false}', '"quoted"'])(
    'preserves JSON-looking text in tool-message content: %s',
    async (content) => {
      const database = await createDatabase();
      const repositories = repositoryFactory(database);
      const tool = await repositories.aiToolMessages.create({
        values: { toolCallId: 'json-text', content, auto: false },
      });
      await expect(
        repositories.aiToolMessages.findOne({ filter: { id: tool.id } }),
      ).resolves.toMatchObject({ content, auto: false });
      await expect(
        database
          .query()
          .selectFrom('aiToolMessages')
          .select('content')
          .where('id', '=', tool.id)
          .value('content'),
      ).resolves.toBe(content);
    },
  );

  it('rolls back transaction-bound repository writes', async () => {
    const database = await createDatabase();
    const repositories = repositoryFactory(database);
    await expect(
      database.transaction(async (connection) => {
        await repositories.aiEmployees.create(
          {
            values: {
              username: 'rollback',
              enabled: true,
              builtIn: false,
              category: 'business',
              deprecated: false,
              enableKnowledgeBase: false,
            },
          },
          { connection },
        );
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(
      await repositories.aiEmployees.findOne({
        filter: { username: 'rollback' },
      }),
    ).toBeNull();
  });

  it('round-trips checkpoint blobs without a JSON record store', async () => {
    const database = await createDatabase();
    const repositories = repositoryFactory(database);
    const blob = Uint8Array.from([0, 1, 2, 255]);
    await repositories.lcCheckpointBlobs.create({
      values: {
        threadId: 'thread',
        checkpointNs: '',
        channel: 'messages',
        version: '1',
        type: 'bytes',
        blob,
      },
    });
    const restored = await repositories.lcCheckpointBlobs.findOne({
      filter: {
        threadId: 'thread',
        checkpointNs: '',
        channel: 'messages',
        version: '1',
      },
    });
    expect(Array.from(restored?.blob as Uint8Array)).toEqual([0, 1, 2, 255]);
  });
});
