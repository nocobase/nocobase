import path from 'path';
import { MockServer } from '@nocobase/test';
import txStorage from '../../storages/tx-cos';
import { FILE_FIELD_NAME } from '../../constants';
import { getApp, requestFile } from '..';
import { Database } from '@nocobase/database';

const itif = process.env.TX_COS_ACCESS_KEY_SECRET ? it : it.skip;

describe('storage:tx-cos', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let storage;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;

    const Storage = db.getCollection('storages').model;
    storage = await Storage.create({
      ...txStorage.defaults(),
      name: 'tx-cos',
      default: true,
      path: 'test/path',
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('direct attachment', () => {
    itif('upload file should be ok', async () => {
      const { body } = await agent.resource('attachments').create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, '../files/text.txt'),
      });

      const Attachment = db.getCollection('attachments').model;
      const attachment = await Attachment.findOne<any>({
        where: { id: body.data.id },
        include: ['storage'],
      });

      const matcher = {
        title: 'text',
        extname: '.txt',
        path: 'test/path',
        size: 13,
        mimetype: 'text/plain',
        meta: {},
        storageId: storage.id,
      };

      // 文件上传和解析是否正常
      expect(body.data).toMatchObject(matcher);
      // 文件的 url 是否正常生成
      expect(body.data.url).toBe(`${attachment.storage.baseUrl}/${body.data.path}/${body.data.filename}`);
      // 文件的数据是否正常保存
      expect(attachment).toMatchObject(matcher);

      // 通过 url 是否能正确访问
      const content = await requestFile(attachment.url, agent);

      expect(content.text).toBe('Hello world!\n');
    });
  });
});
