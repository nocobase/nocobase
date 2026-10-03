// @vitest-environment node
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { afterEach, expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/db-testing';
import {
  describeMigration,
  expectCollection,
} from '@nocobase/db-testing/vitest';
import { createDriveManager } from '@nocobase/drive';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import core from '@nocobase/app-plugin-file/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import example from '../server/index.js';
import { migrations, migrationsDirectory } from './fixtures.js';

const disposers: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const dispose of disposers.splice(0).reverse()) await dispose();
});
async function fixture() {
  const testDatabase = await createTestDatabase();
  disposers.push(() => testDatabase.destroy());
  const db = testDatabase.database;
  const migrator = db.createMigrator({ sources: migrations });
  return { db, migrator };
}

it('declares its migrations directory', () => {
  expect(example.database?.migrations).toBe('./database/migrations');
});

describeMigration('202609070001_create_attachments', {
  sources: migrations,
  up: async ({ connection, expectCollection }) => {
    expect(
      (await connection.collections.get('attachments'))?.fields?.map(
        (field) => field.name,
      ),
    ).toEqual(
      expect.arrayContaining([
        'id',
        'disk',
        'key',
        'filename',
        'ext',
        'mimeType',
        'size',
        'createdAt',
        'updatedAt',
      ]),
    );
    await expectCollection('attachments').toExist();
    expect(
      (await connection.collectionMetadata.get('attachments'))?.document,
    ).toBeDefined();
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('attachments').not.toExist();
    expect(
      await connection.collectionMetadata.get('attachments'),
    ).toBeUndefined();
  },
});

it.each([
  '@nocobase/app-plugin-file-repository',
  '@nocobase/app-plugin-file-repository-example',
])(
  'recognizes the unchanged migration previously run under %s',
  async (previousPackageName) => {
    const { db, migrator } = await fixture();
    await db
      .createMigrator({
        directory: migrationsDirectory,
        packageName: previousPackageName,
      })
      .latest();
    const result = await migrator.latest();
    expect(result.executed).toEqual([]);
    expect(result.skipped).toContain('202609070001_create_attachments');
    await expectCollection(db.connection(), 'attachments').toExist();
  },
);

it('composes public core services with example routes for upload and download', async () => {
  const { db, migrator } = await fixture();
  await migrator.latest();
  const directory = await mkdtemp(
    path.join(tmpdir(), 'file-repository-example-'),
  );
  disposers.push(() => rm(directory, { recursive: true, force: true }));
  const drive = createDriveManager({
    default: 'local',
    disks: {
      local: { driver: 'fs', location: directory, visibility: 'private' },
    },
  });
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, db);
  container.instance(driveManagerToken, drive);
  const app = { container, publicBasePath: '/main' } as AppPluginApplication;
  for (const Provider of core.serviceProviders) new Provider(app).register();
  const router = new Hono();
  for (const route of example.routes)
    router.route(
      route.scope === 'api' ? '/main/api' : '/main',
      await route.createRouter(app),
    );
  const body = new FormData();
  body.append(
    'file',
    new File(['example'], 'example.txt', { type: 'text/plain' }),
  );
  const response = await router.request('/main/api/attachments:uploadOne', {
    method: 'POST',
    body,
  });
  expect(response.status).toBe(200);
  const { data } = (await response.json()) as {
    data: { record: { contentUrl: string } };
  };
  expect(data.record.contentUrl).toMatch(/^\/main\/uploads\/attachments\//);
  const download = await router.request(data.record.contentUrl);
  expect(await download.text()).toBe('example');
  expect(
    (await router.request('/main/api/uploads/attachments/example.txt')).status,
  ).toBe(404);
});
