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
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'tags',
      },
      context: {},
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create belongsToMany field', async () => {
    await Field.repository.create({
      values: {
        name: 'tags',
        type: 'belongsToMany',
        collectionName: 'posts',
        interface: 'm2m',
        through: 'post_tags',
      },
      context: {},
    });

    const throughCollection = await Collection.repository.findOne({
      filter: {
        name: 'post_tags',
      },
    });

    expect(throughCollection.get('sortable')).toEqual(false);
  });
});
