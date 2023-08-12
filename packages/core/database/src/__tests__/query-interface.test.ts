import { Database, mockDatabase } from '@nocobase/database';

describe('query interface', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => [await db.close()]);

  it('should create join sql', async () => {
    const Profile = db.collection({
      name: 'profiles',
      fields: [{ type: 'integer', name: 'age' }],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasOne',
          name: 'profile',
        },
      ],
    });

    await db.sync();

    const sql = db.queryInterface.createJoinSQL(User, 'profile');
    console.log(sql);
  });
});
