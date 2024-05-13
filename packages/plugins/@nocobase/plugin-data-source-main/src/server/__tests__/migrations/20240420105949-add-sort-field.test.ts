/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20240420105949-add-sort-field';
import PluginCollectionManagerServer from '../../server';

describe('nocobase-admin-menu', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    await app.version.update('0.21.0-alpha.12');
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('migration', async () => {
    await app.db.getRepository('collections').create({
      values: {
        autoGenId: true,
        sortable: true,
        name: 'bar',
        template: 'general',
        view: false,
      },
      context: {},
    });
    await app.db.getRepository('collections').create({
      values: {
        autoGenId: true,
        sortable: true,
        name: 'foo',
        template: 'general',
        view: false,
        fields: [
          {
            type: 'string',
            name: 'status',
          },
          {
            type: 'sort',
            name: 'sort1',
            scopeKey: 'status',
          },
          {
            type: 'sort',
            name: 'sort3',
            interface: 'sort',
            uiSchema: {
              type: 'number',
              title: 'Sort 3',
              'x-component': 'InputNumber',
              'x-component-props': { stringMode: true, step: '1' },
              'x-validator': 'integer',
            },
          },
          {
            type: 'hasMany',
            name: 'bar',
            target: 'bar',
            foreignKey: 'fooId',
            sortable: true,
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
    const sort1 = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'foo',
        name: 'sort',
      },
    });
    expect(sort1.interface).toBe('sort');
    expect(sort1.hidden).toBeFalsy();
    const sort2 = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'foo',
        name: 'sort1',
      },
    });
    expect(sort2.interface).toBe('sort');
    expect(sort2.hidden).toBeFalsy();
    const sort3 = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'foo',
        name: 'sort3',
      },
    });
    expect(sort3.interface).toBe('sort');
    expect(sort3.get('uiSchema.title')).toBe('Sort 3');
    const sort4 = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'bar',
        name: 'fooIdSort',
      },
    });
    expect(sort4.interface).toBe('sort');
    expect(sort4.get('uiSchema.title')).toBe('fooIdSort');
  });
});
