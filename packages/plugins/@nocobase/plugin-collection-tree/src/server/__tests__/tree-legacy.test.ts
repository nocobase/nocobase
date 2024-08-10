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
import { createApp } from './prepare';

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
      // filter: {
      //   parentId: null,
      // },
      tree: true,
    });

    const c2 = tree.find((item) => item.name === 'c2');
    expect(c2.toJSON()['children']).toBeUndefined();

    const c11 = tree
      .find((item) => item.name === 'c1')
      .get('children')
      .find((item) => item.name === 'c11');

    expect(c11.toJSON()['children']).toBeUndefined();

    const treeNew = await collection.repository.find({
      filter: {
        parentId: null,
      },
      tree: true,
    });
    const c1 = treeNew.find((item) => item.name === 'c1');
    expect(c1.toJSON()['children']).toBeUndefined();
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

    // new tree implantation not need to pass primary key to null
    const instances = await db.getRepository('categories').find({
      // filter: {
      //   parentId: null,
      // },
      tree: true,
      fields: ['id', 'name'],
      sort: 'id',
    });

    expect(instances.map((i) => i.toJSON())).toMatchObject(values);

    // new tree implantation if the filterByTk pass to the find then will return the data from root id
    const instance = await db.getRepository('categories').findOne({
      filterByTk: 4,
      tree: true,
      fields: ['id', 'name'],
    });

    expect(instance.toJSON()).toMatchObject(values[0]);

    const instanceNew = await db.getRepository('categories').findOne({
      filterByTk: 1,
      tree: true,
      fields: ['id', 'name'],
    });

    const valuesNew = { id: 1, name: '1', __index: '0' };
    expect(instanceNew.toJSON()).toMatchObject(valuesNew);
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

    // new tree implantation not need to pass primary key to null
    const instances = await db.getRepository('categories').find({
      // filter: {
      //   cid: null,
      // },
      tree: true,
      fields: ['id', 'name'],
      sort: 'id',
    });

    expect(instances.map((i) => i.toJSON())).toMatchObject(values);

    // new tree implantation if the filterByTk pass to the find then will return the data from root id
    const instance = await db.getRepository('categories').findOne({
      filterByTk: 4,
      tree: true,
      fields: ['id', 'name'],
    });

    expect(instance.toJSON()).toMatchObject(values[0]);

    const instanceNew = await db.getRepository('categories').findOne({
      filterByTk: 1,
      tree: true,
      fields: ['id', 'name'],
    });

    const valuesNew = { id: 1, name: '1', __index: '0' };
    expect(instanceNew.toJSON()).toMatchObject(valuesNew);
  });
});
