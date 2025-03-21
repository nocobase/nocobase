/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('foreign key', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create index for foreign key', async () => {
    const users = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
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
          target: 'users',
        },
      ],
    });

    await db.sync();

    const foreignKey = posts.model.rawAttributes['userId'].field;

    const indexes = await db.sequelize.getQueryInterface().showIndex(posts.getTableNameWithSchema());

    // @ts-ignore
    expect(indexes.some((index) => index.fields.some((field) => field.attribute === foreignKey))).toBeTruthy();
  });
});
