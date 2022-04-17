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
    await app.db.sync();
    db = app.db;
    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
  });

  afterEach(async () => {
    await app.destroy();
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
});
