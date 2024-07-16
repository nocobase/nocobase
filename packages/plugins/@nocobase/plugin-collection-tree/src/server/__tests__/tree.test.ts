/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AdjacencyListRepository, Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp, prepareApp } from './prepare';

describe('tree', () => {
  let app: MockServer;
  let agent;

  let db: Database;
  beforeEach(async () => {
    app = await prepareApp();

    agent = app.agent();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('tree list action allowActions', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'newRole',
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['newRole'],
      },
    });

    const userPlugin = app.getPlugin('users');
    const agent = app.agent().login(user).set('X-With-ACL-Meta', true);
    app.acl.allow('table_a', ['*']);
    app.acl.allow('collections', ['*']);

    await agent.resource('collections').create({
      values: {
        autoGenId: true,
        createdBy: false,
        updatedBy: false,
        createdAt: false,
        updatedAt: false,
        sortable: false,
        name: 'table_a',
        template: 'tree',
        tree: 'adjacency-list',
        fields: [
          {
            interface: 'integer',
            name: 'parentId',
            type: 'bigInt',
            isForeignKey: true,
            uiSchema: {
              type: 'number',
              title: '{{t("Parent ID")}}',
              'x-component': 'InputNumber',
              'x-read-pretty': true,
            },
            target: 'table_a',
          },
          {
            interface: 'm2o',
            type: 'belongsTo',
            name: 'parent',
            treeParent: true,
            foreignKey: 'parentId',
            uiSchema: {
              title: '{{t("Parent")}}',
              'x-component': 'AssociationField',
              'x-component-props': { multiple: false, fieldNames: { label: 'id', value: 'id' } },
            },
            target: 'table_a',
          },
          {
            interface: 'o2m',
            type: 'hasMany',
            name: 'children',
            foreignKey: 'parentId',
            uiSchema: {
              title: '{{t("Children")}}',
              'x-component': 'RecordPicker',
              'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
            },
            treeChildren: true,
            target: 'table_a',
          },
          {
            name: 'id',
            type: 'bigInt',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
            interface: 'id',
          },
        ],
        title: 'table_a',
      },
    });

    await agent.resource('table_a').create({
      values: {},
    });

    await agent.resource('table_a').create({
      values: {
        parent: {
          id: 1,
        },
      },
    });

    await agent.resource('table_a').create({
      values: {},
    });

    await agent.resource('table_a').create({
      values: {
        parent: {
          id: 3,
        },
      },
    });

    const res = await agent.resource('table_a').list({
      filter: JSON.stringify({
        parentId: null,
      }),
      tree: true,
    });

    expect(res.body.meta.allowedActions.view.sort()).toMatchObject([1, 2, 3, 4]);
  });
});

describe('find with association', () => {
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

  it('should filter by association field', async () => {
    const User = db.collection({
      name: 'users',
      tree: 'adjacency-list',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts', target: 'posts', foreignKey: 'user_id' },
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'parent_id',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          foreignKey: 'parent_id',
          treeChildren: true,
        },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user', target: 'users', foreignKey: 'user_id' },
      ],
    });

    await db.sync();

    expect(User.options.tree).toBeTruthy();

    await User.repository.create({
      values: [
        {
          name: 'u1',
          posts: [
            {
              title: 'u1p1',
            },
          ],
          children: [
            {
              name: 'u2',
              posts: [
                {
                  title: '标题2',
                },
              ],
            },
          ],
        },
      ],
    });

    const filter = {
      $and: [
        {
          children: {
            posts: {
              title: {
                $eq: '标题2',
              },
            },
          },
        },
      ],
    };

    const [findResult, count] = await User.repository.findAndCount({
      filter,
      offset: 0,
      limit: 20,
    });

    expect(findResult[0].get('name')).toEqual('u1');
  });

  it('should filter by association field', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'users',
        tree: 'adjacency-list',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'posts', target: 'posts', foreignKey: 'user_id' },
          {
            type: 'belongsTo',
            name: 'parent',
            foreignKey: 'parent_id',
            treeParent: true,
            target: 'users',
          },
          {
            type: 'hasMany',
            name: 'children',
            foreignKey: 'parent_id',
            treeChildren: true,
            target: 'users',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'belongsTo', name: 'user', target: 'users', foreignKey: 'user_id' },
        ],
      },
      context: {},
    });

    const UserCollection = db.getCollection('users');

    expect(UserCollection.options.tree).toBeTruthy();

    await db.getRepository('users').create({
      values: [
        {
          name: 'u1',
          posts: [
            {
              title: 'u1p1',
            },
          ],
          children: [
            {
              name: 'u2',
              posts: [
                {
                  title: '标题2',
                },
              ],
            },
          ],
        },
        {
          name: 'u3',
          children: [
            {
              name: 'u4',
              posts: [
                {
                  title: '标题五',
                },
              ],
            },
          ],
        },
      ],
    });

    const filter = {
      $and: [
        {
          children: {
            posts: {
              title: {
                $eq: '标题五',
              },
            },
          },
        },
      ],
    };

    const items = await db.getRepository('users').find({
      filter,
      appends: ['children'],
    });

    expect(items[0].name).toEqual('u3');

    const response2 = await agent.resource('users').list({
      filter,
      appends: ['children'],
    });

    expect(response2.statusCode).toEqual(200);
    expect(response2.body.data[0].name).toEqual('u3');
  });
});

