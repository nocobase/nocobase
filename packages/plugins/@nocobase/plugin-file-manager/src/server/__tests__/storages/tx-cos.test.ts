/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { Readable } from 'stream';
import { MockServer } from '@nocobase/test';
import TXCOSStorage from '../../storages/tx-cos';
import { FILE_FIELD_NAME } from '../../../constants';
import { getApp, requestFile } from '..';
import { Database } from '@nocobase/database';
import { describe, expect, it, vi } from 'vitest';

const itif = process.env.TX_COS_SECRET_ID && process.env.TX_COS_SECRET_KEY ? it : it.skip;

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
      ...TXCOSStorage.defaults(),
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

describe('storage:tx-cos engine', () => {
  it('should upload with stream and return size', async () => {
    const storage = new TXCOSStorage({
      ...TXCOSStorage.defaults(),
      baseUrl: 'https://example.com',
      path: 'test/path',
      renameMode: 'none',
      options: {
        Region: 'ap-shanghai',
        SecretId: 'secret-id',
        SecretKey: 'secret-key',
        Bucket: 'bucket-123456',
      },
    } as any);

    const engine = storage.make() as any;
    const putObject = vi.fn((params, cb) => {
      const chunks = [];
      params.Body.on('data', (chunk) => {
        chunks.push(chunk);
      });
      params.Body.on('end', () => {
        cb(null, { Location: 'bucket-123456.cos.ap-shanghai.myqcloud.com/test/path/text.txt' });
      });
    });
    engine.cos.putObject = putObject;

    const result = await new Promise<any>((resolve, reject) => {
      engine._handleFile(
        {},
        {
          originalname: 'text.txt',
          mimetype: 'text/plain',
          stream: Readable.from(['Hello world!\n']),
        },
        (err, value) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(value);
        },
      );
    });

    expect(putObject).toHaveBeenCalledTimes(1);
    expect(putObject.mock.calls[0][0]).toMatchObject({
      Bucket: 'bucket-123456',
      Region: 'ap-shanghai',
      Key: 'test/path/text.txt',
      ContentType: 'text/plain; charset=utf-8',
    });
    expect(result).toMatchObject({
      key: 'test/path/text.txt',
      size: 13,
      url: 'https://example.com/test/path/text.txt',
    });
  });
});
