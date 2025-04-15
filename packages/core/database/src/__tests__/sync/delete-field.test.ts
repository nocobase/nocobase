/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe.skip('delete field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should delete field', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'email' },
      ],
    });

    await db.sync();

    const userTableInfo = await db.sequelize.getQueryInterface().describeTable(User.getTableNameWithSchema());

    expect(userTableInfo.email).toBeDefined();

    User.removeField('email');

    await db.sync();

    const userTableInfo2 = await db.sequelize.getQueryInterface().describeTable(User.getTableNameWithSchema());
    expect(userTableInfo2.email).toBeUndefined();
  });
});