describe('list-tree', () => {
  let app;
  beforeEach(async () => {
    app = await prepareApp();
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
    expect(response.body.rows).toMatchObject(values);
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
    expect(response.body.rows).toMatchObject(values);
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
    const rows = response.body.rows;
    expect(rows.length).toEqual(2);
    expect(rows[0].name).toEqual('B');
    expect(rows[1].name).toEqual('B');
    expect(rows[0].parent.name).toEqual('A1');
    expect(rows[1].parent.name).toEqual('A2');
  });
});

describe('tree test', () => {
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

  it('should works with appends option', async () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        { type: 'string', name: 'name' },
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

    await collection.repository.create({
      values: [
        {
          name: 'c1',
          children: [
            {
              name: 'c11',
            },
            {
              name: 'c12',
            },
          ],
        },
        {
          name: 'c2',
        },
      ],
    });

    const tree = await collection.repository.find({
      tree: true,
      filter: {
        parentId: null,
      },
      fields: ['name'],
    });

    expect(tree.length).toBe(2);
  });

  it('should not return children property when child nodes are empty', async () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        { type: 'string', name: 'name' },
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

    await collection.repository.create({
      values: [
        {
          name: 'c1',
          children: [
            {
              name: 'c11',
            },
            {
              name: 'c12',
            },
          ],
        },
        {
          name: 'c2',
        },
      ],
    });

    const tree = await collection.repository.find({
      filter: {
        parentId: null,
      },
      tree: true,
    });

    const c2 = tree.find((item) => item.name === 'c2');
    expect(c2.toJSON()['children']).toBeUndefined();

    const c11 = tree
      .find((item) => item.name === 'c1')
      .get('children')
      .find((item) => item.name === 'c11');

    expect(c11.toJSON()['children']).toBeUndefined();
  });

  it('should add sort field', async () => {
    const Tasks = db.collection({
      name: 'tasks',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
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
        {
          type: 'string',
          name: 'status',
        },
      ],
    });

    await db.sync();

    await Tasks.repository.create({
      values: {
        name: 'task1',
        status: 'doing',
      },
    });

    await Tasks.repository.create({
      values: {
        name: 'task2',
        status: 'pending',
      },
    });

    await Tasks.repository.create({
      values: {
        name: 'task3',
        status: 'pending',
      },
    });

    Tasks.setField('sort', { type: 'sort', scopeKey: 'status' });

    await db.sync();
  });

  it('should be auto completed', () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
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
    expect(collection.treeChildrenField?.name).toBe('children');
    expect(collection.treeParentField?.name).toBe('parent');
    expect(collection.getField('parent').options.target).toBe('categories');
    expect(collection.getField('parent').options.foreignKey).toBe('parentId');
    expect(collection.getField('children').options.target).toBe('categories');
    expect(collection.getField('children').options.foreignKey).toBe('parentId');
  });

  it('should be auto completed', () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'cid',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          foreignKey: 'cid',
          treeChildren: true,
        },
      ],
    });
    expect(collection.treeChildrenField?.name).toBe('children');
    expect(collection.treeParentField?.name).toBe('parent');
    expect(collection.getField('parent').options.target).toBe('categories');
    expect(collection.getField('parent').options.foreignKey).toBe('cid');
    expect(collection.getField('children').options.target).toBe('categories');
    expect(collection.getField('children').options.foreignKey).toBe('cid');
  });

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

  it('should be tree', async () => {
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

    const instances = await db.getRepository('categories').find({
      filter: {
        parentId: null,
      },
      tree: true,
      fields: ['id', 'name'],
      sort: 'id',
    });

    expect(instances.map((i) => i.toJSON())).toMatchObject(values);

    const instance = await db.getRepository('categories').findOne({
      filterByTk: 1,
      tree: true,
      fields: ['id', 'name'],
    });

    expect(instance.toJSON()).toMatchObject(values[0]);
  });

  it('should find tree collection', async () => {
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
          foreignKey: 'cid',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          foreignKey: 'cid',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    await db.getRepository('categories').create({
      values,
    });

    const instances = await db.getRepository('categories').find({
      filter: {
        cid: null,
      },
      tree: true,
      fields: ['id', 'name'],
      sort: 'id',
    });

    expect(instances.map((i) => i.toJSON())).toMatchObject(values);

    const instance = await db.getRepository('categories').findOne({
      filterByTk: 1,
      tree: true,
      fields: ['id', 'name'],
    });

    expect(instance.toJSON()).toMatchObject(values[0]);
  });

  it('should get adjacency list repository', async () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'parentId',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          foreignKey: 'parentId',
          treeChildren: true,
        },
      ],
    });

    const repository = db.getRepository('categories');
    expect(repository).toBeInstanceOf(AdjacencyListRepository);
  });

  test('performance', async () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'parentId',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          foreignKey: 'parentId',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    const values = [];
    for (let i = 0; i < 10; i++) {
      const children = [];
      for (let j = 0; j < 10; j++) {
        const grandchildren = [];
        for (let k = 0; k < 10; k++) {
          grandchildren.push({
            name: `name-${i}-${j}-${k}`,
          });
        }
        children.push({
          name: `name-${i}-${j}`,
          children: grandchildren,
        });
      }

      values.push({
        name: `name-${i}`,
        description: `description-${i}`,
        children,
      });
    }

    await db.getRepository('categories').create({
      values,
    });

    const before = Date.now();

    const instances = await db.getRepository('categories').find({
      filter: {
        parentId: null,
      },
      tree: true,
      fields: ['id', 'name'],
      sort: 'id',
      limit: 10,
    });

    const after = Date.now();
    console.log(after - before);
  });
});
