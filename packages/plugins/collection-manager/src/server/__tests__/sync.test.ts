import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';

describe('sync collection', () => {
  let db: Database;
  let app: Application;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should not remove column when async with drop false', async () => {
    const getTableInfo = async (tableName: string) => {
      const queryInterface = db.sequelize.getQueryInterface();
      const tableInfo = await queryInterface.describeTable(tableName);
      return tableInfo;
    };

    const c1 = db.collection({
      name: 'c1',
      fields: [{ type: 'string', name: 'f1' }],
    });

    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });

    const tableInfo1 = await getTableInfo(c1.model.tableName);
    expect(tableInfo1.f1).toBeTruthy();

    c1.setField('f2', {
      type: 'string',
    });

    c1.removeField('f1');

    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });

    const tableInfo2 = await getTableInfo(c1.model.tableName);
    expect(tableInfo2.f2).toBeTruthy();
    expect(tableInfo2.f1).toBeTruthy();
  });
});
