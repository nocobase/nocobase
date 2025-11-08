/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe('database', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('indexes', async () => {
    const collection = db.collection({
      name: 'users1',
      autoGenId: false,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['groupId'],
        },
      ],
      fields: [
        {
          type: 'string',
          name: 'userId',
        },
        {
          type: 'string',
          name: 'groupId',
        },
      ],
    });
    await db.sync();
    const indexes = (await db.sequelize.getQueryInterface().showIndex('users1')) as any[];
    expect(indexes.length).toBe(2);
  });

  test('indexes', async () => {
    db.collection({
      name: 'groups',
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
      ],
    });
    db.collection({
      name: 'users2',
      autoGenId: false,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['groupId'],
        },
      ],
      fields: [
        {
          type: 'string',
          name: 'userId',
        },
        {
          type: 'string',
          name: 'groupId',
        },
        {
          type: 'belongsTo',
          name: 'group',
          target: 'groups',
          foreignKey: 'groupId',
          targetKey: 'name',
        },
      ],
    });
    await db.sync();
    const indexes = (await db.sequelize.getQueryInterface().showIndex('users2')) as any[];
    expect(indexes.length).toBe(2);
  });
});
