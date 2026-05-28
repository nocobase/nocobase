/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

describe('issues', async () => {
  let app: MockServer;
  let db: Database;
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['collection-tree'],
    });
    db = app.db;
    db.collection({
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
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('should not set itself as parent', async () => {
    expect.assertions(1);
    const root = await db.getRepository('tree').create({
      values: {
        name: 'root',
      },
    });
    try {
      await root.update({
        parentId: root.get('id'),
      });
    } catch (error) {
      expect(error.message).toBe('Cannot set itself as the parent node');
    }
  });

  it('should not set descendant as parent', async () => {
    expect.assertions(1);
    const root = await db.getRepository('tree').create({
      values: {
        name: 'root',
      },
    });
    const child = await db.getRepository('tree').create({
      values: {
        name: 'child',
        parentId: root.get('id'),
      },
    });

    try {
      await root.update({
        parentId: child.get('id'),
      });
    } catch (error) {
      expect(error.message).toBe('Cannot set a descendant node as the parent node');
    }
  });

  it('should report cycle path when listing dirty tree data', async () => {
    expect.assertions(1);
    const root = await db.getRepository('tree').create({
      values: {
        name: 'root',
      },
    });
    const child = await db.getRepository('tree').create({
      values: {
        name: 'child',
        parentId: root.get('id'),
      },
    });

    await db.getModel('tree').update(
      {
        parentId: child.get('id'),
      },
      {
        where: {
          id: root.get('id'),
        },
        hooks: false,
      },
    );

    try {
      await db.getRepository('tree').find({
        tree: true,
        filter: {
          id: [root.get('id'), child.get('id')],
        },
      });
    } catch (error) {
      expect(error.message).toBe(
        `Cycle detected in tree: ${root.get('id')} -> ${child.get('id')} -> ${root.get('id')}`,
      );
    }
  });
});
