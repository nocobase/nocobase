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

describe('tree path test', () => {
  let app: MockServer;
  let agent;
  let treeCollection;
  let name;
  let nodePkColumnName;
  let values;
  let valuesNoA1Children;

  let db: Database;
  beforeEach(async () => {
    app = await createApp();

    agent = app.agent();
    db = app.db;
    treeCollection = db.collection({
      name: 'tree',
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
    name = `main_${treeCollection.name}_path`;
    nodePkColumnName = db.getCollection(name).getField('nodePk').columnName();
    values = [
      {
        name: 'a1',
        children: [
          {
            name: 'a2',
            children: [
              {
                name: 'a3',
                children: [
                  {
                    name: 'a4',
                    children: [
                      {
                        name: 'a5',
                        __index: '0.children.0.children.0.children.0.children.0',
                      },
                    ],
                    __index: '0.children.0.children.0.children.0',
                  },
                ],
                __index: '0.children.0.children.0',
              },
            ],
            __index: '0.children.0',
          },
          {
            name: 'a1-1',
            __index: '0.children.1',
          },
        ],
        __index: '0',
      },
    ];
    valuesNoA1Children = [
      {
        name: 'a1',
        children: [
          {
            name: 'a2',
            children: [
              {
                name: 'a3',
                children: [
                  {
                    name: 'a4',
                    children: [
                      {
                        name: 'a5',
                        __index: '0.children.0.children.0.children.0.children.0',
                      },
                    ],
                    __index: '0.children.0.children.0.children.0',
                  },
                ],
                __index: '0.children.0.children.0',
              },
            ],
            __index: '0.children.0',
          },
        ],
        __index: '0',
      },
    ];
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('test path table if create', async () => {
    expect(await db.getCollection(name).existsInDb()).toBeTruthy();
  });

  it('test path table data correction', async () => {
    await treeCollection.repository.create({
      values,
    });
    const data = await treeCollection.repository.find({});
    expect(data.length).toBe(6);
    const nodeA1 = await treeCollection.repository.findOne({
      filter: {
        name: 'a1',
      },
    });
    const nodeA2 = await treeCollection.repository.findOne({
      filter: {
        name: 'a2',
      },
    });
    const nodeA3 = await treeCollection.repository.findOne({
      filter: {
        name: 'a3',
      },
    });
    const nodeA4 = await treeCollection.repository.findOne({
      filter: {
        name: 'a4',
      },
    });
    const nodeA5 = await treeCollection.repository.findOne({
      filter: {
        name: 'a5',
      },
    });
    const pathNodeA1 = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA1.get(treeCollection.filterTargetKey),
      },
    });
    const pathNodeA2 = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA2.get(treeCollection.filterTargetKey),
      },
    });
    const pathNodeA3 = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA3.get(treeCollection.filterTargetKey),
      },
    });
    const pathNodeA4 = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA4.get(treeCollection.filterTargetKey),
      },
    });
    const pathNodeA5 = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA5.get(treeCollection.filterTargetKey),
      },
    });
    //test if root primary key data is correct
    expect(pathNodeA1.get('rootPk')).toEqual(nodeA1.get(treeCollection.filterTargetKey));
    expect(pathNodeA2.get('rootPk')).toEqual(nodeA1.get(treeCollection.filterTargetKey));
    expect(pathNodeA3.get('rootPk')).toEqual(nodeA1.get(treeCollection.filterTargetKey));
    expect(pathNodeA4.get('rootPk')).toEqual(nodeA1.get(treeCollection.filterTargetKey));
    expect(pathNodeA5.get('rootPk')).toEqual(nodeA1.get(treeCollection.filterTargetKey));
    //test if root node key data is correct
    expect(pathNodeA1.get('nodePk')).toEqual(nodeA1.get(treeCollection.filterTargetKey));
    expect(pathNodeA2.get('nodePk')).toEqual(nodeA2.get(treeCollection.filterTargetKey));
    expect(pathNodeA3.get('nodePk')).toEqual(nodeA3.get(treeCollection.filterTargetKey));
    expect(pathNodeA4.get('nodePk')).toEqual(nodeA4.get(treeCollection.filterTargetKey));
    expect(pathNodeA5.get('nodePk')).toEqual(nodeA5.get(treeCollection.filterTargetKey));
    //test if root path data is correct
    expect(pathNodeA1.get('path')).toEqual(`/${nodeA1.get(treeCollection.filterTargetKey)}`);
    expect(pathNodeA2.get('path')).toEqual(
      `/${nodeA1.get(treeCollection.filterTargetKey)}/${nodeA2.get(treeCollection.filterTargetKey)}`,
    );
    expect(pathNodeA3.get('path')).toEqual(
      `/${nodeA1.get(treeCollection.filterTargetKey)}/${nodeA2.get(treeCollection.filterTargetKey)}/${nodeA3.get(
        treeCollection.filterTargetKey,
      )}`,
    );
    expect(pathNodeA4.get('path')).toEqual(
      `/${nodeA1.get(treeCollection.filterTargetKey)}/${nodeA2.get(treeCollection.filterTargetKey)}/${nodeA3.get(
        treeCollection.filterTargetKey,
      )}/${nodeA4.get(treeCollection.filterTargetKey)}`,
    );
    expect(pathNodeA5.get('path')).toEqual(
      `/${nodeA1.get(treeCollection.filterTargetKey)}/${nodeA2.get(treeCollection.filterTargetKey)}/${nodeA3.get(
        treeCollection.filterTargetKey,
      )}/${nodeA4.get(treeCollection.filterTargetKey)}/${nodeA5.get(treeCollection.filterTargetKey)}`,
    );
  });

  it('test node parent changed if the related node path is changed', async () => {
    await treeCollection.repository.create({
      values,
    });
    const nodeA1 = await treeCollection.repository.findOne({
      filter: {
        name: 'a1',
      },
    });
    const nodeA2 = await treeCollection.repository.findOne({
      filter: {
        name: 'a2',
      },
    });
    const nodeA3 = await treeCollection.repository.findOne({
      filter: {
        name: 'a3',
      },
    });
    const nodeA4 = await treeCollection.repository.findOne({
      filter: {
        name: 'a4',
      },
    });
    const nodeA5 = await treeCollection.repository.findOne({
      filter: {
        name: 'a5',
      },
    });
    // test node parent changed if the related node path is changed
    await treeCollection.repository.update({
      values: {
        parentId: null,
      },
      filter: {
        name: 'a4',
      },
    });
    const pathNodeA4Changed = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA4.get(treeCollection.filterTargetKey),
      },
    });
    const pathNodeA5Changed = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA5.get(treeCollection.filterTargetKey),
      },
    });
    // node a4 and a5 root path is equal when a4 change parent to null
    expect(pathNodeA4Changed.get('rootPk') === pathNodeA5Changed.get('rootPk')).toBeTruthy();
    await treeCollection.repository.update({
      values: {
        parentId: nodeA3.get(treeCollection.filterTargetKey),
      },
      filter: {
        name: 'a4',
      },
    });
    const allNodes = await db.getCollection(name).repository.find({});
    // all nodes root primary key is equal when a4 change parent to a3
    for (const node of allNodes) {
      expect(nodeA1.get(treeCollection.filterTargetKey) === node.get('rootPk')).toBeTruthy();
    }
    // await treeCollection.repository.update({
    //   values: {
    //     parentId: nodeA4.get(treeCollection.filterTargetKey),
    //   },
    //   filter: {
    //     name: 'a4',
    //   },
    // });
    // const pathDataA4New = await db.getCollection(name).repository.findOne({
    //   filter: {
    //     [nodePkColumnName]: nodeA4.get(treeCollection.filterTargetKey),
    //   },
    // });
    // // node primary key shoud be equal to root primary key to avoid infinite loop
    // expect(pathDataA4New.get('nodePk') === pathDataA4New.get('rootPk')).toBeTruthy();
  });

  it('test tree find one', async () => {
    await treeCollection.repository.create({
      values,
    });
    const nodeA1 = await treeCollection.repository.findOne({
      filter: {
        name: 'a1',
      },
    });
    expect(nodeA1).toBeTruthy();
    expect(nodeA1.get('name')).toEqual('a1');
  });

  it('test tree find with tree', async () => {
    await treeCollection.repository.create({
      values,
    });
    const data = await treeCollection.repository.find({
      tree: true,
    });
    expect(data.map((i) => i.toJSON())).toMatchObject(values);
  });

  it('test tree find', async () => {
    await treeCollection.repository.create({
      values,
    });
    const data = await treeCollection.repository.find({
      filter: {
        name: 'a1',
      },
    });
    expect(data.length).toEqual(1);
    expect(data[0].name).toEqual('a1');
  });

  it('test tree find with tree', async () => {
    await treeCollection.repository.create({
      values,
    });
    const data = await treeCollection.repository.find({
      filter: {
        name: 'a1',
      },
      tree: true,
    });
    expect(data.length).toEqual(1);
    expect(data[0].get('children')).toBeFalsy();
    expect(data[0].get('name')).toEqual('a1');
    const dataA2 = await treeCollection.repository.find({
      filter: {
        name: 'a2',
      },
      tree: true,
    });
    expect(dataA2.length).toEqual(1);
    expect(dataA2[0].get('children')).toBeTruthy();
    expect(dataA2[0].get('name')).toEqual('a1');
    expect(dataA2[0].get('children').length).toEqual(1);
    expect(dataA2[0].get('children')[0].get('name')).toEqual('a2');
  });

  it('test tree find with tree and append parameter', async () => {
    await treeCollection.repository.create({
      values,
    });
    const data = await treeCollection.repository.find({
      filter: {
        name: 'a1',
      },
      tree: true,
      appends: ['parent'],
    });
    expect(data.length).toEqual(1);
    expect(data[0].get('children')).toBeFalsy();
    expect(data[0].get('name')).toEqual('a1');
    const dataA2 = await treeCollection.repository.find({
      filter: {
        name: 'a2',
      },
      tree: true,
      appends: ['parent'],
    });
    expect(dataA2.length).toEqual(1);
    expect(dataA2[0].get('children')).toBeTruthy();
    expect(dataA2[0].get('name')).toEqual('a1');
    expect(dataA2[0].get('children').length).toEqual(1);
    expect(dataA2[0].get('children')[0].get('name')).toEqual('a2');
    expect(dataA2[0].get('children')[0].get('parent')).toBeTruthy();
    expect(dataA2[0].get('children')[0].get('parent').get('name')).toEqual('a1');
  });

  it('test tree find with tree、 appends and fields parameter', async () => {
    await treeCollection.repository.create({
      values,
    });
    const data = await treeCollection.repository.find({
      filter: {
        name: 'a1',
      },
      tree: true,
      appends: ['parent'],
      fields: ['id', 'name'],
    });
    const dataExpect = {
      id: 1,
      name: 'a1',
      parent: null,
      __index: '0',
    };
    expect(data[0].toJSON()).toMatchObject(dataExpect);
    expect(data.length).toEqual(1);
    expect(data[0].get('children')).toBeFalsy();
    expect(data[0].get('parent')).toBeFalsy();
    expect(data[0].get('name')).toEqual('a1');
    expect(data[0].get('__index')).toEqual('0');
    const dataA3 = await treeCollection.repository.find({
      filter: {
        name: 'a5',
      },
      tree: true,
      appends: ['parent'],
      fields: ['id', 'name'],
    });
    expect(dataA3.map((i) => i.toJSON())).toMatchObject(valuesNoA1Children);
  });

  it('test tree find with filterByTk parameter', async () => {
    await treeCollection.repository.create({
      values,
    });
    const data = await treeCollection.repository.find({
      filterByTk: 1,
      tree: true,
      appends: ['parent'],
      fields: ['id', 'name'],
    });
    expect(data.length).toEqual(1);
    expect(data[0].name).toEqual('a1');
    expect(data[0].children).toBeUndefined();
    const dataA5 = await treeCollection.repository.find({
      filterByTk: 5,
      tree: true,
      // appends: ['parent'],
      fields: ['id', 'name'],
    });
    expect(dataA5.length).toEqual(1);
    expect(dataA5[0].get('children')).toBeTruthy();
    expect(dataA5.map((i) => i.toJSON())).toMatchObject(valuesNoA1Children);
  });

  it('test tree count', async () => {
    await treeCollection.repository.create({
      values,
    });
    const count = await treeCollection.repository.count({});
    expect(count).toEqual(6);

    const countWithFilter = await treeCollection.repository.count({
      filter: {
        name: {
          $startsWith: 'a',
        },
      },
    });
    expect(countWithFilter).toEqual(6);

    const countWithTree = await treeCollection.repository.count({
      tree: true,
    });
    expect(countWithTree).toEqual(1);

    const countWithFilterByTk = await treeCollection.repository.count({
      tree: true,
      filterByTk: 5,
    });
    expect(countWithFilterByTk).toEqual(1);

    const countFilter = await treeCollection.repository.count({
      tree: true,
      filter: {
        name: 'a5',
      },
    });
    expect(countFilter).toEqual(1);
  });

  it('test tree find and count', async () => {
    await treeCollection.repository.create({
      values,
    });
    const data = await treeCollection.repository.findAndCount({});
    const count = data[1];
    expect(count).toEqual(6);

    const countWithFilter = await treeCollection.repository.findAndCount({
      filter: {
        name: {
          $startsWith: 'a',
        },
      },
    });
    expect(countWithFilter[1]).toEqual(6);

    const countWithTree = await treeCollection.repository.findAndCount({
      tree: true,
    });
    expect(countWithTree[1]).toEqual(1);
    expect(countWithTree[0].map((i) => i.toJSON())).toMatchObject(values);

    const countWithFilterByTk = await treeCollection.repository.findAndCount({
      tree: true,
      filterByTk: 5,
    });
    expect(countWithFilterByTk[0].map((i) => i.toJSON())).toMatchObject(valuesNoA1Children);
    expect(countWithFilterByTk[1]).toEqual(1);

    const countFilter = await treeCollection.repository.findAndCount({
      tree: true,
      filter: {
        name: 'a5',
      },
    });
    expect(countFilter[1]).toEqual(1);
    // shoud be root node name of a1
    expect(countFilter[0][0].name).toEqual('a1');
  });

  it('test tree find one', async () => {
    await treeCollection.repository.create({
      values,
    });

    const nodeA1 = await treeCollection.repository.findOne({
      filter: {
        name: 'a1',
      },
    });
    expect(nodeA1.get('name')).toEqual('a1');
    expect(nodeA1.get('children')).toBeUndefined();

    const nodeA5 = await treeCollection.repository.findOne({
      filter: {
        name: 'a5',
      },
    });
    expect(nodeA5.get('name')).toEqual('a5');
    expect(nodeA5.get('children')).toBeUndefined();

    const nodeA1WithTree = await treeCollection.repository.findOne({
      filter: {
        name: 'a1',
      },
      tree: true,
    });
    expect(nodeA1WithTree.get('name')).toEqual('a1');
    expect(nodeA1WithTree.get('children')).toBeUndefined();

    const nodeA5WithTree = await treeCollection.repository.findOne({
      filter: {
        name: 'a5',
      },
      fields: ['id', 'name'],
      tree: true,
    });
    // shoud be root node name of a1
    expect(nodeA5WithTree.get('name')).toEqual('a1');
    expect(nodeA5WithTree.get('children')).toBeTruthy();
    expect(nodeA5WithTree.toJSON()).toMatchObject(valuesNoA1Children[0]);
  });

  // it('test tree collection destroy then the path table will be destroy', async () => {
  //   await treeCollection.removeFromDb();
  //   expect(await db.getCollection(name).existsInDb()).toBeFalsy();
  // })

  it('should update paths when remove children', async () => {
    const data = await treeCollection.repository.create({
      values: {
        name: 'a1',
        children: [
          {
            name: 'b1',
          },
          {
            name: 'b2',
          },
        ],
      },
    });
    const b1 = data.get('children')[0];
    const b2 = data.get('children')[1];
    const tks = [b1.get(treeCollection.filterTargetKey), b2.get(treeCollection.filterTargetKey)];
    const paths = await db.getRepository(name).find({
      filter: {
        [nodePkColumnName]: {
          $in: tks,
        },
      },
    });
    expect(paths.length).toBe(2);
    expect(paths[0].get('path')).toBe('/1/2');
    expect(paths[1].get('path')).toBe('/1/3');
    // @ts-ignore
    await db.getRepository(`${treeCollection.name}.children`, data.get(treeCollection.filterTargetKey)).remove(tks);
    const paths2 = await db.getRepository(name).find({
      filter: {
        [nodePkColumnName]: {
          $in: tks,
        },
      },
    });
    expect(paths2.length).toBe(2);
    expect(paths2[0].get('path')).toBe('/2');
    expect(paths2[1].get('path')).toBe('/3');
  });

  it('should not update nodes with similar path prefix', async () => {
    const data = await treeCollection.repository.create({
      values: {
        name: 'a1',
        children: [{ name: 'b1' }],
      },
    });
    const b1 = data.get('children')[0];

    // 人为插入一个相似路径（非子节点）
    const fakeNode = await treeCollection.repository.create({
      values: {
        name: 'b1-fake',
        parentId: null,
      },
    });
    await db.getRepository(name).update({
      values: {
        path: '/1/21', // 看起来像是 b1 子节点，但不是
      },
      filter: {
        [nodePkColumnName]: fakeNode.get(treeCollection.filterTargetKey),
      },
    });

    // 移除 b1
    const b1Key = b1.get(treeCollection.filterTargetKey);
    // @ts-ignore
    await db.getRepository(`${treeCollection.name}.children`, data.get(treeCollection.filterTargetKey)).remove([b1Key]);

    // 验证 b1 被正确更新为独立根路径
    const b1Path = await db.getRepository(name).findOne({
      filter: {
        [nodePkColumnName]: b1Key,
      },
    });
    expect(b1Path.get('path')).toBe(`/${b1Key}`);

    // 验证 fakeNode 的路径未被误更新
    const fakePath = await db.getRepository(name).findOne({
      filter: {
        [nodePkColumnName]: fakeNode.get(treeCollection.filterTargetKey),
      },
    });
    expect(fakePath.get('path')).toBe('/1/21');
  });
});
