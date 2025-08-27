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
    if (db.inDialect('postgres')) {
      await db.prepare();
    }

    const viewName1 = 'test1';
    const newViewName1 = db.options.schema ? `${db.options.schema}.${viewName1}` : viewName1;
    const dropViewSQL1 = `DROP VIEW IF EXISTS ${newViewName1}`;
    await db.sequelize.query(dropViewSQL1);

    const viewName2 = 'test2';
    const newViewName2 = db.options.schema ? `${db.options.schema}.${viewName2}` : viewName2;
    const dropViewSQL2 = `DROP VIEW IF EXISTS ${newViewName2}`;
    await db.sequelize.query(dropViewSQL2);

    const sql1 = `CREATE VIEW ${newViewName1} AS SELECT 1`;
    const sql2 = `CREATE VIEW ${newViewName2} AS SELECT 2`;

    await db.sequelize.query(sql1);
    await db.sequelize.query(sql2);

    const results = await db.queryInterface.listViews();
    expect(results.find((item) => item.name === 'test1')).toBeTruthy();
    expect(results.find((item) => item.name === 'test2')).toBeTruthy();
  });

  it('should list view when schema passed', async () => {
    if (!db.options.schema) {
      return;
    }

    const viewName = 'schema_test';
    const newViewName = db.options.schema ? `${db.options.schema}.${viewName}` : viewName;
    await db.sequelize.query(`DROP VIEW IF EXISTS ${newViewName}`);
    await db.sequelize.query(`CREATE VIEW ${newViewName} AS SELECT 3`);

    const results = await db.queryInterface.listViews({ schema: db.options.schema });
    expect(results.find((item) => item.name === viewName)).toBeTruthy();
  });
});
