// @vitest-environment node
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { afterEach, expect, it, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  createTestDatabase,
  describeMigration,
  expectCollection,
} from '@nocobase/app-testing/server';
import { createDriveManager } from '@nocobase/drive';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import core from '@nocobase/app-plugin-file/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import example from '../server/index.js';
import { registerTestAuthentication, signedIn } from './authentication.js';
import { migrations, migrationsDirectory } from './fixtures.js';

const fileActionNames: readonly string[] = [
  'findMany',
  'findOne',
  'count',
  'exists',
  'deleteOne',
  'uploadOne',
  'uploadMany',
];

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

async function routedFixture() {
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
  registerTestAuthentication(container, db);
  const app = { container, publicBasePath: '/main' } as AppPluginApplication;
  for (const Provider of core.serviceProviders) new Provider(app).register();
  const router = new Hono();
  for (const route of example.routes)
    router.route(
      route.scope === 'api' ? '/main/api' : '/main',
      await route.createRouter(app),
    );
  return { router, drive };
}

it('composes public core services with example routes for upload and download', async () => {
  const { router } = await routedFixture();
  const body = new FormData();
  body.append(
    'file',
    new File(['example'], 'example.txt', { type: 'text/plain' }),
  );
  const response = await router.request('/main/api/attachments/uploadOne', {
    method: 'POST',
    headers: signedIn,
    body,
  });
  expect(response.status).toBe(201);
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

it('refuses every exposure action and upload to an anonymous caller before touching storage', async () => {
  const { router, drive } = await routedFixture();
  const put = vi.spyOn(drive.use('local'), 'putStream');
  const owned: Record<string, readonly string[]> = {
    attachments: fileActionNames,
    profileAvatars: fileActionNames,
    orderAttachments: fileActionNames,
    fileExampleProfiles: ['findMany', 'findOne', 'updateOne'],
    fileExampleOrders: ['findMany', 'findOne', 'updateOne'],
  };
  for (const [name, actions] of Object.entries(owned))
    for (const action of actions) {
      const upload = action.startsWith('upload');
      const body = new FormData();
      body.append('file', new File(['x'], 'x.txt', { type: 'text/plain' }));
      const response = await router.request(`/main/api/${name}/${action}`, {
        method: 'POST',
        ...(upload
          ? { body }
          : { headers: { 'content-type': 'application/json' }, body: '{}' }),
      });
      expect(response.status, `${name}/${action}`).toBe(401);
      expect(await response.json()).toMatchObject({
        error: {
          status: 'UNAUTHENTICATED',
          reason: 'AUTHENTICATION_REQUIRED',
          domain: 'authentication',
        },
      });
    }
  expect(put).not.toHaveBeenCalled();
  // A signed-in caller reaches the same endpoints.
  const listed = await router.request('/main/api/attachments/findMany', {
    method: 'POST',
    headers: { ...signedIn, 'content-type': 'application/json' },
    body: '{}',
  });
  expect(listed.status).toBe(200);
});
