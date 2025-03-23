/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import { randomStr } from '@nocobase/test';

describe('auth', () => {
  let db: Database;
  afterEach(async () => {
    if (db) {
      await db.close();
    }
  });

  it('should auto create schema on prepare when schema missing', async () => {
    const schemaName = randomStr();

    db = await createMockDatabase({
      schema: schemaName,
    });

    if (!db.inDialect('postgres')) return;

    const querySchemaExists = async () =>
      await db.sequelize.query(
        `SELECT schema_name
         FROM information_schema.schemata
         WHERE schema_name = '${schemaName}';`,
      );

    expect((await querySchemaExists())[0].length).toEqual(0);
    await db.prepare();
    expect((await querySchemaExists())[0].length).toEqual(1);
  });
});

describe('postgres schema', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({
      schema: 'test_schema',
    });

    if (!db.inDialect('postgres')) return;
  });

  afterEach(async () => {
    if (db.inDialect('postgres')) {
      await db.sequelize.query(`DROP SCHEMA IF EXISTS ${db.options.schema} CASCADE;`);
    }
    await db.close();
  });

  it('should drop all tables in schemas', async () => {
    if (!db.inDialect('postgres')) return;

    const collection = db.collection({
      name: 'test',
    });

    await db.sync();

    await db.clean({ drop: true });

    const tableInfo = await db.sequelize.query(
      `SELECT *
       FROM information_schema.tables
       where table_schema = '${db.options.schema}'`,
    );

    expect(tableInfo[0].length).toEqual(0);
  });

  it('should support database schema option', async () => {
    if (!db.inDialect('postgres')) return;

    await db.clean({ drop: true });

    const tableInfo = await db.sequelize.query(
      `SELECT *
       FROM information_schema.tables
       where table_schema = '${db.options.schema}'`,
    );

    expect(tableInfo[0].length).toEqual(0);

    const collection = db.collection({
      name: 'test',
    });

    await db.sync();

    const newTableInfo = await db.sequelize.query(
      `SELECT *
       FROM information_schema.tables
       where table_schema = '${db.options.schema}'`,
    );

    expect(newTableInfo[0].find((item) => item['table_name'] == collection.model.tableName)).toBeTruthy();
  });

  it('should update schema options', async () => {
    if (!db.inDialect('postgres')) return;

    await db.clean({ drop: true });

    const collection = db.collection({
      name: 'test',
    });

    await db.sync();

    collection.updateOptions({
      ...collection.options,
      schema: 'test',
    });

    // @ts-ignore
    expect(collection.model._schema).toEqual('test');
  });
});
