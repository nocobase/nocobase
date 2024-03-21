import { Database, mockDatabase } from '@nocobase/database';
import * as process from 'process';

describe('empty table', () => {
  let db: Database;
  const syncOptions = {
    alter: {
      drop: false,
    },
    force: false,
  };

  beforeEach(async () => {
    db = mockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should change primary key after insert data', async () => {
    const empty = db.collection({
      name: 'empty',
      autoGenId: false,
      timestamps: false,
    });

    await db.sync(syncOptions);

    empty.setField('code', {
      type: 'string',
      primaryKey: true,
    });

    await db.sync(syncOptions);
    await empty.repository.create({
      values: [
        {
          code: 'code1',
        },
        {
          code: 'code2',
        },
      ],
    });

    // remove code field
    await empty.removeFieldFromDb('code');
    await db.sync(syncOptions);

    empty.setField('code2', {
      type: 'string',
      primaryKey: true,
    });

    await db.sync(syncOptions);

    await empty.repository.create({
      values: [
        {
          code2: 'code1',
        },
        {
          code2: 'code2',
        },
      ],
    });
  });

  it.skipIf(process.env['DB_DIALECT'] == 'sqlite')('should add primary key field into empty table', async () => {
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
