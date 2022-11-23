import Database, { Collection as DBCollection } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';

describe('reference integrity check', () => {
  let db: Database;
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should clean reference after collection destroy', async () => {
    const users = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasOne',
          name: 'profile',
          onDelete: 'CASCADE',
        },
      ],
    });

    const profiles = db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'integer',
          name: 'age',
        },
        {
          type: 'belongsTo',
          name: 'user',
          onDelete: 'CASCADE',
        },
      ],
    });

    await db.sync();

    expect(db.referenceMap.getReferences('users').length).toEqual(1);

    await users.repository.create({
      values: {
        name: 'foo',
        profile: {
          age: 18,
        },
      },
    });

    db.removeCollection('profiles');

    expect(db.referenceMap.getReferences('users').length).toEqual(0);

    await users.repository.destroy({
      filter: {
        name: 'foo',
      },
    });
  });
});
