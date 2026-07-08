/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { promises as fs } from 'fs';
import { Readable } from 'stream';

import { getConfigByEnv } from '@nocobase/database';
import { SequelizeCollectionManager, SequelizeDataSource } from '@nocobase/data-source-manager';
import { MockServer, sleep } from '@nocobase/test';
import { getAuthCookieName, uid } from '@nocobase/utils';
import { getApp } from '.';
import PluginFileManagerServer from '../server';

import { FILE_FIELD_NAME, STORAGE_TYPE_LOCAL } from '../../constants';

const { LOCAL_STORAGE_BASE_URL, LOCAL_STORAGE_DEST = 'storage/uploads', APP_PORT = '13000' } = process.env;
const DEFAULT_LOCAL_BASE_URL = LOCAL_STORAGE_BASE_URL || `/storage/uploads`;

async function loadAnotherDataSource(app: MockServer) {
  app.dataSourceManager.factory.register('sequelize', SequelizeDataSource);
  const DataSourceRepo = app.db.getRepository('dataSources');
  await DataSourceRepo.create({
    values: {
      key: 'another',
      name: 'Another Data Source',
      type: 'sequelize',
      options: {
        collectionManager: {
          ...getConfigByEnv(),
          tablePrefix: `t${uid(5)}`,
        },
      },
    },
  });

  const loadStart = Date.now();
  let another = app.dataSourceManager.dataSources.get('another');
  while (!another?.collectionManager) {
    if (Date.now() - loadStart >= 5000) {
      throw new Error('Timed out waiting for the "another" data source to load');
    }
    await sleep(1000);
    another = app.dataSourceManager.dataSources.get('another');
  }

  return another;
}

async function createAnotherFileCollection(app: MockServer) {
  const another = await loadAnotherDataSource(app);
  const anotherDB = (another.collectionManager as SequelizeCollectionManager).db;
  anotherDB.collection({
    name: 'files',
    template: 'file',
    fields: [
      { type: 'string', name: 'title' },
      { type: 'string', name: 'filename' },
      { type: 'string', name: 'extname' },
      { type: 'integer', name: 'size' },
      { type: 'string', name: 'mimetype' },
      { type: 'string', name: 'path' },
      { type: 'string', name: 'url' },
      { type: 'bigInt', name: 'storageId' },
      { type: 'jsonb', name: 'meta', defaultValue: {} },
    ],
  });
  await anotherDB.sync();
  (another.acl.getRole('root') || another.acl.define({ role: 'root' })).grantAction('files:get', {});
  (another.acl.getRole('admin') || another.acl.define({ role: 'admin' })).grantAction('files:get', {});
  return another.collectionManager.getCollection('files');
}

