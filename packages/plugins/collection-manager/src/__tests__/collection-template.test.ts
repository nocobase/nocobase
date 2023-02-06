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

  it('should create relation records after create association field', async () => {
    db.collectionTemplate({
      name: 'transactionable',
      hooks: {
        async ['fields.afterCreate'](model, options) {
          const fieldOptions = model.get();
          const collectionName = fieldOptions['collectionName'];
          const fieldName = fieldOptions['name'];

          const collection = db.getCollection(collectionName);
          const field = collection.getField(fieldName);

          if (field.type === 'belongsTo' && field.options.target == 'mainCollection') {
            const mainRecords = await db.getCollection('mainCollection').repository.find({
              transaction: options.transaction,
            });
            for (const mainRecord of mainRecords) {
              await db.getCollection('subCollection').repository.create({
                values: {
                  [fieldName]: mainRecord.id,
                },
                transaction: options.transaction,
              });
            }
          }
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

    await db.getCollection('mainCollection').repository.create({
      values: [
        {
          mainField: 'mainField1',
        },
        {
          mainField: 'mainField2',
        },
      ],
    });

    expect(await db.getCollection('mainCollection').repository.count()).toBe(2);

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
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'mainField',
        target: 'mainCollection',
        collectionName: 'subCollection',
        type: 'belongsTo',
      },
      context: {},
    });

    expect(await db.getCollection('subCollection').repository.count()).toBe(2);
  });
});
