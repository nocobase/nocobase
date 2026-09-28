import {
  createDatabaseManager,
  InMemoryCollectionMetadataStore,
  type DatabaseManager,
} from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import createDefinitions from '../database/migrations/202609020001_scheduler_create_definitions.js';
import addRunState from '../database/migrations/202609240001_scheduler_add_run_state.js';

interface SqliteClient {
  raw(sql: string): Promise<readonly Record<string, unknown>[]>;
}

const DEFINITION_COLUMNS = {
  next_run_at: { notnull: 0 },
  last_run_at: { notnull: 0 },
  run_count: { notnull: 1 },
  applied_limit: { notnull: 0 },
  last_occurrence_id: { notnull: 0 },
} as const;

describe('202609240001_scheduler_add_run_state', () => {
  let database: DatabaseManager;
  let metadataStore: InMemoryCollectionMetadataStore;

  beforeEach(async () => {
    metadataStore = new InMemoryCollectionMetadataStore();
    database = createDatabaseManager({
      drivers: { sqlite },
      default: 'main',
      metadataStore,
      connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
    });
    await createDefinitions.up(context(database));
  });

  afterEach(async () => database.destroy());

  it('adds the run state columns and their metadata', async () => {
    await database
      .query()
      .insertInto('schedule_definitions')
      .values(definitionRow('before-migration'))
      .execute();

    await addRunState.up(context(database));

    const definitions = await columns('schedule_definitions');
    for (const [name, expected] of Object.entries(DEFINITION_COLUMNS)) {
      expect(definitions.get(name)).toMatchObject(expected);
    }
    expect(
      (await columns('schedule_occurrences')).get('scheduled_at'),
    ).toMatchObject({
      notnull: 0,
    });
    await expect(
      database
        .query()
        .selectFrom('schedule_definitions')
        .selectAll()
        .where('id', '=', 'before-migration')
        .executeTakeFirst(),
    ).resolves.toMatchObject({
      runCount: 0,
      nextRunAt: null,
      lastRunAt: null,
      appliedLimit: null,
      lastOccurrenceId: null,
    });
    await expect(
      metadataStore
        .get('scheduleDefinitions')
        .then((stored) => stored?.document),
    ).resolves.toMatchObject({
      fields: {
        nextRunAt: { type: 'datetimeTz' },
        lastRunAt: { type: 'datetimeTz' },
        runCount: { type: 'integer' },
        appliedLimit: { type: 'integer' },
        lastOccurrenceId: { type: 'string' },
      },
    });
    await expect(
      metadataStore
        .get('scheduleOccurrences')
        .then((stored) => stored?.document),
    ).resolves.toMatchObject({
      fields: { scheduledAt: { type: 'datetimeTz' } },
    });
  });

  it('stores run state through the collections', async () => {
    await addRunState.up(context(database));
    const instant = '2026-09-24T08:00:00.000+08:00';
    const definitions = database.connection().repository('scheduleDefinitions');
    await definitions.createOne({
      values: {
        ...definitionRow('after-migration'),
        nextRunAt: instant,
        lastRunAt: instant,
        runCount: 3,
        appliedLimit: 7,
        lastOccurrenceId: 'occurrence-3',
      },
    });

    await expect(
      definitions.findOne({ filter: { id: 'after-migration' } }),
    ).resolves.toMatchObject({
      nextRunAt: '2026-09-24T00:00:00.000Z',
      lastRunAt: '2026-09-24T00:00:00.000Z',
      runCount: 3,
      appliedLimit: 7,
      lastOccurrenceId: 'occurrence-3',
    });
  });

  it('drops exactly what it added', async () => {
    await addRunState.up(context(database));
    await addRunState.down?.(context(database));

    const definitions = await columns('schedule_definitions');
    for (const name of Object.keys(DEFINITION_COLUMNS)) {
      expect(definitions.has(name)).toBe(false);
    }
    expect(definitions.has('run_limit')).toBe(true);
    expect((await columns('schedule_occurrences')).has('scheduled_at')).toBe(
      false,
    );
    const stored = await metadataStore.get('scheduleDefinitions');
    expect(Object.keys(stored?.document.fields ?? {})).not.toContain(
      'runCount',
    );
    const occurrences = await metadataStore.get('scheduleOccurrences');
    expect(Object.keys(occurrences?.document.fields ?? {})).not.toContain(
      'scheduledAt',
    );
  });

  async function columns(
    table: string,
  ): Promise<Map<string, Record<string, unknown>>> {
    const client = await database.connection().client<SqliteClient>();
    const rows = await client.raw(`PRAGMA table_info(${table})`);
    return new Map(rows.map((row) => [String(row.name), row]));
  }
});

function context(database: DatabaseManager) {
  const connection = database.connection();
  return { builder: connection.builder, query: connection.query, connection };
}

function definitionRow(id: string) {
  const now = new Date('2026-09-24T00:00:00.000Z');
  return {
    id,
    appName: 'main',
    key: id,
    sourceType: 'code',
    title: 'Definition',
    definitionHash: 'hash',
    cron: '0 0 * * *',
    timezone: 'UTC',
    enabled: true,
    targetType: 'report',
    targetConfig: '{}',
    lifecycleState: 'active',
    syncStatus: 'synced',
    createdAt: now,
    updatedAt: now,
  };
}
