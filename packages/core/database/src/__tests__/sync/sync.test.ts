import { Database, mockDatabase } from '@nocobase/database';

describe('sync', function () {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should not sync if no changes', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    const fn = jest.fn();

    User.model.addHook('afterSync', fn);

    await db.sync();
    expect(fn).toBeCalledTimes(1);

    await db.sync();
    expect(fn).toBeCalledTimes(1);
  });
});
