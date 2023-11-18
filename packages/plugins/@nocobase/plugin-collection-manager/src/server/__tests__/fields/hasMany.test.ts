import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';

describe('hasMany field options', () => {
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
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'foos',
      },
      context: {},
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create fields with sortable option', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'foos',
        sortable: true,
        foreignKey: 'test_id',
      },
      context: {},
    });

    await field.reload();
    expect(field.get('sortable')).toBe(true);
    expect(field.get('sortBy')).toBe('test_idSort');
  });

  it('should update field with sortable option', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'foos',
        foreignKey: 'test_id',
      },
      context: {},
    });

    await field.reload();

    expect(field.get('sortBy')).toBe(undefined);

    await Field.repository.update({
      values: {
        sortable: true,
      },
      filter: {
        key: field.get('key'),
      },
      context: {},
    });

    await field.reload();

    expect(field.get('sortBy')).toBe('test_idSort');
    const collection = db.getCollection('foos');
    const columns = await db.sequelize.getQueryInterface().describeTable(collection.getTableNameWithSchema());
    expect(columns).toHaveProperty(collection.model.rawAttributes['test_idSort'].field);
  });

  it('should generate the foreignKey randomly', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'foos',
      },
    });
    await field.reload();
    const json = field.toJSON();
    expect(json).toMatchObject({
      type: 'hasMany',
      collectionName: 'tests',
      target: 'foos',
      sourceKey: 'id',
      targetKey: 'id',
    });
    expect(json.name).toBeDefined();
    expect(json.foreignKey).toBeDefined();
  });

  it('the parameters are not generated randomly', async () => {
    const field = await Field.repository.create({
      values: {
        name: 'foos',
        type: 'hasMany',
        collectionName: 'tests',
        target: 'foos',
        sourceKey: 'abc',
        foreignKey: 'def',
        targetKey: 'ghi',
      },
    });
    await field.reload();
    expect(field.toJSON()).toMatchObject({
      name: 'foos',
      type: 'hasMany',
      collectionName: 'tests',
      target: 'foos',
      sourceKey: 'abc',
      foreignKey: 'def',
      targetKey: 'ghi',
    });
  });
});
