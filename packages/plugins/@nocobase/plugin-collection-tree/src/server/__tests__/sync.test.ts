/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import Migration from '../migrations/20240802141435-collection-tree';
import { isPg } from '@nocobase/test';

describe('tree collection sync', async () => {
  let app: MockServer;
  let db: MockDatabase;

  beforeEach(async () => {
    app = await createMockServer({
      version: '1.3.0-alpha',
      plugins: ['field-sort', 'data-source-main', 'data-source-manager', 'error-handler', 'collection-tree'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('should create path collection when creating tree collection', async () => {
    const collection = db.collection({
      name: 'test_tree',
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
    await collection.sync();
    const name = `main_${collection.name}_path`;
    const pathCollection = db.getCollection(name);
    expect(pathCollection).toBeTruthy();
    expect(await pathCollection.existsInDb()).toBeTruthy();
  });

  it.runIf(isPg())('should create path collection when creating inherit tree collection', async () => {
    const root = db.collection({
      name: 'root',
      fields: [
        { name: 'name', type: 'string' },
        {
          name: 'bs',
          type: 'hasMany',
          target: 'b',
          foreignKey: 'root_id',
        },
      ],
    });
    await root.sync();

    const collection = db.collection({
      name: 'test_tree',
      tree: 'adjacency-list',
      inherits: ['root'],
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
    await collection.sync();
    const name = `main_${collection.name}_path`;
    const pathCollection = db.getCollection(name);
    expect(pathCollection).toBeTruthy();
    expect(await pathCollection.existsInDb()).toBeTruthy();
  });
});

describe('collection tree migrate test', () => {
  let app: MockServer;
  let db: MockDatabase;
  let repo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      version: '1.3.0-alpha',
      plugins: ['field-sort', 'data-source-main', 'data-source-manager', 'error-handler', 'collection-tree'],
    });
    db = app.db;
    repo = app.db.getRepository('applicationPlugins');
    await db.getRepository('collections').create({
      values: {
        name: 'test_tree',
        tree: 'adjacencyList',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'belongsTo',
            name: 'parent',
            foreignKey: 'parentId',
            target: 'test_tree',
            treeParent: true,
          },
          {
            type: 'hasMany',
            name: 'children',
            foreignKey: 'parentId',
            target: 'test_tree',
            treeChildren: true,
          },
        ],
      },
      context: {},
    });
    await app.db.getCollection('test_tree').model.truncate();
    await app.db.getCollection('main_test_tree_path').model.truncate();
    const repository = app.db.getRepository('test_tree');
    await repository.create({
      values: [
        {
          name: 'c1',
          children: [
            {
              name: 'c1-1',
              children: [
                {
                  name: 'c1-1-1',
                },
              ],
            },
            {
              name: 'c12',
            },
          ],
        },
      ],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should sync path collection for old tree collections when upgrading', async () => {
    const plugin = await repo.create({
      values: {
        name: 'collection-tree',
        version: '1.3.0-alpha',
        enabled: true,
        installed: true,
        builtIn: true,
      },
    });
    const name = `main_test_tree_path`;
    const pathCollection = db.getCollection(name);
    expect(pathCollection).toBeTruthy();
    expect(await pathCollection.existsInDb()).toBeTruthy();
    const pathData = await pathCollection.repository.find({});
    expect(pathData.length).toEqual(4);
    await pathCollection.removeFromDb();
    const migration = new Migration({
      db: db,
      // @ts-ignore
      app,
    });
    await migration.up();
    const p = await repo.findOne({
      filter: {
        id: plugin.id,
      },
    });
    expect(p.name).toBe('collection-tree');
    const collection1 = db.getCollection('test_tree');
    const pathCollection1 = db.getCollection(name);
    expect(pathCollection1).toBeTruthy();
    expect(await pathCollection1.existsInDb()).toBeTruthy();
    const collectionData = await collection1.repository.find({});
    expect(collectionData.length).toEqual(4);
    const pathData1 = await pathCollection1.repository.find({ context: {} });
    expect(pathData1.length).toEqual(4);
  });
});
