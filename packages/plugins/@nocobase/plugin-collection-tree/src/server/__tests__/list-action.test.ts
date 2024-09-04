/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerActions } from '@nocobase/actions';
import { createApp } from './prepare';

describe('list-tree', () => {
  let app;
  beforeEach(async () => {
    app = await createApp();
    registerActions(app);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should be tree', async () => {
    const values = [
      {
        name: '1',
        __index: '0',
        children: [
          {
            name: '1-1',
            __index: '0.children.0',
            children: [
              {
                name: '1-1-1',
                __index: '0.children.0.children.0',
                children: [
                  {
                    name: '1-1-1-1',
                    __index: '0.children.0.children.0.children.0',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: '2',
        __index: '1',
        children: [
          {
            name: '2-1',
            __index: '1.children.0',
            children: [
              {
                name: '2-1-1',
                __index: '1.children.0.children.0',
                children: [
                  {
                    name: '2-1-1-1',
                    __index: '1.children.0.children.0.children.0',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const db = app.db;
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'description',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    await db.getRepository('categories').create({
      values,
    });

    const response = await app
      .agent()
      .resource('categories')
      .list({
        tree: true,
        fields: ['id', 'name'],
        sort: ['id'],
      });

    expect(response.status).toEqual(200);
    expect(response.body.data).toMatchObject(values);
  });

  it('should be tree', async () => {
    const values = [
      {
        name: '1',
        __index: '0',
        children2: [
          {
            name: '1-1',
            __index: '0.children2.0',
            children2: [
              {
                name: '1-1-1',
                __index: '0.children2.0.children2.0',
                children2: [
                  {
                    name: '1-1-1-1',
                    __index: '0.children2.0.children2.0.children2.0',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: '2',
        __index: '1',
        children2: [
          {
            name: '2-1',
            __index: '1.children2.0',
            children2: [
              {
                name: '2-1-1',
                __index: '1.children2.0.children2.0',
                children2: [
                  {
                    name: '2-1-1-1',
                    __index: '1.children2.0.children2.0.children2.0',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const db = app.db;
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'bigInt',
          name: 'parentId',
        },
        {
          type: 'string',
          name: 'description',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'cid',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children2',
          foreignKey: 'cid',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    await db.getRepository('categories').create({
      values,
    });

    const response = await app
      .agent()
      .resource('categories')
      .list({
        tree: true,
        fields: ['id', 'name'],
        sort: ['id'],
      });

    expect(response.status).toEqual(200);
    expect(response.body.data).toMatchObject(values);
  });

  it('should filter child nodes for tree', async () => {
    const values = [
      {
        name: 'A1',
        __index: '0',
        children3: [
          {
            name: 'B',
            __index: '0.children3.0',
            children3: [
              {
                name: 'C',
                __index: '0.children3.0.children3.0',
              },
            ],
          },
        ],
      },
      {
        name: 'A2',
        __index: '1',
        children3: [
          {
            name: 'B',
            __index: '1.children3.0',
          },
        ],
      },
    ];

    const db = app.db;
    db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'description',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'cid',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children3',
          foreignKey: 'cid',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    await db.getRepository('categories').create({
      values,
    });

    const response = await app
      .agent()
      .resource('categories')
      .list({
        tree: true,
        fields: ['id', 'name'],
        appends: ['parent'],
        filter: {
          name: 'B',
        },
      });

    expect(response.status).toEqual(200);
    const rows = response.body.data;
    expect(rows.length).toEqual(2);
    expect(rows[0].name).toEqual('A1');
    expect(rows[1].name).toEqual('A2');
    expect(rows[0].children3[0].name).toEqual('B');
    expect(rows[1].children3[0].name).toEqual('B');
    expect(rows[0].children3[0].parent.name).toEqual('A1');
    expect(rows[1].children3[0].parent.name).toEqual('A2');
  });
});
