import { afterEach, describe, expect, it } from 'vitest';
import type { DatabaseManager } from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';

import createMigration from '../database/migrations/202608260002_create_ai_employee.js';
import removeRecommendedModelsMigration from '../database/migrations/202609010001_remove_recommended_llm_models.js';
import { authenticationMigrations } from './support/migrations.js';

const testDatabases: TestDatabase[] = [];

afterEach(async () => {
  await Promise.all(
    testDatabases.splice(0).map((testDatabase) => testDatabase.destroy()),
  );
});

describe('recommended LLM models migration', () => {
  it('migrates historical rows and installs the provider-mode default', async () => {
    const testDatabase = await createTestDatabase();
    testDatabases.push(testDatabase);
    const { database, connection } = testDatabase;
    // The `user` table the conversations reference has to exist first.
    await database
      .createMigrator({ sources: authenticationMigrations })
      .latest();
    const context = {
      builder: database.builder(),
      query: connection.query,
      connection,
    };
    await createMigration.up(context);
    await context.query
      .insertInto('llmServices')
      .values([
        row('recommended-empty', { mode: 'recommended', models: [] }),
        row('recommended-stale', {
          mode: 'recommended',
          models: [{ label: 'Stale', value: 'stale' }],
        }),
        row('provider', {
          mode: 'provider',
          models: [{ label: 'Provider', value: 'provider-model' }],
        }),
        row('custom', {
          mode: 'custom',
          models: [{ label: 'Custom', value: 'custom-model' }],
        }),
        row('legacy-array', ['legacy-model']),
        { name: 'malformed', enabledModels: 'not-json' },
      ])
      .execute();

    await removeRecommendedModelsMigration.up(context);

    await expect(
      readEnabledModels(context.query, 'recommended-empty'),
    ).resolves.toEqual({
      mode: 'provider',
      models: [],
    });
    await expect(
      readEnabledModels(context.query, 'recommended-stale'),
    ).resolves.toEqual({
      mode: 'provider',
      models: [],
    });
    await expect(readEnabledModels(context.query, 'provider')).resolves.toEqual(
      {
        mode: 'provider',
        models: [{ label: 'Provider', value: 'provider-model' }],
      },
    );
    await expect(readEnabledModels(context.query, 'custom')).resolves.toEqual({
      mode: 'custom',
      models: [{ label: 'Custom', value: 'custom-model' }],
    });
    await expect(
      readEnabledModels(context.query, 'legacy-array'),
    ).resolves.toEqual(['legacy-model']);
    await expect(readEnabledModels(context.query, 'malformed')).resolves.toBe(
      'not-json',
    );

    await context.query
      .insertInto('llmServices')
      .values({ name: 'new' })
      .execute();
    await expect(readEnabledModels(context.query, 'new')).resolves.toEqual({
      mode: 'provider',
      models: [],
    });

    // The resolved Field reads nullability and the default from the physical
    // column, so these assertions are about the column itself.
    const resolved = await connection.collections.get('llmServices');
    const field = resolved?.fields.find(({ name }) => name === 'enabledModels');
    expect(field).toMatchObject({
      name: 'enabledModels',
      type: 'json',
      nullable: false,
    });
    // The physical default is the literal text; the resolved Field carries the
    // document it encodes.
    expect(field?.defaultValue).toEqual({ mode: 'provider', models: [] });
    await expect(
      connection.collectionMetadata.get('llmServices'),
    ).resolves.toMatchObject({
      document: {
        fields: {
          enabled: { type: 'boolean' },
          enabledModels: { type: 'json' },
          sort: { type: 'integer' },
        },
      },
    });
  });
});

function row(name: string, enabledModels: unknown): Record<string, unknown> {
  return { name, enabledModels };
}

async function readEnabledModels(
  query: ReturnType<DatabaseManager['connection']>['query'],
  name: string,
): Promise<unknown> {
  const value = await query
    .selectFrom('llmServices')
    .select('enabledModels')
    .where('name', '=', name)
    .value('enabledModels');
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
