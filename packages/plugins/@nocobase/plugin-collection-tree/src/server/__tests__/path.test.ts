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

  let db: Database;
  beforeEach(async () => {
    app = await createApp();

    agent = app.agent();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('test collection tree crud for path table', async () => {
    const treeCollection = db.collection({
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
    const name = `main_${treeCollection.name}_path`;
    expect(await db.getCollection(name).existsInDb()).toBeTruthy();
    await treeCollection.repository.create({
      values: [
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
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'a1-1',
            },
          ],
        },
      ],
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
    const nodePkColumnName = db.getCollection(name).getField('nodePk').columnName();
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
    await treeCollection.repository.update({
      values: {
        parentId: nodeA4.get(treeCollection.filterTargetKey),
      },
      filter: {
        name: 'a4',
      },
    });
    const pathDataA4New = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA4.get(treeCollection.filterTargetKey),
      },
    });
    // node primary key shoud be equal to root primary key to avoid infinite loop
    expect(pathDataA4New.get('nodePk') === pathDataA4New.get('rootPk')).toBeTruthy();
  });
});
