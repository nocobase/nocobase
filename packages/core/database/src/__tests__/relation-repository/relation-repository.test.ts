/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, MockDatabase } from '@nocobase/database';

describe('relation repository', () => {
  let db: MockDatabase;
  beforeEach(async () => {
    db = await createMockDatabase();
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await db.close();
  });

  it('should not convert string source id to number', async () => {
    db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name' }],
    });
    const User = db.collection({
      name: 'users',
      autoGenId: false,
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'tags', sourceKey: 'name', target: 'tags', foreignKey: 'userId' },
      ],
    });
    await db.sync();
    await User.repository.create({
      values: { name: '123', tags: [{ name: 'tag1' }] },
    });
    const repo = db.getRepository('users.tags', '123');
    await expect(repo.find()).resolves.not.toThrow();
  });
});
