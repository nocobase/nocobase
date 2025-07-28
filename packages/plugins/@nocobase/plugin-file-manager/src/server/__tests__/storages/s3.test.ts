/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { MockServer } from '@nocobase/test';
import S3Storage from '../../storages/s3';
import { FILE_FIELD_NAME } from '../../../constants';
import { getApp, requestFile } from '..';
import Database from '@nocobase/database';

const itif = process.env.AWS_SECRET_ACCESS_KEY ? it : it.skip;

describe('storage:s3', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let AttachmentRepo;
  let StorageRepo;
  let storage;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;

    AttachmentRepo = db.getCollection('attachments').repository;
    StorageRepo = db.getCollection('storages').repository;

    storage = await StorageRepo.create({
      values: {
        ...S3Storage.defaults(),
        name: 's3',
        default: true,
        path: 'test/path',
      },
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

      const attachment = await AttachmentRepo.findOne({
        filterByTk: body.data.id,
        appends: ['storage'],
      });

      const matcher = {
        title: 'text',
        extname: '.txt',
        path: 'test/path',
        size: 13,
        mimetype: 'text/plain',
        meta: {},
      };

      // 文件上传和解析是否正常
      expect(body.data).toMatchObject(matcher);
      assert.equal(body.data.storageId, storage.id);
      // 文件的 url 是否正常生成
      expect(body.data.url).toBe(`${attachment.storage.baseUrl}/${body.data.path}/${body.data.filename}`);
      // 文件的数据是否正常保存
      expect(attachment).toMatchObject(matcher);

      // 通过 url 是否能正确访问
      const content = await requestFile(attachment.url, agent);
      expect(content.text).toBe('Hello world!\n');
    });
  });

  describe('destroy', () => {
    itif('destroy record should also delete file', async () => {
      const { body } = await agent.resource('attachments').create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, '../files/text.txt'),
      });
      // 通过 url 是否能正确访问
      const content1 = await requestFile(body.data.url, agent);
      expect(content1.text).toBe('Hello world!\n');

      const res = await agent.resource('attachments').destroy({
        filterByTk: body.data.id,
      });

      expect(res.statusCode).toBe(200);
      const count = await AttachmentRepo.count();
      expect(count).toBe(0);

      const content2 = await requestFile(body.data.url, agent);
      console.log(content2.status, body.data.url);
      expect(content2.status).toBe(403);
    });

    itif('destroy record should not delete file when paranoid', async () => {
      const paranoidStorage = await StorageRepo.create({
        values: {
          ...S3Storage.defaults(),
          name: 's3-2',
          path: 'test/nocobase',
          paranoid: true,
          default: true,
        },
      });

      const { body } = await agent.resource('attachments').create({
        [FILE_FIELD_NAME]: path.resolve(__dirname, '../files/text.txt'),
      });
      // 通过 url 是否能正确访问
      const content1 = await requestFile(body.data.url, agent);
      expect(content1.text).toBe('Hello world!\n');

      const res = await agent.resource('attachments').destroy({
        filterByTk: body.data.id,
      });

      expect(res.statusCode).toBe(200);
      const count = await AttachmentRepo.count();
      expect(count).toBe(0);

      const content2 = await requestFile(body.data.url, agent);
      expect(content2.status).toBe(200);
    });
  });
});
