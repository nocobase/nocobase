import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';

describe('hasOne field options', () => {
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
        name: 'foos',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should generate the foreignKey randomly', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasOne',
        collectionName: 'tests',
        target: 'foos',
      },
    });
    const json = field.toJSON();
    // hasOne 的 sourceKey 默认为 id，foreignKey 随机生成
    expect(json).toMatchObject({
      type: 'hasOne',
      collectionName: 'tests',
      target: 'foos',
      sourceKey: 'id',
    });
    expect(json.name).toBeDefined();
    expect(json.foreignKey).toBeDefined();
  });

  it('the parameters are not generated randomly', async () => {
    const field = await Field.repository.create({
      values: {
        name: 'foo',
        type: 'hasOne',
        collectionName: 'tests',
        target: 'foos',
        sourceKey: 'abc',
        foreignKey: 'def',
      },
    });
    expect(field.toJSON()).toMatchObject({
      name: 'foo',
      type: 'hasOne',
      collectionName: 'tests',
      target: 'foos',
      sourceKey: 'abc',
      foreignKey: 'def',
    });
  });
});
