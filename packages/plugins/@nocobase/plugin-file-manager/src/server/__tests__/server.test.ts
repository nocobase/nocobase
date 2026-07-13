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
import jwt from 'jsonwebtoken';
import { getApp } from '.';
import PluginFileManagerServer from '../server';
import {
  deriveTemporaryFileAccessSecret,
  TEMPORARY_FILE_ACCESS_AUDIENCE,
  type TemporaryFileAccessPayload,
} from '../temporary-access';

import { FILE_FIELD_NAME, STORAGE_TYPE_LOCAL, STORAGE_TYPE_S3 } from '../../constants';

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

        const url = await plugin.getFileURL(data);
        expect(url).toBe(await plugin.getFileURL(data));
        expect(url).not.toContain('/files/main/main/attachments/undefined');
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
        expect(url).toBe(await plugin.getFileURL(body.data));
        expect(url).not.toBe(body.data.url);
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

          expect(body.data.url).toBe(`/nocobase/files/main/main/attachments/${body.data.id}${body.data.extname}`);
          expect(body.data.preview).toBe(
            `/nocobase/files/main/main/attachments/${body.data.id}${body.data.extname}?preview=1`,
          );

          const storageUrl = await plugin.getFileURL(body.data);
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

        expect(body.data.url).toBe(`/files/main/main/attachments/${body.data.id}${body.data.extname}`);
        expect(body.data.preview).toBe(`/files/main/main/attachments/${body.data.id}${body.data.extname}?preview=1`);
      });

      it('local (default with base url) attachment with env', async () => {
        const originalPath = process.env.APP_PUBLIC_PATH;
        process.env.APP_PUBLIC_PATH = '/app';

        try {
          const { body } = await agent.resource('attachments').create({
            [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
          });

          const url = await plugin.getFileURL(body.data);
          expect(url).toBe(`${process.env.APP_PUBLIC_PATH}/storage/uploads/${body.data.filename}`);
          expect(body.data.url).toBe(`/app/files/main/main/attachments/${body.data.id}${body.data.extname}`);

          const storageUrl = await plugin.getFileURL(body.data);
          expect(url).toBe(storageUrl);
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
          expect(url).toBe(`/nocobase/${body.data.filename}`);
          expect(body.data.url).toBe(`/nocobase/files/main/main/attachments/${body.data.id}${body.data.extname}`);

          const storageUrl = await plugin.getFileURL(body.data);
          expect(url).toBe(storageUrl);
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
        expect(url).toBe(`${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}/${body.data.filename}?small`);
        expect(body.data.preview).toBe(`/files/main/main/attachments/${body.data.id}${body.data.extname}?preview=1`);

        const storageUrl = await plugin.getFileURL(body.data, true);
        expect(url).toBe(storageUrl);
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
        expect(url).toBe(`${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}/${body.data.filename}`);
        expect(body.data.preview).toBe(`/files/main/main/attachments/${body.data.id}${body.data.extname}?preview=1`);

        const storageUrl = await plugin.getFileURL(body.data, true);
        expect(url).toBe(storageUrl);
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
        expect(url).toBe(`${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}/${file.filename}`);
        expect(plugin.getPermanentFileURL(file, true)).toBe(
          `/files/main/main/attachments/${file.id}${file.extname}?preview=1`,
        );

        const storageUrl = await plugin.getFileURL(file, true);
        expect(url).toBe(storageUrl);
      });
    });

    describe('file access URL', () => {
      it('creates and consumes a temporary file access URL', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        enableFileAccessACL(app);
        const mainAcl = app.dataSourceManager.get('main').acl;
        mainAcl.define({ role: 'temporary-viewer' }).grantAction('attachments:get', {});
        app.resourcer.use(
          async (ctx, next) => {
            ctx.state.currentRole = 'temporary-viewer';
            ctx.state.currentRoles = ['temporary-viewer'];
            await next();
          },
          { tag: 'setTemporaryViewerRole', after: 'auth', before: 'acl' },
        );

        const createResponse = await loggedAgent.post(`/attachments:createTemporaryURL/${body.data.id}`);

        expect(createResponse.status).toBe(200);
        expect(createResponse.headers['cache-control']).toBe('no-store');
        expect(createResponse.body.data.url).toMatch(
          new RegExp(`/files/main/main/attachments/${body.data.id}${body.data.extname}\\?temporaryAccessToken=`),
        );
        expect(createResponse.body.data.url.length).toBeLessThan(2048);

        const response = await app.agent().get(createResponse.body.data.url);
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
        expect(response.headers['cache-control']).toBe('private, no-store');
        expect(response.headers['referrer-policy']).toBe('no-referrer');

        const headResponse = await app.agent().head(createResponse.body.data.url);
        expect(headResponse.status).toBe(302);
        expect(headResponse.headers.location).toBe(await plugin.getFileURL(body.data));
        expect(headResponse.text || '').toBe('');

        const postResponse = await app.agent().post(createResponse.body.data.url);
        expect(postResponse.status).toBe(405);
      });

      it('creates temporary URLs for file template collections and another data source', async () => {
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
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = (await app.agent().login(admin)).set('X-Data-Source', 'another');

        const createResponse = await loggedAgent.post(`/api/files:createTemporaryURL/${file.id}`);

        expect(createResponse.status).toBe(200);
        expect(createResponse.body.data.url).toContain(
          `/files/main/another/files/${file.id}${file.extname}?temporaryAccessToken=`,
        );
        const response = await app.agent().get(createResponse.body.data.url);
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getFileURL(file));
      });

      it('delegates file URL resolution to the selected data source', async () => {
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
        const findOne = anotherFiles.repository.findOne.bind(anotherFiles.repository);
        vi.spyOn(anotherFiles.repository, 'findOne').mockImplementation(async (options) => {
          const record = await findOne(options);
          return record?.get();
        });
        const another = app.dataSourceManager.get('another') as SequelizeDataSource & {
          resolveStorageFileURL: (options: {
            collectionName: string;
            file: Record<string, unknown>;
            preview: boolean;
            download: boolean;
          }) => Promise<string>;
        };
        const resolveStorageFileURL = vi.fn().mockResolvedValue('https://remote.example.com/files/text.txt');
        another.resolveStorageFileURL = resolveStorageFileURL;
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = (await app.agent().login(admin)).set('X-Data-Source', 'another');

        const createResponse = await loggedAgent.post(`/api/files:createTemporaryURL/${file.id}`);
        const response = await app.agent().get(createResponse.body.data.url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('https://remote.example.com/files/text.txt');
        expect(resolveStorageFileURL).toHaveBeenCalledWith(
          expect.objectContaining({
            collectionName: 'files',
            file: expect.objectContaining({ id: file.id, storageId: file.storageId }),
            preview: false,
            download: false,
          }),
        );
      });

      it('requires login and file get permission to create a temporary URL', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        enableFileAccessACL(app);

        const anonymousResponse = await app.agent().post(`/attachments:createTemporaryURL/${body.data.id}`);
        expect([401, 403]).toContain(anonymousResponse.status);

        app.acl.define({ role: 'file-denied' });
        const admin = await db.getRepository('users').findOne();
        const deniedAgent = (await app.agent().login(admin)).set('X-Role', 'file-denied');
        const deniedResponse = await deniedAgent.post(`/attachments:createTemporaryURL/${body.data.id}`);
        expect(deniedResponse.status).toBe(403);
      });

      it('rejects missing, expired, forged, and resource-mismatched temporary tokens', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        const createResponse = await loggedAgent.post(`/attachments:createTemporaryURL/${body.data.id}`);
        const temporaryUrl = new URL(createResponse.body.data.url, 'http://localhost');
        const token = temporaryUrl.searchParams.get('temporaryAccessToken');
        const payload = jwt.decode(token) as TemporaryFileAccessPayload;
        const pathWithoutQuery = temporaryUrl.pathname;

        expect((await app.agent().get(`${pathWithoutQuery}?temporaryAccessToken=invalid`)).status).toBe(403);

        const expiredToken = jwt.sign(
          {
            app: payload.app,
            dataSource: payload.dataSource,
            collection: payload.collection,
            id: payload.id,
            storageId: payload.storageId,
          },
          deriveTemporaryFileAccessSecret(plugin),
          { algorithm: 'HS256', audience: TEMPORARY_FILE_ACCESS_AUDIENCE, expiresIn: -1 },
        );
        expect((await app.agent().get(`${pathWithoutQuery}?temporaryAccessToken=${expiredToken}`)).status).toBe(403);

        const loginSecretToken = jwt.sign(
          {
            app: payload.app,
            dataSource: payload.dataSource,
            collection: payload.collection,
            id: payload.id,
            storageId: payload.storageId,
          },
          app.authManager.jwt.getSecret(),
          { algorithm: 'HS256', audience: TEMPORARY_FILE_ACCESS_AUDIENCE, expiresIn: '10m' },
        );
        expect((await app.agent().get(`${pathWithoutQuery}?temporaryAccessToken=${loginSecretToken}`)).status).toBe(
          403,
        );

        await AttachmentRepo.update({
          filter: { id: body.data.id },
          values: { storageId: defaultStorage.id + 1000 },
        });
        expect((await app.agent().get(`${pathWithoutQuery}?temporaryAccessToken=${token}`)).status).toBe(403);
      });

      it('ignores invalid login cookies when a temporary token is valid', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        const createResponse = await loggedAgent.post(`/attachments:createTemporaryURL/${body.data.id}`);

        const response = await app
          .agent()
          .get(createResponse.body.data.url)
          .set('Cookie', [
            `${getAuthCookieName('authToken', app.name)}=expired-or-invalid`,
            `${getAuthCookieName('authenticator', app.name)}=basic`,
          ]);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
      });

      it('does not create temporary URLs for non-file collections or external URL records', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const nonFileResponse = await loggedAgent.post('/users:createTemporaryURL/1');
        expect(nonFileResponse.status).toBe(404);

        const external = await AttachmentRepo.create({
          values: {
            title: 'external',
            filename: 'external.docx',
            url: 'https://example.com/external.docx',
          },
        });
        const externalResponse = await loggedAgent.post(`/attachments:createTemporaryURL/${external.id}`);
        expect(externalResponse.status).toBe(404);
      });

      it('redirects permanent URL to storage URL for logged in users', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const storageUrl = await plugin.getFileURL(body.data);
        const response = await loggedAgent.get(body.data.url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(storageUrl);
      });

      it('keeps permanent URLs without extname compatible', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        const legacyUrl = `/files/main/main/attachments/${body.data.id}`;

        const response = await loggedAgent.get(legacyUrl);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
      });

      it('rejects path-based preview and temporary access modifiers', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        expect((await loggedAgent.get(`${body.data.url}/preview`)).status).toBe(404);
        expect((await loggedAgent.get(`${body.data.url}/temporary-access/${body.data.filename}`)).status).toBe(404);
      });

      it('rejects combining preview and temporary access', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });
        const createResponse = await loggedAgent.post(`/attachments:createTemporaryURL/${body.data.id}`);
        const temporaryUrl = new URL(createResponse.body.data.url, 'http://localhost');
        temporaryUrl.searchParams.set('preview', '1');

        expect((await app.agent().get(`${temporaryUrl.pathname}${temporaryUrl.search}`)).status).toBe(404);
      });

      it('rejects a permanent URL with an extname that does not match the file record', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const response = await loggedAgent.get(`/files/main/main/attachments/${body.data.id}.docx`);

        expect(response.status).toBe(404);
      });

      it('does not append an extname when the file record has none', async () => {
        const file = await AttachmentRepo.create({
          values: {
            title: 'extensionless',
            filename: 'extensionless',
            extname: '',
            path: '',
            size: 12,
            url: 'https://bucket.example.com/extensionless',
            mimetype: 'application/octet-stream',
            storageId: defaultStorage.id,
            meta: {},
          },
        });

        expect(plugin.getPermanentFileURL(file)).toBe(`/files/main/main/attachments/${file.id}`);
      });

      it('does not allow extname to be changed after creation', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        await AttachmentRepo.update({
          filterByTk: body.data.id,
          values: { extname: '.docx' },
        });
        const file = await AttachmentRepo.findOne({ filterByTk: body.data.id });

        expect(file.extname).toBe('.txt');
        expect(plugin.getPermanentFileURL(file)).toBe(`/files/main/main/attachments/${file.id}.txt`);
      });

      it('redirects permanent URL downloads without proxying the file stream', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const response = await loggedAgent.get(`${body.data.url}?download=1`);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getFileURL(body.data, false, { download: true }));
      });

      it('redirects external storage downloads to a signed attachment URL', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const storage = await StorageRepo.create({
          values: {
            name: `download-s3-${uid(6)}`,
            title: 'Download S3',
            type: STORAGE_TYPE_S3,
            baseUrl: 'https://bucket.example.com',
            options: {
              region: 'us-east-1',
              endpoint: 'https://s3.example.com',
              accessKeyId: 'access-key',
              secretAccessKey: 'secret-key',
              bucket: 'bucket',
            },
          },
        });
        const file = await AttachmentRepo.create({
          values: {
            title: 'report',
            filename: 'report.pdf',
            extname: '.pdf',
            mimetype: 'application/pdf',
            path: '',
            storageId: storage.id,
          },
        });

        const response = await loggedAgent.get(`${file.url}?download=1`);
        const location = new URL(response.headers.location);

        expect(response.status).toBe(302);
        expect(location.searchParams.get('response-content-disposition')).toContain('attachment');
        expect(location.searchParams.get('X-Amz-Signature')).toBeTruthy();
      });

      it('supports HEAD redirects without a response body', async () => {
        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const response = await loggedAgent.head(body.data.url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
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
          expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
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
        expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
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

        expect(found.url).toBe(`/files/main/main/files/${file.id}${file.extname}`);
        expect(found.preview).toBe(`/files/main/main/files/${file.id}${file.extname}?preview=1`);
        expect(found.get('local')).toBe(true);

        const response = await loggedAgent.get(found.url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getFileURL(found));
      });

      it('does not persist the local response flag when associating file records', async () => {
        const user = await db.getRepository('users').create({
          values: {
            name: 'file-owner',
          },
        });
        const file = await plugin.createFileRecord({
          collectionName: 'files',
          filePath: path.resolve(__dirname, './files/text.txt'),
        });

        await user.setFiles([file]);
        await user.setFiles([], { individualHooks: true });

        const associatedFile = await db.getRepository('files').findOne({
          filterByTk: file.id,
        });
        expect(associatedFile.get('userId')).toBeNull();
        expect(associatedFile.get('local')).toBe(true);
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

          expect(body.data.url).toBe(`/files/subapp/main/attachments/${body.data.id}${body.data.extname}`);

          const response = await loggedAgent.get(body.data.url);
          expect(response.status).toBe(302);
          expect(response.headers.location).toBe(await plugin.getFileURL(body.data));

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

        expect(url).toBe(`/files/main/another/files/${file.id}${file.extname}`);

        const admin = await db.getRepository('users').findOne();
        const loggedAgent = await app.agent().login(admin);
        const response = await loggedAgent.get(url);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(await plugin.getFileURL(file));

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
        expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
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

        const storageUrl = await plugin.getFileURL(body.data, true);
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
        expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
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
        expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
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

          expect(body.data.url).toBe(`/nocobase/files/main/main/attachments/${body.data.id}${body.data.extname}`);

          const response = await loggedAgent.get(body.data.url);

          expect(response.status).toBe(302);
          expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
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
          expect(body.data.url).toBe(`/nocobase/files/main/main/attachments/${body.data.id}${body.data.extname}`);

          const fileResponse = await app.agent().get(body.data.url).set('Cookie', cookieHeader);
          expect(fileResponse.status).toBe(302);
          expect(fileResponse.headers.location).toBe(await plugin.getFileURL(body.data));
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
          expect(body.data.url).toBe(`/nocobase/files/subapp/main/attachments/${body.data.id}${body.data.extname}`);

          const response = await app.agent().get(body.data.url).set('Cookie', cookieHeader);
          expect(response.status).toBe(302);
          expect(response.headers.location).toBe(await plugin.getFileURL(body.data));
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
