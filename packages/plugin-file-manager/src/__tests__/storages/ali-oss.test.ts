import path from 'path';

import { generatePrefixByPath } from '@nocobase/test';

import aliossStorage from '../../storages/ali-oss';
import { FILE_FIELD_NAME, STORAGE_TYPE_ALI_OSS } from '../../constants';
import { getApp, requestFile } from '..';

const itif = process.env.DEFAULT_STORAGE_TYPE === STORAGE_TYPE_ALI_OSS ? it : it.skip;

describe('storage:ali-oss', () => {
  let app;
  let agent;
  let db;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;

    const Storage = db.getModel('storages');
    await Storage.create({
      ...aliossStorage.defaults(),
      name: `ali-oss_${generatePrefixByPath()}`,
      default: true,
      path: 'test/path'
    });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('direct attachment', () => {
    itif('upload file should be ok', async () => {
      const { body } = await agent
        .resource('attachments')
        .upload({
          [FILE_FIELD_NAME]: path.resolve(__dirname, '../files/text.txt')
        });

      const Attachment = db.getModel('attachments');
      const attachment = await Attachment.findOne({
        where: { id: body.data.id },
        include: ['storage']
      });

      const matcher = {
        title: 'text',
        extname: '.txt',
        path: 'test/path',
        // TODO(bug): alioss will not return the size of file
        // size: 13,
        mimetype: 'text/plain',
        meta: {},
        storage_id: 1,
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
