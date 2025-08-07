/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import path from 'path';
import querystring from 'querystring';
import { getApp } from '.';
import { FILE_FIELD_NAME, FILE_SIZE_LIMIT_DEFAULT, STORAGE_TYPE_LOCAL } from '../../constants';
import PluginFileManagerServer from '../server';

const { LOCAL_STORAGE_BASE_URL, LOCAL_STORAGE_DEST = 'storage/uploads', APP_PORT = '13000' } = process.env;

const DEFAULT_LOCAL_BASE_URL = LOCAL_STORAGE_BASE_URL || `/storage/uploads`;

describe('action', () => {
  let app;
  let agent;
  let db;
  let StorageRepo;
  let AttachmentRepo;
  let local1;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;

    AttachmentRepo = db.getCollection('attachments').repository;
    StorageRepo = db.getCollection('storages').repository;
    local1 = await StorageRepo.create({
      values: {
        name: 'local1',
        title: 'local1',
        type: STORAGE_TYPE_LOCAL,
        baseUrl: DEFAULT_LOCAL_BASE_URL,
        rules: {
          size: 1024,
        },
        paranoid: true,
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('create / upload', () => {
    describe('default storage', () => {
      it('should be create file record', async () => {
        const Plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
        const model = await Plugin.createFileRecord({
          collectionName: 'attachments',
          filePath: path.resolve(__dirname, './files/text.txt'),
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          // size: 13,
          meta: {},
          storageId: 1,
        };
        expect(model.toJSON()).toMatchObject(matcher);
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
        const Plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
        const model = await Plugin.createFileRecord({
          collectionName: 'attachments',
          storageName: 'local2',
          filePath: path.resolve(__dirname, './files/text.txt'),
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          // size: 13,
          meta: {},
          storageId: storage.id,
        };
        expect(model.toJSON()).toMatchObject(matcher);
      });

      it('should be custom values', async () => {
        const Plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
        const model = await Plugin.createFileRecord({
          collectionName: 'attachments',
          filePath: path.resolve(__dirname, './files/text.txt'),
          values: {
            size: 22,
          },
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          size: 22,
          meta: {},
          storageId: 1,
        };
        expect(model.toJSON()).toMatchObject(matcher);
      });

      it('should be upload file', async () => {
        const Plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
        const data = await Plugin.uploadFile({
          filePath: path.resolve(__dirname, './files/text.txt'),
          documentRoot: 'storage/backups/test',
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          meta: {},
          storageId: 1,
        };
        expect(data).toMatchObject(matcher);
      });

      it('upload file should be ok', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          // size: 13,
          mimetype: 'text/plain',
          meta: {},
          storageId: 1,
        };

        // 文件上传和解析是否正常
        expect(body.data).toMatchObject(matcher);
        // 文件的 url 是否正常生成
        expect(body.data.url).toBe(`${DEFAULT_LOCAL_BASE_URL}${body.data.path}/${body.data.filename}`);

        const Attachment = db.getModel('attachments');
        const attachment = await Attachment.findOne({
          where: { id: body.data.id },
          include: ['storage'],
        });
        // 文件的数据是否正常保存
        expect(attachment).toMatchObject(matcher);

        // 关联的存储引擎是否正确
        const storage = await attachment.getStorage();
        expect(storage.get()).toMatchObject({
          type: STORAGE_TYPE_LOCAL,
          options: { documentRoot: LOCAL_STORAGE_DEST },
          rules: { size: FILE_SIZE_LIMIT_DEFAULT },
          path: '',
          baseUrl: DEFAULT_LOCAL_BASE_URL,
          default: true,
        });

        const { documentRoot = 'storage/uploads' } = storage.options || {};
        const destPath = path.resolve(
          path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot),
          storage.path || '',
        );
        const file = await fs.readFile(`${destPath}/${attachment.filename}`);
        // 文件是否保存到指定路径
        expect(file.toString().includes('Hello world!')).toBeTruthy();

        // 通过 url 是否能正确访问
        const url = attachment.url.replace(`http://localhost:${APP_PORT}`, '');
        const content = await agent.get(url);
        expect(content.text.includes('Hello world!')).toBeTruthy();
      });

      it('filename with special character (URL)', async () => {
        const rawText = '[]中文报告! 1%~50.4% (123) {$#}';
        const rawFilename = `${rawText}.txt`;
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, `./files/${rawFilename}`),
        });

        const matcher = {
          title: rawText,
          extname: '.txt',
          path: '',
          mimetype: 'text/plain',
          meta: {},
          storageId: 1,
        };

        // 文件上传和解析是否正常
        expect(body.data).toMatchObject(matcher);
        // 文件的 url 是否正常生成
        const encodedFilename = querystring.escape(rawText);
        expect(body.data.url).toContain(`${DEFAULT_LOCAL_BASE_URL}${body.data.path}/${encodedFilename}`);

        // 文件的 url 是否正常访问
        // TODO: mock-server is not start within gateway, static url can not be accessed
        // const res2 = await agent.get(`${DEFAULT_LOCAL_BASE_URL}${body.data.path}/${encodedFilename}`);
        // expect(res2.text).toBe(rawText);
      });

      it('create file record should be ok', async () => {
        db.collection({
          name: 'customers',
          fields: [
            {
              name: 'avatar',
              type: 'belongsTo',
              target: 'attachments',
            },
          ],
        });
        const record = {
          title: 'text',
          extname: '.txt',
          path: '',
          // size: 13,
          meta: {},
          storageId: 1,
        };
        const { status, body } = await agent.resource('attachments').create({
          attachmentField: 'customers.avatar',
          values: record,
        });
        expect(status).toBe(200);
        expect(body.data).toMatchObject(record);
      });
    });

    describe('specific storage', () => {
      it('fail as 400 because file size greater than rules', async () => {
        db.collection({
          name: 'customers',
          fields: [
            {
              name: 'avatar',
              type: 'belongsTo',
              target: 'attachments',
              storage: 'local1',
            },
          ],
        });

        const response = await agent.resource('attachments').create({
          attachmentField: 'customers.avatar',
          file: path.resolve(__dirname, './files/image.jpg'),
        });
        expect(response.status).toBe(400);
      });

      it('fail as 400 because file mimetype does not match', async () => {
        const textStorage = await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            baseUrl: DEFAULT_LOCAL_BASE_URL,
            rules: {
              mimetype: ['text/*'],
            },
          },
        });

        db.collection({
          name: 'customers',
          fields: [
            {
              name: 'avatar',
              type: 'belongsTo',
              target: 'attachments',
              storage: textStorage.name,
            },
          ],
        });

        // await db.sync();

        const response = await agent.resource('attachments').create({
          attachmentField: 'customers.avatar',
          file: path.resolve(__dirname, './files/image.jpg'),
        });

        expect(response.status).toBe(400);
      });

      it('upload file with wrong extension but correct mime type should be ok', async () => {
        const imageStorage = await StorageRepo.create({
          values: {
            name: 'imageStorage',
            type: STORAGE_TYPE_LOCAL,
            baseUrl: DEFAULT_LOCAL_BASE_URL,
            rules: {
              mimetype: 'image/png',
            },
          },
        });

        db.collection({
          name: 'customers',
          fields: [
            {
              name: 'avatar',
              type: 'belongsTo',
              target: 'attachments',
              storage: imageStorage.name,
            },
          ],
        });

        const { body, status } = await agent.resource('attachments').create({
          attachmentField: 'customers.avatar',
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/image.txt'),
        });

        expect(status).toBe(200);
        expect(body.data.mimetype).toBe('image/png');
        expect(body.data.size).toBe(255);

        const attachment = await AttachmentRepo.findById(body.data.id);
        const { documentRoot = 'storage/uploads' } = imageStorage.options || {};
        const destPath = path.resolve(
          path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot),
          imageStorage.path || '',
        );
        const stats = await fs.stat(path.join(destPath, attachment.filename));
        expect(stats.size).toBe(255);
      });

      it('upload to storage which is not default', async () => {
        const BASE_URL = `/storage/uploads/another`;
        const urlPath = 'test/path';

        // 动态添加 storage
        const storage = await StorageRepo.create({
          values: {
            name: 'local_private',
            type: STORAGE_TYPE_LOCAL,
            rules: {
              mimetype: ['text/*'],
            },
            path: urlPath,
            baseUrl: BASE_URL,
            options: {
              documentRoot: 'storage/uploads/another',
            },
          },
        });

        db.collection({
          name: 'customers',
          fields: [
            {
              name: 'file',
              type: 'belongsTo',
              target: 'attachments',
              storage: storage.name,
            },
          ],
        });

        const { body } = await agent.resource('attachments').create({
          attachmentField: 'customers.file',
          file: path.resolve(__dirname, './files/text.txt'),
        });

        // 文件的 url 是否正常生成
        expect(body.data.url).toBe(`${BASE_URL}/${urlPath}/${body.data.filename}`);
        const url = body.data.url.replace(`http://localhost:${APP_PORT}`, '');
        const content = await agent.get(url);
        expect(content.text.includes('Hello world!')).toBe(true);
      });

      it('path with heading or tailing slash', async () => {
        const BASE_URL = `/storage/uploads/another`;
        const urlPath = 'test/path';

        // 动态添加 storage
        const storage = await StorageRepo.create({
          values: {
            name: 'local_private',
            type: STORAGE_TYPE_LOCAL,
            rules: {
              mimetype: ['text/*'],
            },
            path: `/${urlPath}//`,
            baseUrl: BASE_URL,
            options: {
              documentRoot: 'storage/uploads/another',
            },
          },
        });

        db.collection({
          name: 'customers',
          fields: [
            {
              name: 'file',
              type: 'belongsTo',
              target: 'attachments',
              storage: storage.name,
            },
          ],
        });

        const { body } = await agent.resource('attachments').create({
          attachmentField: 'customers.file',
          file: path.resolve(__dirname, './files/text.txt'),
        });

        // 文件的 url 是否正常生成
        expect(body.data.url).toBe(`${BASE_URL}/${urlPath}/${body.data.filename}`);
        const url = body.data.url.replace(`http://localhost:${APP_PORT}`, '');
        const content = await agent.get(url);
        expect(content.text.includes('Hello world!')).toBe(true);
      });

      it('path longer than 255', async () => {
        const BASE_URL = `/storage/uploads/another`;
        const urlPath =
          'extreme-test/max-long-path-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890';

        // 动态添加 storage
        const storage = await StorageRepo.create({
          values: {
            name: 'local_private',
            type: STORAGE_TYPE_LOCAL,
            rules: {
              mimetype: ['text/*'],
            },
            path: urlPath,
            baseUrl: BASE_URL,
            options: {
              documentRoot: 'storage/uploads/another',
            },
          },
        });

        db.collection({
          name: 'customers',
          fields: [
            {
              name: 'file',
              type: 'belongsTo',
              target: 'attachments',
              storage: storage.name,
            },
          ],
        });

        const { body } = await agent.resource('attachments').create({
          attachmentField: 'customers.file',
          file: path.resolve(__dirname, './files/text.txt'),
        });

        // 文件的 url 是否正常生成
        expect(body.data.url).toBe(`${BASE_URL}/${urlPath}/${body.data.filename}`);
        const url = body.data.url.replace(`http://localhost:${APP_PORT}`, '');
        const content = await agent.get(url);
        expect(content.text.includes('Hello world!')).toBe(true);
      });
    });
  });

  describe('rules', () => {
    it.skip('file size smaller than limit', async () => {
      const storage = await StorageRepo.create({
        values: {
          name: 'local_private',
          type: STORAGE_TYPE_LOCAL,
          rules: {
            size: 13,
          },
          baseUrl: '/storage/uploads',
          options: {
            documentRoot: 'storage/uploads',
          },
        },
      });

      db.collection({
        name: 'customers',
        fields: [
          {
            name: 'file',
            type: 'belongsTo',
            target: 'attachments',
            storage: storage.name,
          },
        ],
      });

      const res1 = await agent.resource('attachments').create({
        attachmentField: 'customers.file',
        file: path.resolve(__dirname, './files/text.txt'),
      });
      // console.log('-------', res1);
      expect(res1.status).toBe(200);
    });
  });

  describe('destroy', () => {
    it('destroy one existing file with `paranoid`', async () => {
      db.collection({
        name: 'customers',
        fields: [
          {
            name: 'file',
            type: 'belongsTo',
            target: 'attachments',
            storage: 'local1',
          },
        ],
      });

      await db.sync();

      const { body } = await agent.resource('attachments').create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        attachmentField: 'customers.file',
      });

      const { data: attachment } = body;

      // 关联的存储引擎是否正确
      const storage = await StorageRepo.findById(attachment.storageId);

      const { documentRoot = 'storage/uploads' } = storage.options || {};
      const destPath = path.resolve(
        path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot),
        storage.path || '',
      );
      const file = await fs.stat(path.join(destPath, attachment.filename));
      expect(file).toBeTruthy();

      const res2 = await agent.resource('attachments').destroy({ filterByTk: attachment.id });

      const attachmentExists = await AttachmentRepo.findById(attachment.id);
      expect(attachmentExists).toBeNull();

      const fileExists = await fs.stat(path.join(destPath, attachment.filename)).catch(() => false);
      expect(fileExists).toBeTruthy();
    });

    it('destroy one existing file', async () => {
      const { body } = await agent.resource('attachments').create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
      });

      const { data: attachment } = body;

      const storage = await StorageRepo.findById(attachment.storageId);

      const { documentRoot = path.join('storage', 'uploads') } = storage.options || {};
      const destPath = path.resolve(
        path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot),
        storage.path || '',
      );
      const file = await fs.stat(path.join(destPath, attachment.filename));
      expect(file).toBeTruthy();

      const res2 = await agent.resource('attachments').destroy({ filterByTk: attachment.id });

      const attachmentExists = await AttachmentRepo.findById(attachment.id);
      expect(attachmentExists).toBeNull();

      const fileExists = await fs.stat(path.join(destPath, attachment.filename)).catch(() => false);
      expect(fileExists).toBeFalsy();
    });

    it('destroy multiple existing files', async () => {
      const { body: f1 } = await agent.resource('attachments').create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
      });

      const { body: f2 } = await agent.resource('attachments').create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
      });

      const storage = await StorageRepo.findOne({
        filter: {
          name: 'local1',
        },
      });

      const { documentRoot = path.join('storage', 'uploads') } = storage.options || {};
      const destPath = path.resolve(
        path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot),
        storage.path || '',
      );
      const file1 = await fs.stat(path.join(destPath, f1.data.filename));
      expect(file1).toBeTruthy();

      const res2 = await agent.resource('attachments').destroy({ filter: { id: [f1.data.id, f2.data.id] } });

      const attachmentExists = await AttachmentRepo.count();
      expect(attachmentExists).toBe(0);

      const file1Exists = await fs.stat(path.join(destPath, f1.data.filename)).catch(() => false);
      expect(file1Exists).toBeFalsy();

      const file2Exists = await fs.stat(path.join(destPath, f2.data.filename)).catch(() => false);
      expect(file2Exists).toBeFalsy();
    });

    it('destroy record without file exists should be ok', async () => {
      const { body } = await agent.resource('attachments').create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
      });

      const { data: attachment } = body;

      const storage = await StorageRepo.findById(attachment.storageId);

      const { documentRoot = path.join('storage', 'uploads') } = storage.options || {};
      const destPath = path.resolve(
        path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot),
        storage.path || '',
      );
      const filePath = path.join(destPath, attachment.filename);
      const file = await fs.stat(filePath);
      expect(file).toBeTruthy();
      await fs.unlink(filePath);

      const res2 = await agent.resource('attachments').destroy({ filterByTk: attachment.id });
      expect(res2.status).toBe(200);

      const attachmentExists = await AttachmentRepo.findById(attachment.id);
      expect(attachmentExists).toBeNull();
    });
  });

  describe('association', () => {
    it('has-many', async () => {
      const UserRepo = db.getRepository('users');
      const user = await UserRepo.findOne();
      const FileRepo = db.getRepository('users.files', user.id);
      const f1s = await FileRepo.count();
      expect(f1s).toBe(0);
      const { body } = await agent.resource('users.files', 1).create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
      });
      const f2s = await FileRepo.find({});
      expect(f2s.length).toBe(1);
      expect(f2s[0].userId).toBe(user.id);

      await agent.resource('users.files', 1).destroy({ filterByTk: body.data.id });
      const f3s = await FileRepo.count();
      expect(f3s).toBe(0);
    });
  });

  describe('storage actions', () => {
    describe('getBasicInfo', () => {
      it('get default storage', async () => {
        const { body, status } = await agent.resource('storages').getBasicInfo();
        expect(status).toBe(200);
        expect(body.data).toMatchObject({ id: 1 });
      });

      it('get storage by unexisted id as 404', async () => {
        const { body, status } = await agent.resource('storages').getBasicInfo({ filterByTk: -1 });
        expect(status).toBe(404);
      });

      it('get by storage local id', async () => {
        const { body, status } = await agent.resource('storages').getBasicInfo({ filterByTk: local1.id });
        expect(status).toBe(200);
        expect(body.data).toMatchObject({
          id: local1.id,
          title: local1.title,
          name: local1.name,
          type: local1.type,
          rules: local1.rules,
        });
      });

      it('get storage by name', async () => {
        const { body, status } = await agent.resource('storages').getBasicInfo({ filterByTk: local1.name });
        expect(status).toBe(200);
        expect(body.data).toMatchObject({
          id: local1.id,
          title: local1.title,
          name: local1.name,
          type: local1.type,
          rules: local1.rules,
        });
      });
    });
  });
});
