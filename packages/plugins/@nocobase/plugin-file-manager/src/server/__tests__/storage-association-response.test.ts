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
  const publicFields = { name: 'reports', type: 'local', title: 'Report files' };

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
      values: { ...publicFields, options, baseUrl: '/storage/uploads' },
    });
  }

  it('projects the storage association in get and both list formats', async () => {
    const storage = await createStorage();
    const file = await app.db.getRepository('files').create({ values: { title: 'Report', storageId: storage.id } });
    const reader = await fileReader();
    const resource = reader.resource('files');
    const management = await reader.resource('storages').list();
    expect(management.status).toBe(403);
    const expected = { ...publicFields, id: storage.id };

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
    expect(result.body.data.documents[0].storage).toEqual({ ...publicFields, id: storage.id });
    expect(result.body.data.documents[0].meta).toEqual(meta);
  });

  it('retains complete settings for storage management and file access after reloading the cache', async () => {
    const storage = await createStorage();
    const admin = await app.db.getRepository('users').findOne({ filter: { email: process.env.INIT_ROOT_EMAIL } });
    const agent = await app.agent().login(admin, 'root');
    const management = agent.resource('storages');
    const list = await management.list({ filter: { id: storage.id } });
    expect(list.status).toBe(200);
    expect(list.body.data[0].options).toEqual(options);
    const update = await management.update({ filterByTk: storage.id, values: { title: 'Renamed' } });
    expect(update.status).toBe(200);
    const detail = await management.get({ filterByTk: storage.id });
    expect(detail.status).toBe(200);
    expect(detail.body.data).toMatchObject({ title: 'Renamed', options });

    const plugin = app.pm.get(PluginFileManagerServer);
    plugin.storagesCache.clear();
    await plugin.loadStorages();
    expect(plugin.storagesCache.get(storage.id)).toMatchObject({ title: 'Renamed', options });
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
