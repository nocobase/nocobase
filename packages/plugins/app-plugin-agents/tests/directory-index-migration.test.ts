import path from 'node:path';
import {
  createDatabaseTest,
  describeMigration,
} from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const sources = [
  {
    packageName: '@nocobase/app-plugin-agents',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];
const correction = '202610260001_ag_drop_directory_index';

describeMigration('202610020003_ag_create_runs', {
  sources,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('agRuns').not.toHaveIndex([
      'directoryKey',
      'status',
    ]);
    await expectCollection('agRuns').toHaveIndex(['runnerId', 'status']);
    const collection = await connection.builder.getCollection('agRuns');
    expect(
      collection?.fields?.find((field) => field.name === 'directoryKey'),
    ).toMatchObject({ type: 'string', length: 1100, nullable: true });
  },
});

describeMigration(correction, { sources, reversible: false });

const test = createDatabaseTest();

test('skips the correction on a fresh schema without blocking rollback', async ({
  database,
}) => {
  const migrator = database.createMigrator({ sources });
  expect((await migrator.latest()).skipped).toContain(correction);
  expect((await migrator.history()).map((entry) => entry.name)).not.toContain(
    correction,
  );
  await migrator.rollback();
  expect(await migrator.history()).toEqual([]);
  expect((await migrator.latest()).skipped).toContain(correction);
});

// db-test-portability: dialect-specific — the old index never fit utf8mb4 MySQL; its upgrade is tested where it existed.
test('removes an existing directory index and preserves full directory values', async ({
  database,
  connection,
  dialect,
  skip,
}) => {
  if (dialect === 'mysql') skip();
  const migrator = database.createMigrator({ sources });
  await migrator.upTo('202610250001_ag_comment_runner_consent');
  await connection.builder.addIndex('agRuns', {
    fields: ['directoryKey', 'status'],
    name: 'idx_ag_runs_directory_key_status',
  });
  const directoryKey = `runner:/${'d'.repeat(1024)}`;
  await connection.repository('agRuns').createOne({
    values: {
      id: 'legacy-run',
      agentId: 'manager',
      subjectKind: 'test',
      subjectId: 'test',
      threadScope: 'main',
      actorUserId: 'owner',
      directoryKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await migrator.latest();
  expect(
    (await connection.builder.getCollection('agRuns'))?.indexes?.some((index) =>
      index.fields?.includes('directoryKey'),
    ),
  ).toBe(false);
  expect(
    await connection
      .repository('agRuns')
      .findOne({ filter: { id: 'legacy-run' } }),
  ).toMatchObject({ directoryKey });
  expect((await migrator.latest()).executed).toEqual([]);
  await expect(migrator.rollback()).rejects.toThrow(/irreversible/);
});
