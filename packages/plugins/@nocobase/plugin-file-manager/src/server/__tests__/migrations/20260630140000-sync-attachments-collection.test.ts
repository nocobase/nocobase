/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20260630223000-update-attachments-field-metadata';
import PluginFileManagerServer from '../../server';

describe('file-manager > sync attachments collection migration', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        'error-handler',
        'field-sort',
        'users',
        'auth',
        'file-manager',
        'data-source-main',
        'ui-schema-storage',
      ],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('should add missing attachments collection manager metadata', async () => {
    await app.db.getModel('fields').destroy({
      where: {
        collectionName: 'attachments',
      },
      hooks: false,
    });
    await app.db.getModel('collections').destroy({
      where: {
        name: 'attachments',
      },
      hooks: false,
    });

    const runtimeCollection = app.db.getCollection('attachments');
    for (const fieldName of ['title', 'filename', 'extname', 'size', 'mimetype', 'path', 'meta', 'url']) {
      runtimeCollection.removeField(fieldName);
    }

    expect(
      await app.db.getRepository('collections').findOne({
        filter: {
          name: 'attachments',
        },
      }),
    ).toBeNull();

    const migration = new Migration({
      db: app.db,
      app,
      plugin: app.pm.get(PluginFileManagerServer),
    });

    await migration.up();
    await migration.up();

    const collection = await app.db.getRepository('collections').findOne({
      filter: {
        name: 'attachments',
      },
    });
    expect(collection).toBeTruthy();
    expect(collection.get('key')).toBeTruthy();
    expect(collection.get('title')).toBe("{{t('Attachments', { ns: 'file-manager' })}}");
    expect(collection.get('uiManageable')).toBe(true);
    expect(collection.get('asStrategyResource')).toBe(true);
    expect(collection.get('sort')).toBe(1);

    const fields = await app.db.getRepository('fields').find({
      filter: {
        collectionName: 'attachments',
      },
      sort: 'name',
    });
    const fieldNames = fields.map((field) => field.get('name'));
    expect(fieldNames).toEqual([...new Set(fieldNames)]);
    expect(fieldNames).toEqual(
      expect.arrayContaining([
        'id',
        'title',
        'filename',
        'extname',
        'size',
        'mimetype',
        'storage',
        'path',
        'preview',
        'meta',
        'url',
      ]),
    );
    expect(fields.find((field) => field.get('name') === 'id').get('interface')).toBe('snowflakeId');
    expect(fields.find((field) => field.get('name') === 'id').get('type')).toBe('snowflakeId');
    expect(fields.find((field) => field.get('name') === 'title').get('interface')).toBe('input');
    expect(fields.find((field) => field.get('name') === 'size').get('interface')).toBe('integer');
    expect(fields.find((field) => field.get('name') === 'meta').get('interface')).toBe('json');
    expect(fields.find((field) => field.get('name') === 'url').get('interface')).toBe('url');
    for (const field of fields) {
      expect(field.get('sort')).toBeTruthy();
    }
    expect(fields.find((field) => field.get('name') === 'id').get('sort')).toBe(1);
    expect(fields.find((field) => field.get('name') === 'title').get('sort')).toBe(2);
    for (const fieldName of ['id', 'createdBy', 'createdById', 'updatedBy', 'updatedById']) {
      expect(fields.find((field) => field.get('name') === fieldName).get('deletable')).toBe(false);
    }
    expect(app.db.getCollection('attachments').getField('id').options.interface).toBe('snowflakeId');
    expect(app.db.getCollection('attachments').getField('title').options.interface).toBe('input');
    expect(app.db.getCollection('attachments').getField('meta').options.interface).toBe('json');
    expect(app.db.getCollection('attachments').getField('preview').options.interface).toBe('url');
  });

  it('should update incomplete existing attachments field metadata', async () => {
    await app.db.getRepository('fields').update({
      filter: {
        collectionName: 'attachments',
        name: 'title',
      },
      values: {
        interface: null,
        sort: null,
        uiSchema: {
          title: 'Old title',
        },
      },
      hooks: false,
    });
    await app.db.getModel('fields').destroy({
      where: {
        collectionName: 'attachments',
        name: 'id',
      },
      hooks: false,
    });
    await app.db.getRepository('fields').update({
      filter: {
        collectionName: 'attachments',
        name: 'size',
      },
      values: {
        interface: null,
        sort: null,
      },
      hooks: false,
    });
    await app.db.getRepository('fields').update({
      filter: {
        collectionName: 'attachments',
        name: 'meta',
      },
      values: {
        interface: null,
        sort: null,
      },
      hooks: false,
    });

    const migration = new Migration({
      db: app.db,
      app,
      plugin: app.pm.get(PluginFileManagerServer),
    });

    await migration.up();

    const titleField = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'attachments',
        name: 'title',
      },
    });
    const sizeField = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'attachments',
        name: 'size',
      },
    });
    const metaField = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'attachments',
        name: 'meta',
      },
    });

    expect(titleField.get('interface')).toBe('input');
    expect(titleField.get('uiSchema.x-component')).toBe('Input');
    expect(titleField.get('sort')).toBe(2);
    expect(sizeField.get('interface')).toBe('integer');
    expect(sizeField.get('uiSchema.x-component')).toBe('InputNumber');
    expect(sizeField.get('sort')).toBe(5);
    expect(metaField.get('interface')).toBe('json');
    expect(metaField.get('uiSchema.x-component')).toBe('Input.JSON');
    expect(metaField.get('sort')).toBe(10);
    expect(app.db.getCollection('attachments').getField('id').options.interface).toBe('snowflakeId');
    expect(app.db.getCollection('attachments').getField('title').options.interface).toBe('input');
    expect(app.db.getCollection('attachments').getField('meta').options.interface).toBe('json');
    expect(app.db.getCollection('attachments').getField('size').options.interface).toBe('integer');
  });
});
