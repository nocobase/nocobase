/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { createApp } from '../index';

describe('tree', () => {
  let app: MockServer;
  let agent;

  let db: Database;
  beforeEach(async () => {
    app = await createApp();

    agent = app.agent();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should list tree', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'categories',
        tree: 'adjacency-list',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'belongsTo',
            name: 'parent',
            foreignKey: 'parent_id',
            treeParent: true,
            target: 'categories',
          },
          {
            type: 'hasMany',
            name: 'children',
            foreignKey: 'parent_id',
            treeChildren: true,
            target: 'categories',
          },
        ],
      },
      context: {},
    });

    const c1 = await db.getRepository('categories').create({
      values: { name: 'c1' },
    });

    await db.getRepository('categories').create({
      values: [
        {
          name: 'c2',
          parent: {
            name: 'c1',
            id: c1.get('id'),
          },
        },
      ],
    });

    const listResponse = await agent.resource('categories').list({
      appends: ['parent'],
    });

    expect(listResponse.statusCode).toBe(200);

    // update c1
    await db.getRepository('categories').update({
      filter: {
        name: 'c1',
      },
      values: {
        __index: '1231', // should ignore
        name: 'c11',
      },
    });

    await c1.reload();

    expect(c1.get('name')).toBe('c11');
  });
});
