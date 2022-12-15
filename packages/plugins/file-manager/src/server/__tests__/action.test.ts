import { promises as fs } from 'fs';
import path from 'path';
import { getApp } from '.';
import { FILE_FIELD_NAME, STORAGE_TYPE_LOCAL } from '../constants';

const { LOCAL_STORAGE_BASE_URL, LOCAL_STORAGE_DEST = 'storage/uploads', APP_PORT = '13000' } = process.env;

const DEFAULT_LOCAL_BASE_URL = LOCAL_STORAGE_BASE_URL || `http://localhost:${APP_PORT}/storage/uploads`;

describe('action', () => {
  let app;
  let agent;
  let db;
  let StorageModel;

  beforeEach(async () => {
    app = await getApp({
      database: {},
    });
    agent = app.agent();
    db = app.db;

    StorageModel = db.getCollection('storages').model;
    await StorageModel.create({
      name: 'local1',
      type: STORAGE_TYPE_LOCAL,
      baseUrl: DEFAULT_LOCAL_BASE_URL,
      rules: {
        size: 1024,
      },
    });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('default storage', () => {
    it('upload file should be ok', async () => {
      const { body } = await agent.resource('attachments').create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
      });

      const matcher = {
        title: 'text',
        extname: '.txt',
        path: '',
        size: 13,
        mimetype: 'text/plain',
        meta: {},
        storageId: 1
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
      expect(storage).toMatchObject({
        type: 'local',
        options: { documentRoot: LOCAL_STORAGE_DEST },
        rules: {},
        path: '',
        baseUrl: DEFAULT_LOCAL_BASE_URL,
        default: true,
      });

      const { documentRoot = 'storage/uploads' } = storage.options || {};
      const destPath = path.resolve(
        path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot),
        storage.path,
      );
      const file = await fs.readFile(`${destPath}/${attachment.filename}`);
      // 文件是否保存到指定路径
      expect(file.toString()).toBe('Hello world!\n');

      // 通过 url 是否能正确访问
      const url = attachment.url.replace(`http://localhost:${APP_PORT}`, '');
      const content = await agent.get(url);
      expect(content.text).toBe('Hello world!\n');
    });
  });

  describe('specific storage', () => {
    it('fail as 400 because file size greater than rules', async () => {
      const response = await agent.resource('storages.attachments', 'local1').create({
        file: path.resolve(__dirname, './files/image.jpg'),
      });
      expect(response.status).toBe(400);
    });

    it('fail as 400 because file mimetype does not match', async () => {
      const textStorage = await StorageModel.create({
        name: 'local2',
        type: STORAGE_TYPE_LOCAL,
        baseUrl: DEFAULT_LOCAL_BASE_URL,
        rules: {
          mimetype: ['text/*']
        },
      });

      const response = await agent.resource('storages.attachments', textStorage.name).create({
        file: path.resolve(__dirname, './files/image.jpg'),
      });

      expect(response.status).toBe(400);
    });

    it('upload to storage which is not default', async () => {
      const BASE_URL = `http://localhost:${APP_PORT}/another-uploads`;
      const urlPath = 'test/path';

      // 动态添加 storage
      const storage = await StorageModel.create({
        name: 'local_private',
        type: STORAGE_TYPE_LOCAL,
        rules: {
          mimetype: ['text/*'],
        },
        path: urlPath,
        baseUrl: BASE_URL,
        options: {
          documentRoot: 'uploads/another',
        },
      });

      const { body } = await agent.resource('storages.attachments', storage.name).create({
        file: path.resolve(__dirname, './files/text.txt')
      });

      // 文件的 url 是否正常生成
      expect(body.data.url).toBe(`${BASE_URL}/${urlPath}/${body.data.filename}`);
      console.log(body.data.url);
      const url = body.data.url.replace(`http://localhost:${APP_PORT}`, '');
      const content = await agent.get(url);
      expect(content.text).toBe('Hello world!\n');
    });
  });
});
