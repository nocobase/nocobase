import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';
import { CollectionRepository } from '../../index';

describe('belongsTo', () => {
  let db: Database;
  let app: Application;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should load belongsTo field', async () => {
    await Collection.repository.create({
      values: {
        name: 'orders',
        fields: [
          {
            type: 'integer',
            name: 'amount',
          },
          {
            type: 'belongsTo',
            name: 'users',
            targetKey: 'uid',
            foreignKey: 'userId',
          },
        ],
      },
    });

    await Collection.repository.create({
      values: {
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'string',
            name: 'uid',
          },
        ],
      },
    });

    let error;

    try {
      await db.getRepository<CollectionRepository>('collections').load();
    } catch (e) {
      error = e;
    }

    expect(error).toBeUndefined();
  });
});
