import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';

describe('belongsToMany', () => {
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
        name: 'posts',
      },
    });
    await Collection.repository.create({
      values: {
        name: 'tags',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create belongsToMany field', async () => {});
});
