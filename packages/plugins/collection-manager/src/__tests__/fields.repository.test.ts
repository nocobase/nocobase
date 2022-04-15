import Database, { Collection as DBCollection, StringFieldOptions } from '@nocobase/database';
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
    await Collection.repository.create({
      values: {
        name: 'bars',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should generate the name and key randomly', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'string',
        collectionName: 'tests',
      },
    });
    expect(field.toJSON()).toMatchObject({
      type: 'string',
      collectionName: 'tests',
    });
    expect(field.get('name')).toBeDefined();
    expect(field.get('key')).toBeDefined();
  });

  it('should not generate the name randomly', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'string',
        name: 'name',
        collectionName: 'tests',
      },
    });
    expect(field.toJSON()).toMatchObject({
      type: 'string',
      name: 'name',
      collectionName: 'tests',
    });
  });

  it('dynamic parameters', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'string',
        name: 'name',
        collectionName: 'tests',
        unique: true,
        defaultValue: 'abc',
      } as StringFieldOptions,
    });
    expect(field.toJSON()).toMatchObject({
      type: 'string',
      name: 'name',
      collectionName: 'tests',
      unique: true,
      defaultValue: 'abc',
    });
  });
});
