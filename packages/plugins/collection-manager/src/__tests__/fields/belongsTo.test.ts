import type { Collection as DBCollection } from '@nocobase/database';
import type Database from '@nocobase/database';
import type Application from '@nocobase/server';
import { createApp } from '..';

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
    await Collection.repository.create({
      values: {
        name: 'tests',
      },
    });
    await Collection.repository.create({
      values: {
        name: 'foos',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('a', () => {
    expect(true).toBe(true);
  });
});
