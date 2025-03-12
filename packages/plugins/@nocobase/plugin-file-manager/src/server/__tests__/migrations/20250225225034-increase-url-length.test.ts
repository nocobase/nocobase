/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20250225225034-increase-url-length';
import PluginCollectionManagerServer from '../../server';

describe('file-manager > migrations', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    await app.version.update('1.5.13');
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('migration', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'foo',
        template: 'file',
        createdBy: true,
        updatedBy: true,
        fields: [
          {
            interface: 'input',
            type: 'string',
            name: 'title',
            deletable: false,
            uiSchema: {
              type: 'string',
              title: `{{t("Title")}}`,
              'x-component': 'Input',
            },
          },
          // '系统文件名（含扩展名）',
          {
            interface: 'input',
            type: 'string',
            name: 'filename',
            deletable: false,
            uiSchema: {
              type: 'string',
              title: `{{t("File name")}}`,
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
          // '扩展名（含“.”）',
          {
            interface: 'input',
            type: 'string',
            name: 'extname',
            deletable: false,
            uiSchema: {
              type: 'string',
              title: `{{t("Extension name")}}`,
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
          // '文件体积（字节）',
          {
            interface: 'integer',
            type: 'integer',
            name: 'size',
            deletable: false,
            uiSchema: {
              type: 'number',
              title: `{{t("Size")}}`,
              'x-component': 'InputNumber',
              'x-read-pretty': true,
              'x-component-props': {
                stringMode: true,
                step: '0',
              },
            },
          },
          {
            interface: 'input',
            type: 'string',
            name: 'mimetype',
            deletable: false,
            uiSchema: {
              type: 'string',
              title: `{{t("MIME type")}}`,
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
          // '相对路径（含“/”前缀）',
          {
            interface: 'input',
            type: 'string',
            name: 'path',
            deletable: false,
            uiSchema: {
              type: 'string',
              title: `{{t("Path")}}`,
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
          // 文件的可访问地址
          {
            interface: 'url',
            type: 'string',
            name: 'url',
            deletable: false,
            uiSchema: {
              type: 'string',
              title: `{{t("URL")}}`,
              'x-component': 'Input.URL',
              'x-read-pretty': true,
            },
          },
          // 用于预览
          {
            interface: 'url',
            type: 'string',
            name: 'preview',
            field: 'url', // 直接引用 url 字段
            deletable: false,
            uiSchema: {
              type: 'string',
              title: `{{t("Preview")}}`,
              'x-component': 'Preview',
              'x-read-pretty': true,
            },
          },
          {
            comment: '存储引擎',
            type: 'belongsTo',
            name: 'storage',
            target: 'storages',
            foreignKey: 'storageId',
            deletable: false,
            uiSchema: {
              type: 'string',
              title: `{{t("Storage")}}`,
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
          // '其他文件信息（如图片的宽高）',
          {
            type: 'jsonb',
            name: 'meta',
            deletable: false,
            defaultValue: {},
          },
        ],
      },
      context: {},
    });

    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: app,
      plugin: app.pm.get(PluginCollectionManagerServer),
    });
    await migration.up();
    const fileURL = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'foo',
        name: 'url',
      },
    });
    expect(fileURL.type).toBe('text');
    const filePath = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'foo',
        name: 'path',
      },
    });
    expect(filePath.type).toBe('text');

    const storageCollection = app.db.getCollection('storages');
    const pathField = storageCollection.getField('path');
    expect(pathField.type).toBe('text');
  });
});
