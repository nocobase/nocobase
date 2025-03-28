/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe('list view', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should list view', async () => {
    const dropViewSQL1 = `DROP VIEW IF EXISTS test1`;
    await db.sequelize.query(dropViewSQL1);

    const dropViewSQL2 = `DROP VIEW IF EXISTS test2`;
    await db.sequelize.query(dropViewSQL2);

    const sql1 = `CREATE VIEW test1 AS SELECT 1`;
    const sql2 = `CREATE VIEW test2 AS SELECT 2`;

    await db.sequelize.query(sql1);
    await db.sequelize.query(sql2);

    const results = await db.queryInterface.listViews();
    expect(results.find((item) => item.name === 'test1')).toBeTruthy();
    expect(results.find((item) => item.name === 'test2')).toBeTruthy();
  });
});
