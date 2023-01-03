import Database, { Collection as DBCollection, HasManyRepository } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';

describe('collections repository', () => {
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

  it('can remove fields', async () => {
    const collection = await Collection.repository.create({
      values: {
        name: 'posts',
        fields: [
          { type: 'string', name: 'f1' },
          { type: 'string', name: 'f2' },
        ],
      },
    });

    const fields = await Field.repository.find();

    await (Collection.repository.relation('fields').of('posts') as HasManyRepository).destroy({
      filterByTk: fields.map((f) => f.get('key')),
    });

    expect(await Field.repository.count()).toEqual(0);
  });
});
