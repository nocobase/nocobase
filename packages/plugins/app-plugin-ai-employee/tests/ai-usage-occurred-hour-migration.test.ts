import type { DatabaseConnection } from '@nocobase/db';
import {
  describeMigration,
  verifyMigration,
  type MigrationTestContext,
} from '@nocobase/db-testing/vitest';
import { describe, expect, it } from 'vitest';

import { aiEmployeeMigrations } from './support/migrations.js';

const MIGRATION_NAME = '202609300001_add_ai_usage_event_occurred_hour';
const HOUR_IN_MS = 3_600_000;

type UsageRow = {
  id: number;
  occurredAt: number;
  occurredHour: number | null;
};

/** SQLite caps the terms of one compound insert, so rows go in chunks. */
const INSERT_CHUNK_SIZE = 100;

async function seedUsageEvents(
  connection: DatabaseConnection,
  rows: readonly { id: number; occurredAt: number }[],
): Promise<void> {
  for (let start = 0; start < rows.length; start += INSERT_CHUNK_SIZE) {
    await insertUsageEvents(
      connection,
      rows.slice(start, start + INSERT_CHUNK_SIZE),
    );
  }
}

async function insertUsageEvents(
  connection: DatabaseConnection,
  rows: readonly { id: number; occurredAt: number }[],
): Promise<void> {
  await connection.query
    .insertInto('aiUsageEvents')
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

/** Drivers may return bigint columns as strings. */
async function readUsageEvents(
  connection: DatabaseConnection,
): Promise<UsageRow[]> {
  const rows = await connection.query
    .selectFrom('aiUsageEvents')
    .select(['id', 'occurredAt', 'occurredHour'])
    .orderBy('id', 'asc')
    .execute<Record<string, unknown>>();
  return rows.map((row) => ({
    id: Number(row.id),
    occurredAt: Number(row.occurredAt),
    occurredHour: row.occurredHour === null ? null : Number(row.occurredHour),
  }));
}

describeMigration(MIGRATION_NAME, {
  sources: aiEmployeeMigrations,
  up: async ({ expectCollection }) => {
    await expectCollection('aiUsageEvents').toHaveField('occurredHour');
    await expectCollection('aiUsageEvents').toHaveIndex(['occurredHour'], {
      unique: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('aiUsageEvents').not.toHaveField('occurredHour');
    await expectCollection('aiUsageEvents').not.toHaveIndex(['occurredHour']);
  },
});

// The rows are written before the migration first runs. Rolling it back drops
// the bucket and reapplying it fills the bucket in again, so the expectation
// holds after both applications.
describe(`${MIGRATION_NAME} backfill`, () => {
  it('backfills the hour bucket of every existing event', async () => {
    const rows = [
      { id: 1, occurredAt: Date.UTC(2026, 8, 20, 10, 0, 0) },
      { id: 2, occurredAt: Date.UTC(2026, 8, 20, 10, 59, 59, 999) },
      { id: 3, occurredAt: Date.UTC(2026, 8, 20, 11, 0, 0) },
      { id: 4, occurredAt: 0 },
    ];
    await verifyMigration(MIGRATION_NAME, {
      sources: aiEmployeeMigrations,
      before: ({ connection }: MigrationTestContext) =>
        seedUsageEvents(connection, rows),
      up: async ({ connection }: MigrationTestContext) => {
        expect(await readUsageEvents(connection)).toEqual(
          rows.map((row) => ({
            id: row.id,
            occurredAt: row.occurredAt,
            occurredHour: Math.floor(row.occurredAt / HOUR_IN_MS),
          })),
        );
      },
    });
  });

  it('backfills across more rows than one batch', async () => {
    const base = Date.UTC(2026, 8, 1);
    const rows = Array.from({ length: 1201 }, (_, index) => ({
      id: index + 1,
      occurredAt: base + index * 5 * 60_000,
    }));
    await verifyMigration(MIGRATION_NAME, {
      sources: aiEmployeeMigrations,
      before: ({ connection }: MigrationTestContext) =>
        seedUsageEvents(connection, rows),
      up: async ({ connection }: MigrationTestContext) => {
        const stored = new Map(
          (await readUsageEvents(connection)).map((row) => [
            row.id,
            row.occurredHour,
          ]),
        );
        expect(stored.size).toBe(rows.length);
        for (const row of rows) {
          expect(stored.get(row.id)).toBe(
            Math.floor(row.occurredAt / HOUR_IN_MS),
          );
        }
      },
    });
  });
});
