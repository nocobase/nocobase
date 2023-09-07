import { Database, mockDatabase } from '@nocobase/database';

describe('collection definition snapshot', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should get snapshot from collection', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'integer' },
      ],
    });

    const firstSnapShot = User.getDefinitionSnapshot();

    User.addField('email', { name: 'email', type: 'string' });

    const secondSnapShot = User.getDefinitionSnapshot();

    expect(firstSnapShot.hash).not.toBe(secondSnapShot.hash);
  });
});
