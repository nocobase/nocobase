// @vitest-environment node
import path from 'node:path';
import {
  createDatabaseTest,
  describeMigration,
  expectCollection as checkCollection,
  provisionTestDatabases,
  testDatabaseDialect,
} from '@nocobase/app-testing/server';
import { createDatabaseManager } from '@nocobase/db';
import { expect, it } from 'vitest';

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
  expectCollection,
}) => {
  if (dialect === 'mysql') skip();
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  // Reconstruct the original indexed schema, including on SQL Server.
  await connection.builder.dropConstraint(
    'relReleases',
    'idx_rel_releases_artifact_key',
  );
  await connection.builder.alterField('relReleases', 'artifactKey', {
    type: 'string',
    length: 1024,
    nullable: true,
  });
  await connection.builder.addConstraint('relReleases', {
    type: 'unique',
    fields: ['artifactKey'],
    name: 'idx_rel_releases_artifact_key',
    mode: 'index',
  });
  const records = connection.repository('relReleases');
  const key = `${'a'.repeat(128)}/${'b'.repeat(36)}.tar.gz`;
  await records.createOne({ values: release('existing', key) });
  await records.createOne({ values: release('null-one', null) });
  await records.createOne({ values: release('null-two', null) });
  await migrator.latest();
  await expectCollection('relReleases').toHaveIndex(['artifactKey'], {
    unique: true,
  });
  expect(
    (await connection.builder.getCollection('relReleases'))?.fields?.find(
      (field) => field.name === 'artifactKey',
    ),
  ).toMatchObject({ length: 172, nullable: true });
  expect(await records.findOne({ filter: { id: 'existing' } })).toMatchObject({
    artifactKey: key,
  });
  expect(await records.count({ filter: { artifactKey: null } })).toBe(2);
  await records.createOne({ values: release('null-three', null) });
  await expect(
    records.createOne({ values: release('duplicate', key) }),
  ).rejects.toThrow();
  expect((await migrator.latest()).executed).toEqual([]);
  await expect(migrator.rollback()).rejects.toThrow(/irreversible/);
});

it
  .skipIf(testDatabaseDialect() === 'mysql')
  .each([
    { tablePrefix: 'app_' },
    { underscored: false },
    { tablePrefix: 'app_', underscored: false },
  ])('preserves the legacy unique index with naming %j', async (naming) => {
  const provisioned = await provisionTestDatabases();
  const database = createDatabaseManager({
    default: 'main',
    connections: {
      main: { ...provisioned.connectionConfig(), naming },
    },
  });
  try {
    const connection = database.connection();
    const migrator = database.createMigrator({ sources });
    await migrator.upTo(previous);
    const collection = await connection.builder.getCollection('relReleases');
    // Dialects expose the unique key as either a constraint or an index.
    const indexName =
      collection?.constraints?.find(
        (item) =>
          item.type === 'unique' &&
          item.fields.length === 1 &&
          item.fields[0] === 'artifactKey',
      )?.name ??
      collection?.indexes?.find(
        (item) =>
          item.db?.unique === true &&
          item.fields?.length === 1 &&
          item.fields[0] === 'artifactKey',
      )?.name;
    expect(indexName).toBeDefined();
    expect(indexName).not.toBe('idx_rel_releases_artifact_key');
    await connection.builder.dropConstraint('relReleases', indexName!);
    await connection.builder.alterField('relReleases', 'artifactKey', {
      type: 'string',
      length: 1024,
      nullable: true,
    });
    await connection.builder.addConstraint('relReleases', {
      type: 'unique',
      fields: ['artifactKey'],
      mode: 'index',
    });
    const records = connection.repository('relReleases');
    const key = `${'a'.repeat(128)}/${'b'.repeat(36)}.tar.gz`;
    await records.createOne({ values: release('existing', key) });
    await records.createOne({ values: release('null-one', null) });
    await records.createOne({ values: release('null-two', null) });

    expect((await migrator.latest()).executed).toContain(correction);
    await checkCollection(connection, 'relReleases').toHaveField(
      'artifactKey',
      {
        length: 172,
        nullable: true,
      },
    );
    await checkCollection(connection, 'relReleases').toHaveIndex(
      ['artifactKey'],
      {
        unique: true,
      },
    );
    const upgraded = await connection.builder.getCollection('relReleases');
    expect([
      ...(upgraded?.constraints ?? []),
      ...(upgraded?.indexes ?? []),
    ]).toContainEqual(
      expect.objectContaining({ name: indexName, fields: ['artifactKey'] }),
    );
    expect(await records.findOne({ filter: { id: 'existing' } })).toMatchObject(
      {
        artifactKey: key,
      },
    );
    expect(await records.count({ filter: { artifactKey: null } })).toBe(2);
    await records.createOne({ values: release('null-three', null) });
    await expect(
      records.createOne({ values: release('duplicate', key) }),
    ).rejects.toThrow();
    expect((await migrator.latest()).executed).toEqual([]);
  } finally {
    try {
      await database.destroy();
    } finally {
      await provisioned.drop();
    }
  }
});

test('rejects oversized legacy keys before changing schema or data, then allows a corrected retry', async ({
  database,
  connection,
  dialect,
  expectCollection,
}) => {
  const migrator = database.createMigrator({ sources });
  await migrator.upTo(previous);
  // Remove the index before widening, then restore it where the legacy schema is valid.
  await connection.builder.dropConstraint(
    'relReleases',
    'idx_rel_releases_artifact_key',
  );
  await connection.builder.alterField('relReleases', 'artifactKey', {
    type: 'string',
    length: 1024,
    nullable: true,
  });
  if (dialect !== 'mysql')
    await connection.builder.addConstraint('relReleases', {
      type: 'unique',
      fields: ['artifactKey'],
      name: 'idx_rel_releases_artifact_key',
      mode: 'index',
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
  if (dialect !== 'mysql') {
    await expectCollection('relReleases').toHaveIndex(['artifactKey'], {
      unique: true,
    });
    await expect(
      connection.repository('relReleases').createOne({
        values: release('duplicate', key),
      }),
    ).rejects.toThrow();
  }
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
