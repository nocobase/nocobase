/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase } from '@nocobase/test';
import { Collection } from '../../collection';

describe('estimated row count test', () => {
  let db;
  let User: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    if (db.sequelize.getDialect() === 'sqlite') {
      return;
    }

    User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();
  });
  test('getEstimatedRowCount with empty table', async () => {
    if (db.sequelize.getDialect() === 'sqlite') {
      return;
    }

    const repository = User.repository;
    await analyzeTable(db, User);
    const emptyCount = await repository.getEstimatedRowCount();
    expect(emptyCount).toEqual(0);
  });

  test('getEstimatedRowCount with data', async () => {
    if (db.sequelize.getDialect() === 'sqlite') {
      return;
    }

    const repository = User.repository;

    await repository.createMany({
      records: [{ name: 'u1' }, { name: 'u2' }, { name: 'u3' }, { name: 'u4' }, { name: 'u5' }],
    });
    await analyzeTable(db, User);
    const estimatedCount = await repository.getEstimatedRowCount();
    expect(estimatedCount).toBeGreaterThanOrEqual(0);

    expect(estimatedCount).toBeLessThan(1000);
  });

  test('getEstimatedRowCount with SQL collection', async () => {
    if (db.sequelize.getDialect() === 'sqlite') {
      return;
    }

    (User as any).isSql = () => true;

    const count = await User.repository.getEstimatedRowCount();
    expect(count).toEqual(0);

    delete (User as any).isSql;
  });

  test('getEstimatedRowCount with view collection', async () => {
    if (db.sequelize.getDialect() === 'sqlite') {
      return;
    }

    (User as any).isView = () => true;

    const count = await User.repository.getEstimatedRowCount();
    expect(count).toEqual(0);

    delete (User as any).isView;
  });

  test('getEstimatedRowCount error handling', async () => {
    if (db.sequelize.getDialect() === 'sqlite') {
      return;
    }

    const repository = User.repository;
    await analyzeTable(db, User);
    const count = await repository.getEstimatedRowCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('getEstimatedRowCount with different table naming conventions', async () => {
    if (db.sequelize.getDialect() === 'sqlite') {
      return;
    }

    const testDb = await createMockDatabase({ underscored: false });
    await testDb.clean({ drop: true });

    const SnakeCaseCollection = testDb.collection({
      name: 'snake_case_users',
      tableName: 'snake_case_users_table',
      underscored: true,
      fields: [
        { type: 'string', name: 'userName' },
        { type: 'integer', name: 'userAge' },
      ],
    });

    const CamelCaseCollection = testDb.collection({
      name: 'camelCaseUsers',
      tableName: 'camelCaseUsersTable',
      underscored: false,
      fields: [
        { type: 'string', name: 'userName' },
        { type: 'integer', name: 'userAge' },
      ],
    });

    await testDb.sync();

    await SnakeCaseCollection.repository.createMany({
      records: [
        { userName: 'snake1', userAge: 25 },
        { userName: 'snake2', userAge: 30 },
      ],
    });

    await CamelCaseCollection.repository.createMany({
      records: [
        { userName: 'camel1', userAge: 25 },
        { userName: 'camel2', userAge: 30 },
        { userName: 'camel3', userAge: 35 },
      ],
    });
    await analyzeTable(db, SnakeCaseCollection);
    await analyzeTable(db, CamelCaseCollection);
    const snakeCaseCount = await SnakeCaseCollection.repository.getEstimatedRowCount();
    expect(snakeCaseCount).toBeGreaterThanOrEqual(0);

    await analyzeTable(db, CamelCaseCollection);
    const camelCaseCount = await CamelCaseCollection.repository.getEstimatedRowCount();
    expect(camelCaseCount).toBeGreaterThanOrEqual(0);

    expect(typeof snakeCaseCount).toBe('number');
    expect(typeof camelCaseCount).toBe('number');

    expect(SnakeCaseCollection.tableName()).toBe('snake_case_users_table');
    expect(CamelCaseCollection.tableName()).toBe('camelCaseUsersTable');

    await testDb.close();
  });
});

async function analyzeTable(db, collection) {
  if (db.isMySQLCompatibleDialect()) {
    await db.sequelize.query(`ANALYZE TABLE ${collection.getTableNameWithSchema()}`);
  } else if (db.isPostgresCompatibleDialect()) {
    await db.prepare();
    await db.sequelize.query(`ANALYZE ${collection.getTableNameWithSchema()}`);
  }
}
