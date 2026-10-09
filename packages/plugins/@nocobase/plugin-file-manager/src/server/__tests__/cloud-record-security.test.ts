/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import { getApp } from '.';
import S3Storage from '../storages/s3';
import { FILE_FIELD_NAME } from '../../constants';
import type { AttachmentModel } from '../storages';
import PluginFileManagerServer from '../server';
import path from 'path';

describe('cloud file record security', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await getApp({ acl: true });
    app.acl.allow('files', 'create', 'loggedIn');
    app.acl.allow('users.files', 'create', 'loggedIn');
    app.acl.allow('users', ['create', 'update'], 'loggedIn');
    await app.db.getRepository('storages').create({
      values: {
        name: 'private-s3',
        type: 's3',
        default: true,
        baseUrl: 'https://bucket.example.com',
        path: 'uploads',
        options: {
          region: 'us-east-1',
          endpoint: 'https://s3.example.com',
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          bucket: 'test-bucket',
        },
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.destroy();
  });

  async function memberAgent() {
    const user = await app.db.getRepository('users').create({ values: { name: 'member' } });
    return (await app.agent().login(user)).set('X-Role', 'member');
  }

  it.each(['create', 'upload'])('rejects forged cloud records through %s for a member', async (action) => {
    const member = await memberAgent();
    const forged = await member.post(`/attachments:${action}`).send({ path: 'tenantA/', filename: 'contract.pdf' });
    expect(forged.status).toBe(400);
    expect(await app.db.getRepository('attachments').count()).toBe(0);
  });

  it.each(['s3', 'ali-oss', 'tx-cos'])('rejects key collisions within the configured prefix for %s', async (type) => {
    const storage = await app.db.getRepository('storages').findOne({ filter: { name: 'private-s3' } });
    await storage.update({ type });
    const member = await memberAgent();
    const forged = await member.post('/attachments:upload').send({ path: 'uploads', filename: 'victim.pdf' });
    expect(forged.status).toBe(400);
    expect(await app.db.getRepository('attachments').count()).toBe(0);
  });

  it('rejects forged records in custom file collections and association resources', async () => {
    const admin = await app.db.getRepository('users').findOne();
    const agent = (await app.agent().login(admin)).set('X-Role', 'root');
    for (const resource of ['files', `users/${admin.id}/files`]) {
      const forged = await agent.post(`/${resource}:create`).send({ path: 'tenantA', filename: 'contract.pdf' });
      expect(forged.status).toBe(400);
    }
    expect(await app.db.getRepository('files').count()).toBe(0);
  });

  it('rejects cloud records created through nested association values', async () => {
    const admin = await app.db.getRepository('users').findOne();
    const agent = (await app.agent().login(admin)).set('X-Role', 'root');
    const storage = await app.db.getRepository('storages').findOne({ filter: { name: 'private-s3' } });
    const forged = await agent.post('/users:create').send({
      name: 'nested',
      files: [{ path: 'tenantA', filename: 'contract.pdf', storageId: storage.id }],
    });
    expect(forged.status).toBe(400);
    expect(await app.db.getRepository('files').count()).toBe(0);
  });

  it.each(['path', 'filename', 'storageId'])('rejects changing %s on an owned cloud record', async (key) => {
    const member = await memberAgent();
    const user = await app.db.getRepository('users').findOne({ filter: { name: 'member' } });
    const storage = await app.db.getRepository('storages').findOne({ filter: { name: 'private-s3' } });
    const original = { path: 'uploads', filename: 'own.txt', storageId: storage.id };
    const record = await app.db.getRepository('attachments').create({
      values: original,
      context: { state: { currentUser: user } },
    });
    app.acl.allow('attachments', 'update', 'loggedIn');
    const forged = await member.post(`/attachments:update?filterByTk=${record.id}`).send({
      [key]: key === 'storageId' ? storage.id + 1 : 'victim',
    });
    // createOnly storageId can also be discarded by the repository guard.
    expect([200, 400]).toContain(forged.status);
    if (key !== 'storageId') expect(forged.status).toBe(400);
    expect((await record.reload()).toJSON()).toMatchObject(original);
  });

  it('rejects changing a cloud object key through nested association updates', async () => {
    const admin = await app.db.getRepository('users').findOne();
    const agent = (await app.agent().login(admin)).set('X-Role', 'root');
    const storage = await app.db.getRepository('storages').findOne({ filter: { name: 'private-s3' } });
    const record = await app.db.getRepository('files').create({
      values: { userId: admin.id, path: 'uploads', filename: 'own.txt', storageId: storage.id },
    });
    const forged = await agent
      .post(`/users:update?filterByTk=${admin.id}`)
      .query({ 'updateAssociationValues[]': 'files' })
      .send({
        files: [{ id: record.id, path: 'tenantA', filename: 'contract.pdf' }],
      });
    expect(forged.status).toBe(400);
    expect((await record.reload()).filename).toBe('own.txt');
  });

  it('keeps metadata edits bound to the original storage after the default changes', async () => {
    const member = await memberAgent();
    const user = await app.db.getRepository('users').findOne({ filter: { name: 'member' } });
    const storage = await app.db.getRepository('storages').findOne({ filter: { name: 'private-s3' } });
    const record = await app.db.getRepository('attachments').create({
      values: { path: 'uploads', filename: 'own.txt', storageId: storage.id },
      context: { state: { currentUser: user } },
    });
    const local = await app.db.getRepository('storages').findOne({ filter: { type: 'local' } });
    await local.update({ default: true });
    app.acl.allow('attachments', 'update', 'loggedIn');
    const updated = await member.post(`/attachments:update?filterByTk=${record.id}`).send({ title: 'new title' });
    expect(updated.status).toBe(200);
    expect((await record.reload()).toJSON()).toMatchObject({ title: 'new title', storageId: storage.id });
  });

  it('allows real uploads, signs their own key and deletes their own object', async () => {
    // Only emulate the cloud write; exercise multipart parsing, record creation, signing and destroy normally.
    vi.spyOn(S3Storage.prototype, 'make').mockImplementation(() => ({
      _handleFile(req, file, cb) {
        let size = 0;
        file.stream.on('data', (chunk: Buffer) => {
          size += chunk.length;
        });
        file.stream.on('end', () => cb(null, { key: 'uploads/server-generated.txt', size }));
      },
      _removeFile(req, file, cb) {
        cb(null);
      },
    }));
    const member = await memberAgent();
    const uploaded = await member
      .post('/attachments:upload')
      .field('path', 'tenantA')
      .field('filename', 'contract.pdf')
      .attach(FILE_FIELD_NAME, path.resolve(__dirname, './files/text.txt'));
    expect(uploaded.status).toBe(200);
    expect(uploaded.body.data).toMatchObject({ path: 'uploads', filename: 'server-generated.txt' });
    const download = await member.get(`/attachments:getFile?filterByTk=${uploaded.body.data.id}&download=1`);
    expect(download.status).toBe(302);
    const signed = new URL(download.headers.location);
    expect(signed.pathname).toBe('/test-bucket/uploads/server-generated.txt');
    expect(signed.searchParams.get('X-Amz-Signature')).toBeTruthy();

    const deleteObject = vi.spyOn(S3Storage.prototype, 'delete').mockResolvedValue([1, []]);
    app.acl.allow('attachments', 'destroy', 'loggedIn');
    const destroyed = await member.post(`/attachments:destroy?filterByTk=${uploaded.body.data.id}`);
    expect(destroyed.status).toBe(200);
    expect(deleteObject).toHaveBeenCalledOnce();
    const deleted = deleteObject.mock.calls[0][0][0];
    expect(deleted.path).toBe('uploads');
    expect(deleted.filename).toBe('server-generated.txt');
  });

  it('keeps trusted server-side file record creation available', async () => {
    const storage = await app.db.getRepository('storages').findOne({ filter: { name: 'private-s3' } });
    const record = await app.db.getRepository('attachments').create({
      values: { path: 'trusted', filename: 'imported.pdf', storageId: storage.id },
    });
    const plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
    const signed = new URL(await plugin.getFileURL(record.toJSON() as AttachmentModel, false, { download: true }));
    expect(signed.pathname).toBe('/test-bucket/trusted/imported.pdf');
  });
});
