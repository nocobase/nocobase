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

  it('should add field into empty table', async () => {
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
      unique: true,
    });

    await db.sync(syncOptions);
  });
});
