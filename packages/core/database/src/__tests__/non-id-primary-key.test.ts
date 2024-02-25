import { Database, mockDatabase } from '@nocobase/database';

describe('non-id primary key', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create auto increment field as primary key', async () => {
    const User = db.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
    });
    await db.sync();

    console.log('start sync');
    User.setField('field_auto_incr', { type: 'integer', primaryKey: true, autoIncrement: true });

    await db.sync();

    console.log('sync finished');
    await User.repository.create({});
  });
});
