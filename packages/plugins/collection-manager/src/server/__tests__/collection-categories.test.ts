import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from './index';

describe('Collection categories', () => {
  let db: Database;
  let app: Application;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    app = await createApp({
      database: { tablePrefix: '' },
    });
    db = app.db;
    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create collection categories', async () => {
    const category = await db.getRepository('collectionCategories').create({
      values: {
        color: 'green',
        name: 'test',
      },
    });

    const category2 = await db.getRepository('collectionCategories').create({
      values: {
        color: 'yellow',
        name: 'test2',
      },
    });

    const category3 = await db.getRepository('collectionCategories').create({
      values: {
        color: 'red',
        name: 'test3',
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'testCollection',
        category: [category.get('id'), category2.get('id')],
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'testCollection2',
        category: [category3.get('id'), category2.get('id')],
      },
    });

    const list = await db.getRepository('collections').find({
      fields: ['category.name', 'key'],
      filter: {
        name: 'testCollection',
      },
    });

    expect(list[0].get('category').length).toBe(2);
  });
});
