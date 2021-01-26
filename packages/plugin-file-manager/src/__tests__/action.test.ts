import { promises as fs } from 'fs';
import path from 'path';
import qs from 'qs';
import { FILE_FIELD_NAME, STORAGE_TYPE_LOCAL } from '../constants';
import { getApp, getAgent, getAPI } from '.';

const DEFAULT_LOCAL_BASE_URL = process.env.LOCAL_STORAGE_BASE_URL || `http://localhost:${process.env.HTTP_PORT}/uploads`;

describe('action', () => {
  let app;
  let agent;
  let api;
  let db;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
    api = getAPI(app);
    db = app.database;

    const Storage = app.database.getModel('storages');
    await Storage.create({
      name: `local_${Date.now().toString(36)}`,
      type: STORAGE_TYPE_LOCAL,
      baseUrl: DEFAULT_LOCAL_BASE_URL,
      default: true
    });
  });

  afterEach(() => db.close());

  describe('direct attachment', () => {
    it('upload file should be ok', async () => {
      const response = await agent
        .post('/api/attachments:upload')
        .attach(FILE_FIELD_NAME, path.resolve(__dirname, './files/text.txt'));

      const matcher = {
        title: 'text',
        extname: '.txt',
        path: '',
        size: 13,
        mimetype: 'text/plain',
        meta: {},
        storage_id: 1,
      };
      // 文件上传和解析是否正常
      expect(response.body).toMatchObject(matcher);
      // 文件的 url 是否正常生成
      expect(response.body.url).toBe(`${DEFAULT_LOCAL_BASE_URL}${response.body.path}/${response.body.filename}`);

      const Attachment = db.getModel('attachments');
      const attachment = await Attachment.findOne({
        where: { id: response.body.id },
        include: ['storage']
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
      const destPath = path.resolve(path.isAbsolute(documentRoot) ? documentRoot : path.join(process.env.PWD, documentRoot), storage.path);
      const file = await fs.readFile(`${destPath}/${attachment.filename}`);
      // 文件是否保存到指定路径
      expect(file.toString()).toBe('Hello world!\n');

      const content = await agent.get(`/uploads${attachment.path}/${attachment.filename}`);
      // 通过 url 是否能正确访问
      // TODO(bug)
      // expect(content.text).toBe('Hello world!\n');
    });
  });

  describe('belongsTo attachment', () => {
    it('upload with associatedKey, fail as 400 because file mimetype does not match', async () => {
      const User = db.getModel('users');
      const user = await User.create();
      const response = await api.resource('users.avatar').upload({
        associatedKey: user.id,
        filePath: './files/text.txt'
      });
      expect(response.status).toBe(400);
    });

    it('upload with associatedKey', async () => {
      const User = db.getModel('users');
      const user = await User.create();
      const response = await api.resource('users.avatar').upload({
        associatedKey: user.id,
        filePath: './files/image.png',
        values: { width: 100, height: 100 }
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
        storage_id: 1,
      };
      // 上传正常返回
      expect(response.body).toMatchObject(matcher);

      // 由于初始没有外键，无法获取
      // await user.getAvatar()
      const updatedUser = await User.findByPk(user.id, {
        include: ['avatar']
      });
      // 外键更新正常
      expect(updatedUser.get('avatar').id).toBe(response.body.id);
    });

    // TODO(bug): 没有 associatedKey 时路径解析资源名称不对，无法进入 action
    it.skip('upload without associatedKey', async () => {
      const response = await api.resource('users.avatar').upload({
        filePath: './files/image.png',
        values: { width: 100, height: 100 }
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
        storage_id: 1,
      };
      // 上传返回正常
      expect(response.body).toMatchObject(matcher);
    });
  });
});
