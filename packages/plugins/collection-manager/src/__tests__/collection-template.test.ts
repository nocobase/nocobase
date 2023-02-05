import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';

describe('collection template', () => {
  let db: Database;
  let app: Application;
  let Collection: DBCollection;
  beforeEach(async () => {
    app = await createApp();

    db = app.db;
    Collection = db.getCollection('collections');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should call field afterCreate hook', async () => {
    const fn = jest.fn();

    db.collectionTemplate({
      name: 'transactionable',
      hooks: {
        async ['fields.afterCreate']() {
          fn();
        },
      },
    });

    Collection.repository.create({
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

    Collection.repository.create({
      values: {
        name: 'subCollection',
        template: 'transactionable',
      },
      context: {},
    });

    console.log(await app.db.getCollection('subCollection').repository.find());

    // const collection = app.db.getCollection('subCollection');

    // console.log({ collection });
    // db.getCollection('fields').repository.create({
    //   values: {
    //     type: 'belongsTo',
    //     name: 'belongsToMainCollection',
    //     target: 'mainCollection',
    //     foreignKey: 'mainCollectionId',
    //     collectionName: 'subCollection',
    //   },
    //   context: {},
    // });

    expect(fn).toHaveBeenCalled();
  });
});
