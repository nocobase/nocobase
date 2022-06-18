import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';

describe('collections repository', () => {
  let db: Database;
  let app: Application;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    app = await createApp();
    await app.db.sync();
    db = app.db;
    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should remove association field after collection destroy', async () => {
    await Collection.repository.create({
      context: {},
      values: {
        name: 'posts',
        fields: [{ type: 'hasMany', name: 'comments', target: 'comments' }],
      },
    });

    await Collection.repository.create({
      context: {},
      values: {
        name: 'comments',
        fields: [{ type: 'string', name: 'content' }],
      },
    });

    await db.getRepository('collections').destroy({
      filter: {
        name: 'comments',
      },
    });

    const fields = await db.getRepository('fields').find();

    expect(fields.length).toEqual(0);
  });
});
