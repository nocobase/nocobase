import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';

describe('reverseField options', () => {
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
        name: 'targets',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('reverseField', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'targets',
        reverseField: {},
      },
    });
    const json = JSON.parse(JSON.stringify(field.toJSON()));
    expect(json).toMatchObject({
      type: 'hasMany',
      collectionName: 'tests',
      target: 'targets',
      targetKey: 'id',
      sourceKey: 'id',
      reverseField: {
        type: 'belongsTo',
        collectionName: 'targets',
        target: 'tests',
        targetKey: 'id',
        sourceKey: 'id',
      },
    });
    expect(json.foreignKey).toBe(json.reverseField.foreignKey);
  });

  it('should sync onDelete options for reverse field', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'targets',
        onDelete: 'CASCADE',
        reverseField: {},
      },
    });

    const { reverseField } = field.toJSON();

    expect(reverseField.onDelete).toBe('CASCADE');
  });

  it('should update reverseField onDelete options', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'targets',
        onDelete: 'CASCADE',
        reverseField: {},
      },
    });

    const { reverseField } = field.toJSON();

    await Field.repository.update({
      filterByTk: reverseField.key,
      values: {
        onDelete: 'SET NULL',
      },
    });

    const mainField = await Field.repository.findOne({
      filterByTk: field.get('key'),
    });

    expect(mainField.get('onDelete')).toBe('SET NULL');
  });

  it('should update reverseField', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'targets',
        reverseField: {},
      },
    });

    expect(
      await Field.repository.count({
        filter: {
          collectionName: 'targets',
        },
      }),
    ).toEqual(1);

    let reverseField = await Field.repository.findOne({
      filter: {
        collectionName: 'targets',
      },
    });

    let err;

    try {
      await Field.repository.update({
        filterByTk: field.get('key') as string,
        values: {
          reverseField: {
            uiSchema: {
              title: '123',
            },
          },
        },
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();

    await Field.repository.update({
      filterByTk: field.get('key') as string,
      values: {
        reverseField: {
          key: reverseField.get('key'),
          uiSchema: {
            title: '123',
          },
        },
      },
    });

    expect(
      await Field.repository.count({
        filter: {
          collectionName: 'targets',
        },
      }),
    ).toEqual(1);

    reverseField = await db.getRepository('fields').findOne({
      filter: {
        key: reverseField.get('key'),
      },
      appends: ['uiSchema'],
    });

    const uiSchema = reverseField.get('uiSchema');
    expect(uiSchema['schema']).toEqual({ title: '123' });
  });
});
