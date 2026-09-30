import { fileURLToPath } from 'node:url';
import sqlite from '@nocobase/db-sqlite';
import {
  createDatabaseManager,
  createMigrator,
  loadMigrations,
  type DatabaseManager,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const MIGRATION_NAME = '202609300001_add_ai_usage_event_occurred_hour';
const HOUR_IN_MS = 3_600_000;
const directory = fileURLToPath(
  new URL('../database/migrations', import.meta.url),
);

type UsageRow = {
  id: number;
  occurredAt: number;
  occurredHour: number | null;
};

let database: DatabaseManager;

async function loadOccurredHourMigration(): Promise<MigrationDefinition> {
  const migrations = await loadMigrations({
    packageName: '@nocobase/app-plugin-ai-employee',
    directory,
  });
  const loaded = migrations.find((entry) => entry.name === MIGRATION_NAME);
  if (!loaded) throw new Error(`${MIGRATION_NAME} was not discovered`);
  return loaded.migration;
}

function migrationContext(): MigrationContext {
  return {
    builder: database.builder(),
    query: database.connection().query,
  } as unknown as MigrationContext;
}

/** SQLite caps the terms of one compound insert, so rows go in chunks. */
const INSERT_CHUNK_SIZE = 100;

async function seedUsageEvents(
  rows: readonly { id: number; occurredAt: number }[],
): Promise<void> {
  for (let start = 0; start < rows.length; start += INSERT_CHUNK_SIZE) {
    await insertUsageEvents(rows.slice(start, start + INSERT_CHUNK_SIZE));
  }
}

async function insertUsageEvents(
  rows: readonly { id: number; occurredAt: number }[],
): Promise<void> {
  await database
    .connection()
    .query.insertInto('aiUsageEvents')
    .values(
      rows.map((row) => ({
        id: row.id,
        occurredAt: row.occurredAt,
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        messageId: row.id,
        from: 'main-agent',
        category: 'chat',
        eventType: 'llm_message',
        role: 'assistant',
        model: 'gpt-5.2',
        inputTokens: 1,
        outputTokens: 2,
        totalTokens: 3,
        cachedTokens: 0,
        reasoningTokens: 0,
        toolCallCount: 0,
        autoToolCallCount: 0,
        status: 'success',
      })),
    )
    .execute();
}

/** The SQLite driver returns bigint columns as strings. */
async function readUsageEvents(): Promise<UsageRow[]> {
  const rows = await database
    .connection()
    .query.selectFrom('aiUsageEvents')
    .select(['id', 'occurredAt', 'occurredHour'])
    .orderBy('id', 'asc')
    .execute<Record<string, unknown>>();
  return rows.map((row) => ({
    id: Number(row.id),
    occurredAt: Number(row.occurredAt),
    occurredHour: row.occurredHour === null ? null : Number(row.occurredHour),
  }));
}

beforeEach(async () => {
  database = createDatabaseManager({
    drivers: { sqlite },
    default: 'main',
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });
  await database.connect();
  const builder = database.builder();
  await builder.createCollection('user', (collection) => {
    collection.string('id').notNull();
    collection.primary('id');
  });
  await builder.createCollection('roles', (collection) => {
    collection.string('name').notNull();
    collection.primary('name');
  });
  await createMigrator({
    database,
    packageName: '@nocobase/app-plugin-ai-employee',
    directory,
  }).latest();
});

afterEach(async () => {
  await database.disconnect();
});

describe('202609300001_add_ai_usage_event_occurred_hour', () => {
  it('backfills the hour bucket of every existing event', async () => {
    const migration = await loadOccurredHourMigration();
    await migration.down?.(migrationContext());

    const rows = [
      { id: 1, occurredAt: Date.UTC(2026, 8, 20, 10, 0, 0) },
      { id: 2, occurredAt: Date.UTC(2026, 8, 20, 10, 59, 59, 999) },
      { id: 3, occurredAt: Date.UTC(2026, 8, 20, 11, 0, 0) },
      { id: 4, occurredAt: 0 },
    ];
    await seedUsageEvents(rows);

    await migration.up(migrationContext());

    expect(await readUsageEvents()).toEqual(
      rows.map((row) => ({
        id: row.id,
        occurredAt: row.occurredAt,
        occurredHour: Math.floor(row.occurredAt / HOUR_IN_MS),
      })),
    );
  });

  it('backfills across more rows than one batch', async () => {
    const migration = await loadOccurredHourMigration();
    await migration.down?.(migrationContext());

    const base = Date.UTC(2026, 8, 1);
    const rows = Array.from({ length: 1201 }, (_, index) => ({
      id: index + 1,
      occurredAt: base + index * 5 * 60_000,
    }));
    await seedUsageEvents(rows);

    await migration.up(migrationContext());

    const stored = new Map(
      (await readUsageEvents()).map((row) => [row.id, row.occurredHour]),
    );
    expect(stored.size).toBe(rows.length);
    for (const row of rows) {
      expect(stored.get(row.id)).toBe(Math.floor(row.occurredAt / HOUR_IN_MS));
    }
  });

  it('adds an index on the hour bucket and removes both on down', async () => {
    const connection = database.connection();
    const migration = await loadOccurredHourMigration();

    const afterUp = await connection.schemaInspector.getPhysicalCollection({
      tableName: 'ai_usage_events',
    });
    expect(afterUp?.columns.map((column) => column.columnName)).toContain(
      'occurred_hour',
    );
    expect(afterUp?.indexes.map((index) => index.name)).toContain(
      'idx_ai_usage_events_hour',
    );

    await migration.down?.(migrationContext());

    const afterDown = await connection.schemaInspector.getPhysicalCollection({
      tableName: 'ai_usage_events',
    });
    expect(afterDown?.columns.map((column) => column.columnName)).not.toContain(
      'occurred_hour',
    );
    expect(afterDown?.indexes.map((index) => index.name)).not.toContain(
      'idx_ai_usage_events_hour',
    );
  });
});
