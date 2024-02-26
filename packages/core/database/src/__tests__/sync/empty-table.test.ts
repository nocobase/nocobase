import { Database, mockDatabase } from '@nocobase/database';

describe('empty table', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should add primary key field into empty table', async () => {
    const syncOptions = {
      alter: {
        drop: false,
      },
      force: false,
    };

    const empty = db.collection({
      name: 'empty',
      autoGenId: false,
    });

    await db.sync(syncOptions);

    empty.setField('code', {
      type: 'string',
      primaryKey: true,
    });

    await db.sync(syncOptions);

    const emptyInfo = await db.sequelize.getQueryInterface().describeTable(empty.getTableNameWithSchema());
    expect(emptyInfo.code.primaryKey).toBeTruthy();

    const empty2 = db.collection({
      name: 'empty2',
      autoGenId: false,
    });

    await db.sync(syncOptions);

    empty2.setField('code', {
      type: 'string',
      primaryKey: true,
    });

    await db.sync(syncOptions);

    const empty2Info = await db.sequelize.getQueryInterface().describeTable(empty2.getTableNameWithSchema());
    expect(empty2Info.code.primaryKey).toBeTruthy();
  });
});
