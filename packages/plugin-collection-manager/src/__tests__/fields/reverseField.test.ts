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
    await app.db.sync();
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
});
