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
    // test node parent changed if the related node path is changed
    await treeCollection.repository.update({
      values: {
        parentId: null,
      },
      filter: {
        name: 'a4',
      },
    });
    const nodeA1 = await treeCollection.repository.findOne({
      filter: {
        name: 'a1',
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
    const pathDataA4 = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA4.get(treeCollection.filterTargetKey),
      },
    });
    const pathDataA5 = await db.getCollection(name).repository.findOne({
      filter: {
        [nodePkColumnName]: nodeA5.get(treeCollection.filterTargetKey),
      },
    });
    // node a4 and a5 root path is equal when a4 change parent to null
    expect(pathDataA4.get('rootPk') === pathDataA5.get('rootPk')).toBeTruthy();
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
    //
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
