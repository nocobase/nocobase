/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockDatabase, MockServer } from '@nocobase/test';

describe('indexes', () => {
  let app: MockServer;
  let db: MockDatabase;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'field-sort'],
    });
    db = app.db;
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('indexes', async () => {
    db.collection({
      name: 'users2',
      createdBy: true,
      updatedBy: true,
      autoGenId: false,
      indexes: [
        {
          fields: ['testId'],
        },
      ],
      fields: [
        {
          type: 'string',
          name: 'testId',
        },
      ],
    });
    await db.sync();
    const indexes = (await db.sequelize.getQueryInterface().showIndex('users2')) as any[];
    expect(indexes.length).toBe(3);
  });
});
