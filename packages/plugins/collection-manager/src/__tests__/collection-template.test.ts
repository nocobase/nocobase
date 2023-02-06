import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';

describe('collection template', () => {
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

  it('should call field afterCreate hook', async () => {
    const fn = jest.fn();

    db.collectionTemplate({
      name: 'transactionable',
      hooks: {
        async ['fields.afterCreate'](...args) {
          console.log({ args });
          fn();
        },
      },
    });

    await Collection.repository.create({
      values: {
        name: 'mainCollection',
        fields: [
          {
            type: 'string',
            name: 'mainField',
          },
        ],
      },
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'subCollection',
        template: 'transactionable',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'subField',
        collectionName: 'subCollection',
        type: 'string',
      },
    });

    expect(fn).toHaveBeenCalled();
  });
});