function enableFileAccessACL(app: MockServer) {
  app.options.acl = true;
  app.dataSourceManager.get('main').options.useACL = true;
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe('file manager > server', () => {
  let app;
  let agent;
  let db;
  let plugin: PluginFileManagerServer;
  let StorageRepo;
  let AttachmentRepo;
  let local;
  let defaultStorage;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;
    plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;

    AttachmentRepo = db.getCollection('attachments').repository;
    StorageRepo = db.getCollection('storages').repository;
    defaultStorage = await StorageRepo.findOne();
    local = await StorageRepo.findOne({
      filter: {
        type: STORAGE_TYPE_LOCAL,
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('api', () => {
    describe('createFileRecord', () => {
      it('should be create file record', async () => {
        const model = await plugin.createFileRecord({
          collectionName: 'attachments',
          filePath: path.resolve(__dirname, './files/text.txt'),
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          // size: 13,
          meta: {},
        };
        expect(model.toJSON()).toMatchObject(matcher);
        expect(model.get('path')).toBe('');
        expect(model.get('storageId')).toBe(defaultStorage.id);
      });

      it('should hide attachments list even when role strategy allows file actions', async () => {
        await app.destroy();
        app = await getApp({ acl: true });
        agent = app.agent();
        db = app.db;

        AttachmentRepo = db.getCollection('attachments').repository;
        StorageRepo = db.getCollection('storages').repository;
        defaultStorage = await StorageRepo.findOne();

        app.acl.define({
          role: 'attachment-manager',
          strategy: {
            actions: '*',
          },
        });
        app.resourcer.use(
          async (ctx, next) => {
            ctx.state.currentRole = 'attachment-manager';
            ctx.state.currentRoles = ['attachment-manager'];
            await next();
          },
          {
            tag: 'setAttachmentManagerRole',
            after: 'auth',
            before: 'acl',
          },
        );

        const user = await db.getRepository('users').findOne();
        const userAgent = await agent.login(user.id);
        const attachment = await AttachmentRepo.create({
          values: {
            title: 'acl-test',
            filename: 'acl-test.txt',
            extname: '.txt',
            path: '',
            mimetype: 'text/plain',
            storageId: defaultStorage.id,
            createdById: user.id,
          },
        });

        const getResponse = await userAgent.resource('attachments').get({
          filterByTk: attachment.id,
        });
        expect(getResponse.statusCode).toBe(200);

        const listResponse = await userAgent.resource('attachments').list();
        expect(listResponse.statusCode).toBe(404);
      });

      it('should be local2 storage', async () => {
        const storage = await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            baseUrl: DEFAULT_LOCAL_BASE_URL,
            rules: {
              size: 1024,
            },
            paranoid: true,
          },
        });
        const model = await plugin.createFileRecord({
          collectionName: 'attachments',
          storageName: 'local2',
          filePath: path.resolve(__dirname, './files/text.txt'),
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          // size: 13,
          meta: {},
        };
        expect(model.toJSON()).toMatchObject(matcher);
        expect(model.get('path')).toBe('');
        expect(model.get('storageId')).toBe(storage.id);
      });

      it('should be custom values', async () => {
        const model = await plugin.createFileRecord({
          collectionName: 'attachments',
          filePath: path.resolve(__dirname, './files/text.txt'),
          values: {
            size: 22,
          },
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          size: 22,
          meta: {},
        };
        expect(model.toJSON()).toMatchObject(matcher);
        expect(model.get('path')).toBe('');
        expect(model.get('storageId')).toBe(defaultStorage.id);
      });

      it('should append subPath under storage path', async () => {
        const storage = await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            baseUrl: DEFAULT_LOCAL_BASE_URL,
            path: 'base',
            rules: {
              size: 1024,
            },
            paranoid: true,
          },
        });

        const model = await plugin.createFileRecord({
          collectionName: 'attachments',
          storageName: 'local2',
          filePath: path.resolve(__dirname, './files/text.txt'),
          subPath: 'orders/123',
        });

        expect(model.toJSON()).toMatchObject({
          title: 'text',
          extname: '.txt',
          meta: {},
        });
        expect(model.get('path')).toBe('base/orders/123');
        expect(model.get('storageId')).toBe(storage.id);

        const cachedStorage = plugin.storagesCache.get(storage.id);
        expect(cachedStorage.path).toBe('base');

        const file = await fs.readFile(
          path.resolve(process.cwd(), LOCAL_STORAGE_DEST, 'base/orders/123', model.get('filename')),
        );
        expect(file.toString().includes('Hello world!')).toBe(true);
      });
    });

    describe('uploadFile', () => {
      it('should be upload file', async () => {
        const data = await plugin.uploadFile({
          filePath: path.resolve(__dirname, './files/text.txt'),
          documentRoot: 'storage/backups/test',
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          meta: {},
          storageId: defaultStorage.id,
        };
        expect(data).toMatchObject(matcher);
      });

      it('should upload file to subPath', async () => {
        const data = await plugin.uploadFile({
          filePath: path.resolve(__dirname, './files/text.txt'),
          documentRoot: 'storage/backups/test',
          subPath: 'exports/2026',
        });

        expect(data).toMatchObject({
          title: 'text',
          extname: '.txt',
          path: 'exports/2026',
          meta: {},
          storageId: defaultStorage.id,
        });

        const file = await fs.readFile(
          path.resolve(process.cwd(), 'storage/backups/test', 'exports/2026', data.filename),
        );
        expect(file.toString().includes('Hello world!')).toBe(true);
      });

      it('should reject unsafe subPath before upload', async () => {
        await expect(
          plugin.uploadFile({
            filePath: path.resolve(__dirname, './files/text.txt'),
            subPath: '../outside',
          }),
        ).rejects.toThrow('Access denied');

        await expect(
          plugin.uploadFile({
            filePath: path.resolve(__dirname, './files/text.txt'),
            subPath: '/absolute',
          }),
        ).rejects.toThrow('Invalid storage sub path');
      });
    });

    describe('getFileURL', () => {
      it('local attachment without env', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/[]中文报告! 1%~50.4% (123) {$#}.txt'),
        });

        const url = await plugin.getFileURL(body.data);
        expect(url).toBe(`${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}${body.data.url}`);
      });

      it('keeps permanent file URL path-only when API_BASE_URL is absolute', async () => {
        const originalApiBaseUrl = process.env.API_BASE_URL;
        const originalPath = process.env.APP_PUBLIC_PATH;
        process.env.API_BASE_URL = 'https://example.com/nocobase/api/';
        process.env.APP_PUBLIC_PATH = '/nocobase';

        try {
          const admin = await db.getRepository('users').findOne();
          const loggedAgent = await app.agent().login(admin);
          const { body } = await agent.resource('attachments').create({
            [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
          });

          expect(body.data.url).toBe(`/nocobase/files/main/main/attachments/${body.data.id}`);
          expect(body.data.preview).toBe(`/nocobase/files/main/main/attachments/${body.data.id}/preview`);

          const storageUrl = await plugin.getStorageFileURL(body.data);
          const response = await loggedAgent.get(body.data.url);

          expect(response.status).toBe(302);
          expect(response.headers.location).toBe(storageUrl);
          expect(response.headers.location).not.toBe(body.data.url);
        } finally {
          restoreEnv('API_BASE_URL', originalApiBaseUrl);
          restoreEnv('APP_PUBLIC_PATH', originalPath);
        }
      });

      it('returns permanent URLs when creating a file record from uploaded metadata', async () => {
        const { body } = await agent.resource('attachments').create({
          values: {
            title: 'direct-upload',
            filename: 'direct-upload.txt',
            extname: '.txt',
            path: '',
            size: 12,
            url: 'https://bucket.example.com/direct-upload.txt',
            mimetype: 'text/plain',
            storageId: defaultStorage.id,
            meta: {},
          },
        });

        expect(body.data.url).toBe(`/files/main/main/attachments/${body.data.id}`);
        expect(body.data.preview).toBe(`/files/main/main/attachments/${body.data.id}/preview`);
      });

      it('local (default with base url) attachment with env', async () => {
        const originalPath = process.env.APP_PUBLIC_PATH;
        process.env.APP_PUBLIC_PATH = '/app';

        try {
          const { body } = await agent.resource('attachments').create({
            [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
          });

          const url = await plugin.getFileURL(body.data);
          expect(url).toBe(`/app/files/main/main/attachments/${body.data.id}`);

          const storageUrl = await plugin.getStorageFileURL(body.data);
          expect(storageUrl).toBe(`${process.env.APP_PUBLIC_PATH}/storage/uploads/${body.data.filename}`);
        } finally {
          restoreEnv('APP_PUBLIC_PATH', originalPath);
        }
      });

      it('local (default without base url) attachment with env', async () => {
        const storage = await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            rules: {
              size: 1024,
            },
            default: true,
          },
        });

        const originalPath = process.env.APP_PUBLIC_PATH;
        process.env.APP_PUBLIC_PATH = '/nocobase/';

        try {
          const { body } = await agent.resource('attachments').create({
            [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
          });

          const url = await plugin.getFileURL(body.data);
          expect(url).toBe(`/nocobase/files/main/main/attachments/${body.data.id}`);

          const storageUrl = await plugin.getStorageFileURL(body.data);
          expect(storageUrl).toBe(`/nocobase/${body.data.filename}`);
        } finally {
          restoreEnv('APP_PUBLIC_PATH', originalPath);
        }
      });

      it('get file url with preview parameters on image', async () => {
        const storage = await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            rules: {
              size: 1024,
            },
            options: {
              thumbnailRule: '?small',
            },
            default: true,
          },
        });

        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/image.png'),
        });

        const url = await plugin.getFileURL(body.data, true);
        expect(url).toBe(
          `${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}/files/main/main/attachments/${
            body.data.id
          }/preview`,
        );

        const storageUrl = await plugin.getStorageFileURL(body.data, true);
        expect(storageUrl).toBe(
          `${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}/${body.data.filename}?small`,
        );
      });

      it('get file url with preview parameters on non-image file', async () => {
        const storage = await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            rules: {
              size: 1024,
            },
            options: {
              thumbnailRule: '?small',
            },
            default: true,
          },
        });

        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const url = await plugin.getFileURL(body.data, true);
        expect(url).toBe(
          `${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}/files/main/main/attachments/${
            body.data.id
          }/preview`,
        );

        const storageUrl = await plugin.getStorageFileURL(body.data, true);
        expect(storageUrl).toBe(`${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}/${body.data.filename}`);
      });

      it('file with null mimetype should not add preview parameter', async () => {
        const storage = await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            rules: {
              size: 1024,
            },
            options: {
              thumbnailRule: '?small',
            },
            default: true,
          },
        });

        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        await AttachmentRepo.update({
          values: {
            mimetype: null,
          },
          filter: {
            id: body.data.id,
          },
        });
        const file = await AttachmentRepo.findOne({
          filterByTk: body.data.id,
        });
        expect(file.mimetype).toBeNull();
        const url = await plugin.getFileURL(file, true);
        expect(url).toBe(
          `${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}/files/main/main/attachments/${file.id}/preview`,
        );

        const storageUrl = await plugin.getStorageFileURL(file, true);
        expect(storageUrl).toBe(`${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}/${file.filename}`);
      });
    });

    describe('file access URL', () => {
      it('redirects permanent URL to storage URL for logged in users', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const storageUrl = await plugin.getStorageFileURL(body.data);
        const response = await loggedAgent.get(body.data.url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(storageUrl);
      });

      it('supports HEAD redirects without a response body', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const response = await loggedAgent.head(body.data.url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getStorageFileURL(body.data));
        expect(response.text || '').toBe('');
      });

      it('rejects non-GET and non-HEAD permanent URL requests', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const response = await loggedAgent.post(body.data.url);

        expect(response.status).toBe(405);
      });

      it('always resolves permanent URL by the id field', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const collection = db.getCollection('attachments');
        const originalFilterTargetKey = collection.options.filterTargetKey;
        collection.options.filterTargetKey = 'filename';

        try {
          const { body } = await agent.resource('attachments').create({
            [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
          });

          const response = await loggedAgent.get(body.data.url);

          expect(response.status).toBe(302);
          expect(response.headers.location).toBe(await plugin.getStorageFileURL(body.data));
        } finally {
          collection.options.filterTargetKey = originalFilterTargetKey;
        }
      });

      it('redirects permanent URL with auth cookies when headers are absent', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const checkResponse = await loggedAgent.resource('auth').check();
        const token = checkResponse.request.header['Authorization'].replace('Bearer ', '');
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const response = await app
          .agent()
          .get(body.data.url)
          .set('Cookie', [
            `${getAuthCookieName('authToken', app.name)}=${token}`,
            `${getAuthCookieName('authenticator', app.name)}=basic`,
          ]);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getStorageFileURL(body.data));
        expect(response.headers['set-cookie']).toBeUndefined();
      });

      it('redirects file template permanent URL to storage URL', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const file = await plugin.createFileRecord({
          collectionName: 'files',
          filePath: path.resolve(__dirname, './files/text.txt'),
        });
        const found = await db.getRepository('files').findOne({
          filterByTk: file.id,
        });

        expect(found.url).toBe(`/files/main/main/files/${file.id}`);
        expect(found.preview).toBe(`/files/main/main/files/${file.id}/preview`);
        expect(found.get('local')).toBe(true);

        const response = await loggedAgent.get(found.url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getStorageFileURL(found));
      });

      it('uses current app name in permanent URL and rejects other app names', async () => {
        const originalName = app.options.name;
        app.options.name = 'subapp';

        try {
          const admin = await db.getRepository('users').findOne();
          const loggedAgent = await app.agent().login(admin);
          const { body } = await agent.resource('attachments').create({
            [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
          });

          expect(body.data.url).toBe(`/files/subapp/main/attachments/${body.data.id}`);

          const response = await loggedAgent.get(body.data.url);
          expect(response.status).toBe(302);
          expect(response.headers.location).toBe(await plugin.getStorageFileURL(body.data));

          const wrongAppResponse = await loggedAgent.get(`/files/main/main/attachments/${body.data.id}`);
          expect(wrongAppResponse.status).toBe(404);
        } finally {
          app.options.name = originalName;
        }
      });

      it('redirects permanent URL for another data source', async () => {
        await app.destroy();
        app = await getApp({ plugins: ['data-source-manager'] });
        agent = app.agent();
        db = app.db;
        plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;

        const anotherFiles = await createAnotherFileCollection(app);
        const fileData = await plugin.uploadFile({
          filePath: path.resolve(__dirname, './files/text.txt'),
        });
        const file = await anotherFiles.repository.create({ values: fileData });
        const url = plugin.getPermanentFileURL(file, false, {
          dataSourceKey: 'another',
          collectionName: 'files',
        });

        expect(url).toBe(`/files/main/another/files/${file.id}`);

        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const response = await loggedAgent.get(url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getStorageFileURL(file));

        const wrongDataSourceResponse = await loggedAgent.get(`/files/main/main/files/${file.id}`);
        expect(wrongDataSourceResponse.status).toBe(404);
      });

      it('rejects invalid identifier path segments', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const invalidDataSourceResponse = await loggedAgent.get(
          `/files/main/main%2Fsource/attachments/${body.data.id}`,
        );
        expect(invalidDataSourceResponse.status).toBe(404);

        const invalidCollectionResponse = await loggedAgent.get(`/files/main/main/attachments%20x/${body.data.id}`);
        expect(invalidCollectionResponse.status).toBe(404);

        const response = await loggedAgent.get(body.data.url);
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getStorageFileURL(body.data));
      });

      it('redirects permanent preview URL to storage preview URL', async () => {
        await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            rules: {
              size: 1024,
            },
            options: {
              thumbnailRule: '?small',
            },
            default: true,
          },
        });
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/image.png'),
        });

        const storageUrl = await plugin.getStorageFileURL(body.data, true);
        const response = await loggedAgent.get(body.data.preview);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(storageUrl);
      });

      it('returns 403 without credentials when anonymous has no view permission', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        enableFileAccessACL(app);

        const response = await app.agent().get(body.data.url);

        expect(response.status).toBe(403);
      });

      it('redirects without credentials when anonymous can view attachments', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        enableFileAccessACL(app);
        (app.acl.getRole('anonymous') || app.acl.define({ role: 'anonymous' })).grantAction('attachments:get', {});

        const response = await app.agent().get(body.data.url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getStorageFileURL(body.data));
      });

      it('redirects when a file access authorizer allows the file', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        enableFileAccessACL(app);
        plugin.registerFileAccessAuthorizer({
          name: 'test-authorizer',
          authorize: async (_ctx, params) =>
            params.collectionName === 'attachments' && params.id === String(body.data.id),
        });

        const response = await app.agent().get(body.data.url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getStorageFileURL(body.data));
      });

      it('returns 401 with an invalid cookie token', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const response = await app
          .agent()
          .get(body.data.url)
          .set('Cookie', [
            `${getAuthCookieName('authToken', app.name)}=invalid-token`,
            `${getAuthCookieName('authenticator', app.name)}=basic`,
          ]);

        expect(response.status).toBe(401);
      });

      it('returns 403 when role cannot view attachments', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        enableFileAccessACL(app);
        app.acl.define({
          role: 'file-denied',
        });
        const admin = await db.getRepository('users').findOne();
        const deniedAgent = (await app.agent().login(admin)).set('X-Role', 'file-denied');

        const response = await deniedAgent.get(body.data.url);

        expect(response.status).toBe(403);
      });

      it('returns 404 for non-file collections', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);

        const response = await loggedAgent.get('/files/main/main/users/1');

        expect(response.status).toBe(404);
      });

      it('supports APP_PUBLIC_PATH when handling permanent URL', async () => {
        const originalPath = process.env.APP_PUBLIC_PATH;
        process.env.APP_PUBLIC_PATH = '/nocobase';

        try {
          const admin = await db.getRepository('users').findOne();
          const loggedAgent = await app.agent().login(admin);
          const { body } = await agent.resource('attachments').create({
            [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
          });

          expect(body.data.url).toBe(`/nocobase/files/main/main/attachments/${body.data.id}`);

          const response = await loggedAgent.get(body.data.url);

          expect(response.status).toBe(302);
          expect(response.headers.location).toBe(await plugin.getStorageFileURL(body.data));
        } finally {
          restoreEnv('APP_PUBLIC_PATH', originalPath);
        }
      });

      it('uses the same app auth cookies for API and APP_PUBLIC_PATH file access', async () => {
        const originalPath = process.env.APP_PUBLIC_PATH;
        process.env.APP_PUBLIC_PATH = '/nocobase';

        try {
          const admin = await db.getRepository('users').findOne();
          const loggedAgent = await app.agent().login(admin);
          const authCheckResponse = await loggedAgent.resource('auth').check();
          const token = authCheckResponse.request.header['Authorization'].replace('Bearer ', '');
          const cookieHeader = [
            `${getAuthCookieName('authToken', app.name)}=${token}`,
            `${getAuthCookieName('authenticator', app.name)}=basic`,
          ];

          const apiCheckResponse = await app.agent().get('/auth:check').set('Cookie', cookieHeader);
          expect(apiCheckResponse.status).toBe(200);

          const { body } = await agent.resource('attachments').create({
            [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
          });
          expect(body.data.url).toBe(`/nocobase/files/main/main/attachments/${body.data.id}`);

          const fileResponse = await app.agent().get(body.data.url).set('Cookie', cookieHeader);
          expect(fileResponse.status).toBe(302);
          expect(fileResponse.headers.location).toBe(await plugin.getStorageFileURL(body.data));
        } finally {
          restoreEnv('APP_PUBLIC_PATH', originalPath);
        }
      });

      it('uses sub app auth cookies when APP_PUBLIC_PATH is set', async () => {
        const originalPath = process.env.APP_PUBLIC_PATH;
        const originalName = app.options.name;
        process.env.APP_PUBLIC_PATH = '/nocobase';
        app.options.name = 'subapp';

        try {
          const admin = await db.getRepository('users').findOne();
          const loggedAgent = await app.agent().login(admin);
          const authCheckResponse = await loggedAgent.resource('auth').check();
          const token = authCheckResponse.request.header['Authorization'].replace('Bearer ', '');
          const cookieHeader = [
            `${getAuthCookieName('authToken', 'subapp')}=${token}`,
            `${getAuthCookieName('authenticator', 'subapp')}=basic`,
          ];

          const { body } = await agent.resource('attachments').create({
            [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
          });
          expect(body.data.url).toBe(`/nocobase/files/subapp/main/attachments/${body.data.id}`);

          const response = await app.agent().get(body.data.url).set('Cookie', cookieHeader);
          expect(response.status).toBe(302);
          expect(response.headers.location).toBe(await plugin.getStorageFileURL(body.data));
        } finally {
          app.options.name = originalName;
          restoreEnv('APP_PUBLIC_PATH', originalPath);
        }
      });

      it('keeps external URL records without storageId unchanged', async () => {
        const externalUrl = 'https://example.com/files/a b.png';
        const attachment = await AttachmentRepo.create({
          values: {
            title: 'external',
            url: externalUrl,
          },
        });
        const found = await AttachmentRepo.findOne({
          filterByTk: attachment.id,
        });

        expect(found.url).toBe('https://example.com/files/a%20b.png');
        expect(await plugin.getFileURL(found, true)).toBe('https://example.com/files/a%20b.png');
      });
    });

    describe('getFileStream', () => {
      it('should get file stream for local storage', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const result = await plugin.getFileStream(body.data);
        expect(result).toHaveProperty('stream');
        expect(result.stream).toBeInstanceOf(Readable);
        expect(result).toHaveProperty('contentType');
        expect(result.contentType).toBe('text/plain');
      });

      it('should throw error when file not found', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        // Modify the file path to a non-existent one
        body.data.path = 'non-existent-path';

        await expect(plugin.getFileStream(body.data)).rejects.toThrow();
      });

      it('should reject path traversal', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        body.data.path = '..';
        body.data.filename = 'package.json';

        await expect(plugin.getFileStream(body.data)).rejects.toThrow('Access denied');
      });

      it('should throw error when storage not found', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        // Remove storageId to simulate storage not found
        delete body.data.storageId;

        await expect(plugin.getFileStream(body.data)).rejects.toThrow('File storageId not found');
      });
    });
  });
});
