import { mockDatabase } from '../index';
import { Database } from '../../database';

describe('postgres schema', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      schema: 'testSchema',
    });

    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS "testSchema"');
  });

  afterEach(async () => {
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
      `SELECT * FROM information_schema.tables where table_schema = 'testSchema'`,
    );

    expect(tableInfo[0].length).toEqual(0);
  });

  it('should support database schema option', async () => {
    if (!db.inDialect('postgres')) return;

    await db.clean({ drop: true });

    const tableInfo = await db.sequelize.query(
      `SELECT * FROM information_schema.tables where table_schema = 'testSchema'`,
    );

    expect(tableInfo[0].length).toEqual(0);

    const collection = db.collection({
      name: 'test',
    });

    await db.sync();

    const newTableInfo = await db.sequelize.query(
      `SELECT * FROM information_schema.tables where table_schema = 'testSchema'`,
    );

    expect(newTableInfo[0].find((item) => item['table_name'] == collection.model.tableName)).toBeTruthy();
  });
});
