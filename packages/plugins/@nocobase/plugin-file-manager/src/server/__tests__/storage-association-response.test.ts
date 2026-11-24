/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { text } from 'node:stream/consumers';
import { createMockServer, MockServer } from '@nocobase/test';
import files from './collections/files';
import PluginFileManagerServer from '../server';

describe('storage association responses', () => {
  let app: MockServer;
  const options = { documentRoot: 'storage/uploads', thumbnailRule: '?preview' };
  const settings = { requestOptions: { timeout: 5000 } };
  const publicFields = {
    name: 'reports',
    type: 'local',
    title: 'Report files',
    rules: { size: 1024 },
    path: 'reports',
    baseUrl: '/storage/uploads',
    renameMode: 'appendRandomID',
    default: false,
    paranoid: true,
  };

  function expectedStorage(id: string | number) {
    return { ...publicFields, id, createdAt: expect.any(String), updatedAt: expect.any(String) };
  }

  beforeEach(async () => {
    app = await createMockServer({
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'file-manager',
        'error-handler',
        'acl',
        'data-source-main',
        'data-source-manager',
        'ui-schema-storage',
      ],
    });
    app.db.collection(files);
    app.db.collection({
      name: 'reports',
      fields: [{ type: 'hasMany', name: 'documents', target: 'files', foreignKey: 'reportId' }],
    });
    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  async function fileReader() {
    const member = await app.db.getRepository('users').create({ values: { roles: ['member'] } });
    const role = app.acl.getRole('member');
    for (const action of ['files:get', 'files:list', 'reports:get']) {
      role.grantAction(action, {});
    }
    return app.agent().login(member, 'member');
  }

  async function createStorage() {
    return app.db.getRepository('storages').create({
      values: { ...publicFields, options, settings },
    });
  }

  it('projects the storage association in get and both list formats', async () => {
    const storage = await createStorage();
    const file = await app.db.getRepository('files').create({ values: { title: 'Report', storageId: storage.id } });
    const reader = await fileReader();
    const resource = reader.resource('files');
    const management = await reader.resource('storages').list();
    expect(management.status).toBe(403);
    const expected = expectedStorage(storage.id);

    const detail = await resource.get({ filterByTk: file.id, appends: ['storage'] });
    expect(detail.status).toBe(200);
    expect(detail.body.data.storage).toEqual(expected);

    for (const paginate of [true, false]) {
      const response = await resource.list({ paginate, appends: ['storage'] });
      expect(response.status).toBe(200);
      expect(response.body.data.map((row) => row.storage)).toEqual([expected]);
      if (paginate) expect(response.body.meta.count).toBe(1);
    }

    const plain = await resource.get({ filterByTk: file.id });
    expect(plain.body.data).not.toHaveProperty('storage');
    const unassigned = await app.db.getRepository('files').create({ values: { title: 'Unassigned' } });
    const empty = await resource.get({ filterByTk: unassigned.id, appends: ['storage'] });
    expect(empty.status).toBe(200);
    expect(empty.body.data.storage).toBeNull();
  });

  it('preserves the data source model when expanding collections', async () => {
    const admin = await app.db.getRepository('users').findOne({ filter: { email: process.env.INIT_ROOT_EMAIL } });
    const agent = await app.agent().login(admin, 'root');
    const result = await agent.resource('dataSources').get({ filterByTk: 'main', appends: ['collections'] });

    expect(result.status).toBe(200);
    expect(result.body.data.key).toBe('main');
    expect(result.body.data.collections).toEqual(expect.any(Array));
  });

  it('keeps business records with unrelated associations available to response middleware', async () => {
    const report = await app.db.getRepository('reports').create({ values: {} });
    await app.db.getRepository('files').create({ values: { title: 'Document', reportId: report.id } });
    app.use(
      async (ctx, next) => {
        await next();
        if (ctx.action?.resourceName === 'reports' && ctx.action.actionName === 'list') {
          const records = ctx.body.rows ?? ctx.body;
          ctx.set('X-Report-Id', String(records[0].get('id')));
        }
      },
      { after: 'dataWrapping', before: 'dataSource' },
    );
    const admin = await app.db.getRepository('users').findOne({ filter: { email: process.env.INIT_ROOT_EMAIL } });
    const agent = await app.agent().login(admin, 'root');
    for (const paginate of [true, false]) {
      const response = await agent.resource('reports').list({ appends: ['documents'], paginate });
      expect(response.status).toBe(200);
      expect(response.headers['x-report-id']).toBe(String(report.id));
      expect(response.body.data[0].documents).toHaveLength(1);
    }
  });

  it('projects storage in nested file arrays and preserves unrelated JSON fields', async () => {
    const storage = await createStorage();
    const report = await app.db.getRepository('reports').create({ values: {} });
    const meta = { storage: { options: 'business metadata' } };
    await app.db
      .getRepository('files')
      .create({ values: { title: 'Report', reportId: report.id, storageId: storage.id, meta } });

    const reader = await fileReader();
    const result = await reader
      .resource('reports')
      .get({ filterByTk: report.id, appends: ['documents.meta', 'documents.storage'] });
    expect(result.status).toBe(200);
    expect(result.body.data.documents).toHaveLength(1);
    expect(result.body.data.documents[0].storage).toEqual(expectedStorage(storage.id));
    expect(result.body.data.documents[0].meta).toEqual(meta);
  });

  it('retains complete settings for storage management and file access after reloading the cache', async () => {
    const storage = await createStorage();
    const admin = await app.db.getRepository('users').findOne({ filter: { email: process.env.INIT_ROOT_EMAIL } });
    const agent = await app.agent().login(admin, 'root');
    const management = agent.resource('storages');
    const list = await management.list({ filter: { id: storage.id } });
    expect(list.status).toBe(200);
    expect(list.body.data[0]).toMatchObject({ options, settings });
    const update = await management.update({ filterByTk: storage.id, values: { title: 'Renamed' } });
    expect(update.status).toBe(200);
    const detail = await management.get({ filterByTk: storage.id });
    expect(detail.status).toBe(200);
    expect(detail.body.data).toMatchObject({ title: 'Renamed', options, settings });

    const plugin = app.pm.get(PluginFileManagerServer);
    plugin.storagesCache.clear();
    await plugin.loadStorages();
    expect(plugin.storagesCache.get(storage.id)).toMatchObject({ title: 'Renamed', options, settings });
    const file = await plugin.createFileRecord({
      collectionName: 'files',
      storageName: publicFields.name,
      filePath: path.resolve(__dirname, 'files/text.txt'),
    });
    expect(String(file.get('storageId'))).toBe(String(storage.id));
    const download = await plugin.getFileStream(file.toJSON());
    expect(await text(download.stream)).toContain('Hello world!');
  });
});
