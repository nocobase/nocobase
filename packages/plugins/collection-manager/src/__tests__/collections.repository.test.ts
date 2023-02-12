import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';

describe('collections repository', () => {
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

  test('create underscored field', async () => {
    if (process.env.DB_UNDERSCORED !== 'true') {
      return;
    }

    const collection = await Collection.repository.create({
      values: {
        name: 'testCollection',
        createdAt: true,
        fields: [
          {
            type: 'date',
            field: 'createdAt',
            name: 'createdAt',
          },
        ],
      },
    });

    await collection.migrate();

    const testCollection = db.getCollection('testCollection');

    expect(testCollection.model.rawAttributes.createdAt.field).toEqual('created_at');
  });

  it('case 1', async () => {
    // 什么都没提供，随机 name 和 key
    const data = await Collection.repository.create({
      values: {},
    });
    expect(data.get('key')).toBeDefined();
    expect(data.get('name')).toBeDefined();
  });

  it('case 2', async () => {
    // 提供了 name
    const data = await Collection.repository.create({
      values: {
        name: 'tests',
      },
    });
    expect(data.toJSON()).toMatchObject({
      name: 'tests',
    });
  });

  it('case 3', async () => {
    // 动态参数，存 options 字段里
    const data = await Collection.repository.create({
      values: {
        name: 'tests',
        createdBy: true,
        updatedBy: true,
        timestamps: true,
      },
    });
    expect(data.toJSON()).toMatchObject({
      name: 'tests',
      createdBy: true,
      updatedBy: true,
      timestamps: true,
    });
    const [updated] = await Collection.repository.update({
      filterByTk: data.get('name') as any,
      values: {
        createdBy: false,
        updatedBy: false,
        timestamps: false,
      },
    });
    expect(updated.toJSON()).toMatchObject({
      name: 'tests',
      createdBy: false,
      updatedBy: false,
      timestamps: false,
    });
  });

  it('case 4', async () => {
    await Collection.repository.create({
      values: {
        name: 'tests',
        fields: [
          {
            type: 'uid',
            name: 'name',
            prefix: 'f_',
          },
          {
            type: 'string',
            unique: true,
          },
          {
            type: 'string',
            name: 'title',
            unique: true,
          },
          {
            type: 'belongsToMany',
            target: 'tests',
          },
          {
            type: 'belongsTo',
            target: 'foos',
          },
          {
            type: 'hasMany',
            target: 'foos',
          },
          {
            type: 'hasOne',
            target: 'foos',
          },
        ],
      },
    });

    const data = await Collection.repository.findOne({
      filter: {
        name: 'tests',
      },
      appends: ['fields'],
    });

    const json = data.get();
    json.fields = json.fields.sort((a, b) => a.sort - b.sort);
    expect(json.fields.length).toBe(7);
    expect(JSON.parse(JSON.stringify(json, null, 2))).toMatchObject({
      name: 'tests',
      fields: [
        {
          type: 'uid',
          name: 'name',
          prefix: 'f_',
        },
        {
          type: 'string',
          unique: true,
        },
        {
          type: 'string',
          name: 'title',
          unique: true,
        },
        {
          type: 'belongsToMany',
          target: 'tests',
        },
        {
          type: 'belongsTo',
          target: 'foos',
        },
        {
          type: 'hasMany',
          target: 'foos',
        },
        {
          type: 'hasOne',
          target: 'foos',
        },
      ],
    });
  });

  it('should not destroy column when column belongs to a field', async () => {
    if (db.options.underscored !== true) return;

    await Collection.repository.create({
      context: {},
      values: {
        name: 'tests',
        fields: [
          {
            type: 'string',
            name: 'test_field',
          },
          {
            type: 'string',
            name: 'testField',
          },
          {
            type: 'string',
            name: 'otherField',
          },
        ],
      },
    });

    const testCollection = db.getCollection('tests');

    expect(
      testCollection.model.rawAttributes.test_field.field === testCollection.model.rawAttributes.testField.field,
    ).toBe(true);
    const getTableInfo = async () =>
      await db.sequelize.getQueryInterface().describeTable(testCollection.model.tableName);

    const tableInfo0 = await getTableInfo();

    expect(tableInfo0['other_field']).toBeDefined();

    await Field.repository.destroy({
      context: {},
      filter: {
        name: 'otherField',
      },
    });

    const tableInfo1 = await getTableInfo();
    expect(tableInfo1['other_field']).not.toBeDefined();

    await Field.repository.destroy({
      context: {},
      filter: {
        name: 'testField',
      },
    });

    const tableInfo2 = await getTableInfo();
    expect(tableInfo2['test_field']).toBeDefined();

    await Field.repository.destroy({
      context: {},
      filter: {
        name: 'test_field',
      },
    });

    const tableInfo3 = await getTableInfo();
    expect(tableInfo3['test_field']).not.toBeDefined();
  });
});
