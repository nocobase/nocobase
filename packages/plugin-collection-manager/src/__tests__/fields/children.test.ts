import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';

describe('children options', () => {
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
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('when there are no children, the target collection is not created', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
      },
    });
    const json = field.toJSON();
    expect(json).toMatchObject({
      type: 'hasMany',
      collectionName: 'tests',
      sourceKey: 'id',
      targetKey: 'id',
    });
    expect(json.name).toBeDefined();
    expect(json.target).toBeDefined();
    expect(json.foreignKey).toBeDefined();
    // 无 children 时，target collection 不创建
    const target = await Collection.model.findOne({
      where: {
        name: json.target,
      },
    });
    expect(target).toBeNull();
  });

  it('the collectionName of the child field is the target of the parent field', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        children: [{ type: 'string' }, { type: 'string' }],
      },
    });
    const json = field.toJSON();
    const target = await Collection.model.findOne({
      where: {
        name: json.target,
      },
    });
    expect(target).toBeDefined();
    // 子字段的 collectionName 是父字段的 target
    for (const child of json.children) {
      expect(child.collectionName).toBe(json.target);
    }
  });
});
