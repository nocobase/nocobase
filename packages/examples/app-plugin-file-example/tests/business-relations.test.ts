// @vitest-environment node
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { afterEach, expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/db-testing';
import { describeMigration } from '@nocobase/db-testing/vitest';
import { createDriveManager } from '@nocobase/drive';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import core from '@nocobase/app-plugin-file/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import example from '../server/index.js';
import { migrations } from './fixtures.js';

const disposers: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const dispose of disposers.splice(0).reverse()) await dispose();
});

interface UploadedRecord {
  readonly id: string;
  readonly filename: string;
  readonly contentUrl: string;
}

async function fixture() {
  const testDatabase = await createTestDatabase({ migrations });
  disposers.push(() => testDatabase.destroy());
  const db = testDatabase.database;
  const storage = await mkdtemp(path.join(tmpdir(), 'file-example-business-'));
  disposers.push(() => rm(storage, { recursive: true, force: true }));
  const drive = createDriveManager({
    default: 'local',
    disks: {
      local: { driver: 'fs', location: storage, visibility: 'private' },
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
  const timestamp = new Date().toISOString().slice(0, -1);
  const action = async (
    name: string,
    values: Readonly<Record<string, unknown>>,
  ): Promise<Response> =>
    router.request(`/main/api/${name}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    });
  const upload = async (
    name: string,
    files: readonly File[],
  ): Promise<readonly UploadedRecord[]> => {
    const body = new FormData();
    for (const file of files) body.append('file', file);
    const response = await router.request(
      `/main/api/${name}:${files.length === 1 ? 'uploadOne' : 'uploadMany'}`,
      { method: 'POST', body },
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: { record?: UploadedRecord; records?: readonly UploadedRecord[] };
    };
    return payload.data.records ?? [payload.data.record as UploadedRecord];
  };
  return { db, router, action, upload, timestamp };
}

describeMigration('202609110001_create_file_example_business', {
  sources: migrations,
  up: async ({ connection, expectCollection }) => {
    for (const name of [
      'fileExampleProfiles',
      'fileExampleProfileAvatars',
      'fileExampleOrders',
      'fileExampleOrderAttachments',
    ])
      await expectCollection(name).toExist();
    const profiles = await connection.collections.get('fileExampleProfiles');
    expect(
      profiles?.fields.find((field) => field.name === 'avatar')?.type,
    ).toBe('hasOne');
    const orders = await connection.collections.get('fileExampleOrders');
    expect(
      orders?.fields.find((field) => field.name === 'attachments')?.type,
    ).toBe('hasMany');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('fileExampleProfiles').not.toExist();
  },
});

it('links one uploaded avatar to a profile and replaces it on reconnect', async () => {
  const { db, router, action, upload, timestamp } = await fixture();
  await db.repository('fileExampleProfiles').createOne({
    values: {
      id: 'profile-ada',
      name: 'Ada Chen',
      jobTitle: 'Product designer',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });
  const [first] = await upload('profileAvatars', [
    new File(['first avatar'], 'ada.png', { type: 'image/png' }),
  ]);
  expect(first!.contentUrl).toMatch(
    /^\/main\/uploads\/profile-avatars\/[0-9a-f-]+\.png$/,
  );
  const connected = await action('fileExampleProfiles:updateOne', {
    filter: { id: 'profile-ada' },
    values: { avatar: { connect: { id: first!.id } } },
  });
  expect(connected.status).toBe(200);
  const [stored] = await db
    .connection()
    .query.selectFrom('fileExampleProfileAvatars')
    .selectAll()
    .execute();
  expect(stored?.profileId).toBe('profile-ada');
  const download = await router.request(first!.contentUrl);
  expect(await download.text()).toBe('first avatar');

  const [second] = await upload('profileAvatars', [
    new File(['second avatar'], 'ada-new.png', { type: 'image/png' }),
  ]);
  await action('fileExampleProfiles:updateOne', {
    filter: { id: 'profile-ada' },
    values: { avatar: { connect: { id: second!.id } } },
  });
  const avatars = await db
    .connection()
    .query.selectFrom('fileExampleProfileAvatars')
    .selectAll()
    .execute();
  expect(
    avatars.find((avatar) => avatar.id === first!.id)?.profileId,
  ).toBeNull();
  expect(avatars.find((avatar) => avatar.id === second!.id)?.profileId).toBe(
    'profile-ada',
  );

  await action('fileExampleProfiles:updateOne', {
    filter: { id: 'profile-ada' },
    values: { avatar: { disconnect: true } },
  });
  const [cleared] = await db
    .connection()
    .query.selectFrom('fileExampleProfileAvatars')
    .selectAll()
    .where('id', '=', second!.id)
    .execute();
  expect(cleared?.profileId).toBeNull();
});

it('connects several uploaded attachments to one order and detaches them', async () => {
  const { db, action, upload, timestamp } = await fixture();
  await db.repository('fileExampleOrders').createOne({
    values: {
      id: 'order-2401',
      number: 'SO-2026-2401',
      customerName: 'Aurora Studio',
      status: 'submitted',
      amountCents: 128000,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });
  const records = await upload('orderAttachments', [
    new File(['contract'], 'contract.pdf', { type: 'application/pdf' }),
    new File(['receipt'], 'receipt.png', { type: 'image/png' }),
  ]);
  expect(records).toHaveLength(2);
  const response = await action('fileExampleOrders:updateOne', {
    filter: { id: 'order-2401' },
    values: {
      attachments: { connect: records.map((record) => ({ id: record.id })) },
    },
  });
  expect(response.status).toBe(200);
  const listed = await action('orderAttachments:findMany', {
    filter: { orderId: 'order-2401' },
    sort: {
      kind: 'sort',
      version: 1,
      items: [{ kind: 'field', path: ['createdAt'], direction: 'asc' }],
    },
  });
  expect(listed.status).toBe(200);
  const payload = (await listed.json()) as { data: readonly UploadedRecord[] };
  expect([...payload.data.map((record) => record.filename)].sort()).toEqual([
    'contract.pdf',
    'receipt.png',
  ]);
  const byName = new Map(
    payload.data.map((record) => [record.filename, record]),
  );
  expect(byName.get('contract.pdf')!.contentUrl).toMatch(
    /^\/main\/uploads\/order-attachments\/[0-9a-f-]+\.pdf$/,
  );

  await action('fileExampleOrders:updateOne', {
    filter: { id: 'order-2401' },
    values: { attachments: { disconnect: [{ id: records[0]!.id }] } },
  });
  const remaining = await action('orderAttachments:findMany', {
    filter: { orderId: 'order-2401' },
  });
  const rest = (await remaining.json()) as {
    data: readonly UploadedRecord[];
  };
  expect(rest.data.map((record) => record.id)).toEqual([records[1]!.id]);
});

it('runs the business seed and keeps it idempotent', async () => {
  const { db, action } = await fixture();
  const seeds = path.resolve(import.meta.dirname, '../database/seeds');
  const seeder = db.createSeeder({
    directory: seeds,
    packageName: example.packageName,
  });
  const first = await seeder.run();
  expect(first.executed).toEqual(['202609110001_seed_file_example_business']);
  expect((await seeder.run()).executed).toEqual([]);

  // The repository validates temporal columns, so reading the seeded rows
  // proves the seed wrote values the App can actually use.
  const profiles = await action('fileExampleProfiles:findMany', { limit: 10 });
  expect(profiles.status).toBe(200);
  const profilePayload = (await profiles.json()) as {
    data: readonly { id: string }[];
  };
  expect(profilePayload.data.map((profile) => profile.id).sort()).toEqual([
    'profile-ada',
    'profile-lin',
    'profile-marco',
  ]);
  const orders = await action('fileExampleOrders:findMany', { limit: 10 });
  expect(orders.status).toBe(200);
});
