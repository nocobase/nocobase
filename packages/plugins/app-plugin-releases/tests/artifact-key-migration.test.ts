// @vitest-environment node
import path from 'node:path';
import {
  createDatabaseTest,
  describeMigration,
} from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const sources = [
  {
    packageName: '@nocobase/app-plugin-releases',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];
const correction = '202610260002_rel_bound_artifact_keys';
const previous = '202610210001_rel_protected_requires_approval';

function release(id: string, artifactKey: string | null) {
  return {
    id,
    appId: 'app',
    kind: 'archive',
    version: '1',
    artifactKey,
    checksum: id,
    manifest: {},
    labels: {},
    createdVia: 'human',
    createdAt: new Date(),
  };
}

describeMigration('202610020001_rel_create_tables', {
  sources,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('relReleases').toHaveIndex(['artifactKey'], {
      unique: true,
    });
    expect(
      (await connection.builder.getCollection('relReleases'))?.fields?.find(
        (field) => field.name === 'artifactKey',
      ),
    ).toMatchObject({ length: 172, nullable: true });
    const records = connection.repository('relReleases');
    const key = `${'a'.repeat(128)}/${'b'.repeat(36)}.tar.gz`;
    await records.createOne({ values: release('longest', key) });
    await records.createOne({ values: release('null-one', null) });
    await records.createOne({ values: release('null-two', null) });
    await expect(
      records.createOne({ values: release('duplicate', key) }),
    ).rejects.toThrow();
    expect(await records.findOne({ filter: { id: 'longest' } })).toMatchObject({
      artifactKey: key,
    });
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

// db-test-portability: dialect-specific — the original full unique index cannot be constructed on utf8mb4 MySQL.
test('upgrades the original key length without changing keys or uniqueness', async ({
  database,
  connection,
  dialect,
  skip,
}) => {
  if (dialect === 'mysql') skip();
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  await connection.builder.alterField('relReleases', 'artifactKey', {
    type: 'string',
    length: 1024,
    nullable: true,
  });
  await connection
    .repository('relReleases')
    .createOne({ values: release('existing', 'app/existing.tar.gz') });
  await migrator.latest();
  expect(
    (await connection.builder.getCollection('relReleases'))?.fields?.find(
      (field) => field.name === 'artifactKey',
    ),
  ).toMatchObject({ length: 172, nullable: true });
  expect(
    await connection
      .repository('relReleases')
      .findOne({ filter: { id: 'existing' } }),
  ).toMatchObject({ artifactKey: 'app/existing.tar.gz' });
  await expect(
    connection.repository('relReleases').createOne({
      values: release('duplicate', 'app/existing.tar.gz'),
    }),
  ).rejects.toThrow();
  expect((await migrator.latest()).executed).toEqual([]);
  await expect(migrator.rollback()).rejects.toThrow(/irreversible/);
});

test('rejects oversized legacy keys before changing schema or data, then allows a corrected retry', async ({
  database,
  connection,
}) => {
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  // Omit the invalid legacy index so the bad-data guard can also run on MySQL.
  await connection.builder.dropConstraint(
    'relReleases',
    'idx_rel_releases_artifact_key',
  );
  await connection.builder.alterField('relReleases', 'artifactKey', {
    type: 'string',
    length: 1024,
    nullable: true,
  });
  const key = 'x'.repeat(173);
  await connection
    .repository('relReleases')
    .createOne({ values: release('oversized', key) });
  await expect(migrator.latest()).rejects.toThrow('longer than 172 characters');
  expect(
    await connection
      .repository('relReleases')
      .findOne({ filter: { id: 'oversized' } }),
  ).toMatchObject({ artifactKey: key });
  expect(
    (await connection.builder.getCollection('relReleases'))?.fields?.find(
      (field) => field.name === 'artifactKey',
    ),
  ).toMatchObject({ length: 1024 });
  await connection.query
    .updateTable('relReleases')
    .set({ artifactKey: 'app/resolved.tar.gz' })
    .where('id', '=', 'oversized')
    .execute();
  await migrator.latest();
  expect(
    (await connection.builder.getCollection('relReleases'))?.fields?.find(
      (field) => field.name === 'artifactKey',
    ),
  ).toMatchObject({ length: 172 });
});
