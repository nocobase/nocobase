/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe('model', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('toJSON', () => {
    it('should return null when belongsTo association empty', async () => {
      const user = db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'posts' },
        ],
      });

      const posts = db.collection({
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'belongsTo',
            name: 'user',
          },
        ],
      });

      await db.sync();

      const u1 = await db.getRepository('users').create({
        values: {
          name: 'u1',
        },
      });

      await db.getRepository('posts').create({
        values: {
          title: 'p1',
        },
      });

      const p1 = await db.getRepository('posts').findOne({
        appends: ['user'],
      });

      const p1JSON = p1.toJSON();
      expect(p1JSON['user']).toBeNull();
    });
  });
});
