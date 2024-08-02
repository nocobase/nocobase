/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';

describe('tree collection sync', async () => {
  let app: MockServer;
  let db: MockDatabase;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['data-source-main', 'data-source-manager', 'error-handler', 'collection-tree'],
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
  });

  it('should sync path collection for old tree collections when upgrading', async () => {
    await db.getRepository('collections').create({
      values: {
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
      },
    });
    const name = `main_test_tree_path`;
    const pathCollection = db.getCollection(name);
    expect(pathCollection).toBeFalsy();
    await app.runCommand('upgrade');
    const pathCollection2 = db.getCollection(name);
    expect(pathCollection2).toBeTruthy();
  });
});
