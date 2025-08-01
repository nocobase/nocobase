/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayFieldRepository, createMockDatabase, Database, Model } from '@nocobase/database';

describe('database', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  // 生成长度为 63 的随机表名
  const generateRandomTableName = (length = 63): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
    let result = 'test_'; // 以 test_ 开头，确保是有效的表名

    for (let i = result.length; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  };

  test('pk name is too long', async () => {
    const tableName1 = generateRandomTableName(63);
    const fieldName1 = generateRandomTableName(63);
    const fieldName2 = generateRandomTableName(63);
    db.collection({
      name: tableName1,
      indexes: [
        {
          type: 'UNIQUE',
          fields: [fieldName1, fieldName2],
        },
      ],
      autoGenId: false,
      fields: [
        {
          type: 'string',
          name: fieldName1,
        },
        {
          type: 'string',
          name: fieldName2,
        },
      ],
    });
    db.collection({
      name: 'a',
      fields: [
        {
          type: 'string',
          name: fieldName1,
          unique: true,
        },
      ],
    });
    db.collection({
      name: 'b',
      fields: [
        {
          type: 'string',
          name: fieldName2,
          unique: true,
        },
        {
          type: 'belongsToMany',
          name: 'a',
          through: tableName1,
          foreignKey: fieldName1,
          otherKey: fieldName2,
          sourceKey: fieldName2,
          targetKey: fieldName1,
        },
      ],
    });
    await db.sync();
  });
});
