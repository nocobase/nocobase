import { promises as fs } from 'fs';
import path from 'path';
import { getApp } from '.';
import { FILE_FIELD_NAME, STORAGE_TYPE_LOCAL } from '../constants';


const { LOCAL_STORAGE_BASE_URL, APP_PORT = '13000' } = process.env;

const DEFAULT_LOCAL_BASE_URL = LOCAL_STORAGE_BASE_URL || `http://localhost:${APP_PORT}/uploads`;

describe('action', () => {
  let app;
  let agent;
  let db;

  beforeEach(async () => {
    app = await getApp({
      database: {},
    });
    agent = app.agent();
    db = app.db;

    const Storage = db.getCollection('storages').model;
    await Storage.create({
      name: `local1_${db.getTablePrefix()}`,
      type: STORAGE_TYPE_LOCAL,
      baseUrl: DEFAULT_LOCAL_BASE_URL,
      default: true,
    });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('direct attachment', () => {
    it('upload file should be ok', async () => {
      const { body } = await agent.resource('attachments').upload({
        [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
      });

      const matcher = {
        title: 'text',
        extname: '.txt',
        path: '',
        size: 13,
        mimetype: 'text/plain',
        meta: {},
      };

      // 文件上传和解析是否正常
      expect(body.data).toMatchObject(matcher);
      // 文件的 url 是否正常生成
      expect(body.data.url).toBe(`${DEFAULT_LOCAL_BASE_URL}${body.data.path}/${body.data.filename}`);

      const Attachment = db.getCollection('attachments').model;
      const attachment = await Attachment.findOne({
        where: { id: body.data.id },
        include: ['storage'],
      });
      const storage = attachment.get('storage');
      // 文件的数据是否正常保存
      expect(attachment).toMatchObject(matcher);
      // 关联的存储引擎是否正确
      expect(storage).toMatchObject({
        type: 'local',
        options: {},
        rules: {},
        path: '',
        baseUrl: DEFAULT_LOCAL_BASE_URL,
        default: true,
      });

      const { documentRoot = 'uploads' } = storage.options || {};
      const destPath = path.resolve(
        path.isAbsolute(documentRoot) ? documentRoot : path.join(process.env.PWD, documentRoot),
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

  describe('belongsTo attachment', () => {
    it('upload with associatedIndex, fail as 400 because file mimetype does not match', async () => {
      const User = db.getCollection('users').model;
      const user = await User.create();
      const response = await agent.resource('users.avatar').upload({
        associatedIndex: user.id,
        file: path.resolve(__dirname, './files/text.txt'),
      });
      expect(response.status).toBe(400);
    });

    it('upload with associatedIndex', async () => {
      const User = db.getCollection('users').model;
      const user = await User.create();

      const { body } = await agent.resource('users.avatar').upload({
        associatedIndex: user.id,
        file: path.resolve(__dirname, './files/image.png'),
        values: { width: 100, height: 100 },
      });

      const matcher = {
        title: 'image',
        extname: '.png',
        path: '',
        size: 255,
        mimetype: 'image/png',
        // TODO(optimize): 可以考虑使用 qs 的 decoder 来进行类型解析
        // see: https://github.com/ljharb/qs/issues/91
        // 或考虑使用 query-string 库的 parseNumbers 等配置项
        meta: { width: '100', height: '100' },
      };
      // 上传正常返回
      expect(body.data).toMatchObject(matcher);

      // 由于初始没有外键，无法获取
      // await user.getAvatar()
      const updatedUser = await User.findByPk(user.id, {
        include: ['avatar'],
      });
      // 外键更新正常
      expect(updatedUser.get('avatar').id).toBe(body.data.id);
    });

    it('upload to assoiciated field and storage with full base url should be ok', async () => {
      const BASE_URL = `http://localhost:${APP_PORT}/another-uploads`;
      const storageName = 'local_private';
      const urlPath = 'test/path';
      const Storage = db.getCollection('storages').model;
      // 动态添加 storage
      await Storage.create({
        name: storageName,
        type: STORAGE_TYPE_LOCAL,
        path: urlPath,
        baseUrl: BASE_URL,
        options: {
          documentRoot: 'uploads/another',
        },
      });

      const User = db.getCollection('users').model;
      const user = await User.create();
      const { body } = await agent.resource('users.pubkeys').upload({
        associatedIndex: user.id,
        file: path.resolve(__dirname, './files/text.txt'),
        values: {},
      });

      // 文件的 url 是否正常生成
      expect(body.data.url).toBe(`${BASE_URL}/${urlPath}/${body.data.filename}`);
      console.log(body.data.url);
      const url = body.data.url.replace(`http://localhost:${APP_PORT}`, '');
      const content = await agent.get(url);
      expect(content.text).toBe('Hello world!\n');
    });

    // TODO(bug): 没有 associatedIndex 时路径解析资源名称不对，无法进入 action
    it.skip('upload without associatedIndex', async () => {
      const { body } = await agent.resource('users.avatar').upload({
        file: path.resolve(__dirname, './files/image.png'),
        values: { width: 100, height: 100 },
      });
      const matcher = {
        title: 'image',
        extname: '.png',
        path: '',
        size: 255,
        mimetype: 'image/png',
        // TODO(optimize): 可以考虑使用 qs 的 decoder 来进行类型解析
        // @see: https://github.com/ljharb/qs/issues/91
        // 或考虑使用 query-string 库的 parseNumbers 等配置项
        meta: { width: '100', height: '100' },
        storage_id: 1,
      };
      // 上传返回正常
      expect(body.data).toMatchObject(matcher);
    });
  });
});
