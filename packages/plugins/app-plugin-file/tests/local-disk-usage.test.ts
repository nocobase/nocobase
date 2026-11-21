// @vitest-environment node
// db-test-portability: portable — creates its own Collections and reads them back
import { afterEach, expect, it } from 'vitest';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createDriveManager } from '@nocobase/drive';
import { ServerFileRepositoryManager } from '../server/repository.js';

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const fn of cleanup.splice(0).reverse()) await fn();
});

async function fixture(
  defaultDisk: string,
  connections: readonly string[] = ['main'],
) {
  const testDatabase = await createTestDatabase({ connections });
  cleanup.push(() => testDatabase.destroy());
  const db = testDatabase.database;
  for (const name of ['taskFiles', 'reportFiles', 'emptyFiles']) {
    await db.builder().createCollection(name, (collection) => {
      collection.uuid('id').primary().notNull();
      collection.string('disk', { length: 255 }).notNull();
      collection.text('key').notNull();
      collection.text('filename').notNull();
      collection.string('ext', { length: 32 }).notNull();
      collection.string('mimeType', { length: 255 }).notNull();
      collection.bigInt('size').notNull();
      collection.datetime('createdAt').notNull();
      collection.datetime('updatedAt').notNull();
    });
  }
  await db.builder().createCollection('notes', (collection) => {
    collection.uuid('id').primary().notNull();
    collection.string('disk', { length: 255 });
  });
  const row = (id: string, disk: string) => ({
    id,
    disk,
    key: `objects/${id}`,
    filename: 'a.txt',
    ext: 'txt',
    mimeType: 'text/plain',
    size: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.repository('taskFiles').createOne({
    values: row('00000000-0000-4000-8000-000000000001', 'local'),
  });
  await db
    .repository('reportFiles')
    .createOne({ values: row('00000000-0000-4000-8000-000000000002', 's3') });
  await db.repository('notes').createOne({
    values: { id: '00000000-0000-4000-8000-000000000003', disk: 'local' },
  });
  const driveConfig = {
    default: defaultDisk,
    disks: {
      local: {
        driver: 'fs',
        location: '/srv/secret-location',
        visibility: 'private',
      },
      s3: {
        driver: 's3',
        bucket: 'files',
        region: 'us-east-1',
        credentials: { secretAccessKey: 'hunter2' },
      },
    },
  };
  const manager = new ServerFileRepositoryManager(
    db,
    createDriveManager({
      default: 'local',
      disks: {
        local: { driver: 'fs', location: '/tmp', visibility: 'private' },
      },
    }),
    driveConfig,
    connections,
  );
  return { manager, db };
}

it('lists file Collections with records on a local disk', async () => {
  const { manager } = await fixture('local');
  const usage = await manager.localDiskUsage();
  expect(usage).toEqual({
    defaultDiskIsLocal: true,
    collections: [{ connection: 'main', collection: 'taskFiles' }],
    uncheckedConnections: [],
  });
  const json = JSON.stringify(usage);
  expect(json).not.toContain('secret-location');
  expect(json).not.toContain('hunter2');
});

it('reports a non-local default disk', async () => {
  const { manager } = await fixture('s3');
  expect(await manager.localDiskUsage()).toEqual({
    defaultDiskIsLocal: false,
    collections: [{ connection: 'main', collection: 'taskFiles' }],
    uncheckedConnections: [],
  });
});

it('finds local files on a connection other than the default', async () => {
  const { manager, db: database } = await fixture('s3', ['main', 'archive']);
  // The fixture fills the default connection; give the archive connection its own same-named file Collection.
  await database.builder('archive').createCollection('taskFiles', (c) => {
    c.uuid('id').primary().notNull();
    c.string('disk', { length: 255 }).notNull();
    c.text('key').notNull();
    c.text('filename').notNull();
    c.string('ext', { length: 32 }).notNull();
    c.string('mimeType', { length: 255 }).notNull();
    c.bigInt('size').notNull();
    c.datetime('createdAt').notNull();
    c.datetime('updatedAt').notNull();
  });
  await database.repository('taskFiles', 'archive').createOne({
    values: {
      id: '00000000-0000-4000-8000-000000000009',
      disk: 'local',
      key: 'objects/old',
      filename: 'old.txt',
      ext: 'txt',
      mimeType: 'text/plain',
      size: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  expect(await manager.localDiskUsage()).toEqual({
    defaultDiskIsLocal: false,
    collections: [
      { connection: 'archive', collection: 'taskFiles' },
      { connection: 'main', collection: 'taskFiles' },
    ],
    uncheckedConnections: [],
  });
});

it('reports a connection it cannot read instead of failing', async () => {
  const testDatabase = await createTestDatabase();
  cleanup.push(() => testDatabase.destroy());
  const manager = new ServerFileRepositoryManager(
    testDatabase.database,
    createDriveManager({
      default: 'local',
      disks: {
        local: { driver: 'fs', location: '/tmp', visibility: 'private' },
      },
    }),
    { default: 'local', disks: { local: { driver: 'fs' } } },
    ['main', 'missing'],
  );
  expect(await manager.localDiskUsage()).toEqual({
    defaultDiskIsLocal: true,
    collections: [],
    uncheckedConnections: ['missing'],
  });
});
