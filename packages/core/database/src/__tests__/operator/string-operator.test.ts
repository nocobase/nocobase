import Database, { Collection, mockDatabase } from '@nocobase/database';

describe('string operator', () => {
  let db: Database;

  let User: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase({});

    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync({
      force: true,
    });
  });

  it('should escape underscore in inlcude operator', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });

    const u1Res = await db.getRepository('users').findOne({
      filter: {
        'name.$includes': '_',
      },
    });

    expect(u1Res).toBeNull();
  });

  it('should query with include operator', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });

    const u1Res = await db.getRepository('users').findOne({
      filter: {
        'name.$includes': 'u1',
      },
    });

    expect(u1Res.get('id')).toEqual(u1.get('id'));
  });

  it('should query with and ', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });

    const u1Res = await db.getRepository('users').findOne({
      filter: {
        $and: [
          {
            'name.$includes': 'u1',
          },
        ],
      },
    });

    expect(u1Res.get('id')).toEqual(u1.get('id'));
  });
});
