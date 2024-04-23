import Database, { Collection as DBCollection, CollectionGroupManager, HasManyRepository } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';
import CollectionManagerPlugin, { CollectionRepository } from '../index';

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

  it('should load through table with foreignKey', async () => {
    await Collection.repository.create({
      values: {
        name: 'postsTags',
        autoGenId: false,
        fields: [
          {
            type: 'integer',
            name: 'postId',
            primaryKey: true,
          },
          {
            type: 'integer',
            name: 'tagId',
            primaryKey: true,
          },
          {
            type: 'boolean',
            name: 'default',
          },
        ],
      },
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'belongsToMany',
            target: 'tags',
            name: 'tags',
            through: 'postsTags',
            foreignKey: 'postId',
            otherKey: 'tagId',
            sourceKey: 'id',
            targetKey: 'id',
          },
        ],
      },
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'tags',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'belongsToMany',
            target: 'posts',
            name: 'posts',
            through: 'postsTags',
            foreignKey: 'tagId',
            otherKey: 'postId',
            sourceKey: 'id',
            targetKey: 'id',
          },
        ],
      },
      context: {},
    });

    const postsCollection = db.getCollection('posts');

    const p1 = await postsCollection.repository.create({
      values: {
        title: 'test',
        tags: [
          {
            name: 't1',
          },
          {
            name: 't2',
          },
        ],
      },
    });

    const throughCollection = db.getCollection('postsTags');
    console.log(throughCollection.model.primaryKeyAttributes);

    await throughCollection.repository.update({
      filter: {
        postId: p1.get('id'),
      },
      values: {
        default: true,
      },
    });
  });

  it('should create collection with optional duplicator option', async () => {
    await Collection.repository.create({
      values: {
        name: 'tests',
        dumpRules: {
          group: 'business',
        },
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      },
      context: {},
    });

    const testsCollection = db.getCollection('tests');

    const duplicator = CollectionGroupManager.unifyDumpRules(testsCollection.options.dumpRules);
    expect(duplicator.group).toEqual('business');
  });

  it('should create collection with required duplicator option', async () => {
    await Collection.repository.create({
      values: {
        name: 'tests',
        dumpRules: {
          group: 'required',
        },
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      },
      context: {},
    });

    const testsCollection = db.getCollection('tests');

    const duplicator = CollectionGroupManager.unifyDumpRules(testsCollection.options.dumpRules);
    expect(duplicator.group).toEqual('required');
  });

  it('should create collection with sortable option', async () => {
    await Collection.repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
        sortable: true,
      },
      context: {},
    });

    expect(db.getCollection('posts').getField('sort')).toBeTruthy();
  });

  it('should create through table when pending fields', async () => {
    await Collection.repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'belongsToMany',
            target: 'tags',
            name: 'tags',
            through: 'posts_tags',
            foreignKey: 'post_id',
            otherKey: 'tag_id',
            sourceKey: 'id',
            targetKey: 'id',
          },
        ],
      },
      context: {},
    });

    const postsCollection = db.getCollection('posts');
    expect(postsCollection).toBeTruthy();

    await Collection.repository.create({
      values: {
        name: 'tags',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    const throughCollection = db.getCollection('posts_tags');
    expect(throughCollection).toBeTruthy();

    expect(await throughCollection.existsInDb()).toBeTruthy();
    const rawAttribute = throughCollection.model.rawAttributes['tag_id'].field;
    const columns = await db.sequelize.getQueryInterface().describeTable(throughCollection.getTableNameWithSchema());
    expect(columns[rawAttribute]).toBeDefined();
  });

  it('should create collections with array', async () => {
    await Collection.repository.create({
      values: [
        {
          name: 'users',
          fields: [
            {
              type: 'string',
              name: 'username',
            },
            {
              type: 'hasMany',
              target: 'posts',
              name: 'posts',
            },
            {
              type: 'hasOne',
              target: 'profiles',
              name: 'profile',
            },
          ],
        },
        {
          name: 'profiles',
          fields: [
            {
              type: 'string',
              name: 'nickname',
            },
            {
              type: 'belongsTo',
              target: 'users',
              name: 'user',
            },
          ],
        },
        {
          name: 'posts',
          fields: [
            {
              type: 'string',
              name: 'title',
            },
            {
              type: 'belongsToMany',
              target: 'tags',
              name: 'tags',
              through: 'posts_tags',
              foreignKey: 'post_id',
              otherKey: 'tag_id',
              sourceKey: 'id',
              targetKey: 'id',
            },
          ],
        },
        {
          name: 'tags',
          fields: [
            {
              type: 'string',
              name: 'name',
            },
            {
              type: 'belongsToMany',
              target: 'posts',
              name: 'posts',
              through: 'posts_tags',
              foreignKey: 'tag_id',
              otherKey: 'post_id',
              sourceKey: 'id',
              targetKey: 'id',
            },
          ],
        },
      ],
      context: {},
    });

    const postsCollection = db.getCollection('posts');
    expect(postsCollection).toBeTruthy();

    const tagsCollection = db.getCollection('tags');
    expect(tagsCollection).toBeTruthy();

    const usersCollection = db.getCollection('users');
    expect(usersCollection).toBeTruthy();

    const profilesCollection = db.getCollection('profiles');
    expect(profilesCollection).toBeTruthy();

    await usersCollection.repository.create({
      values: {
        username: 'admin',
        profile: {
          nickname: '管理员',
        },
        posts: [
          {
            title: 'test',
            tags: [
              {
                name: 'test',
              },
            ],
          },
        ],
      },
    });
  });

  it('should create collection with description', async () => {
    const description = 'this collection is for tests';
    await Collection.repository.create({
      values: {
        name: 'posts',
        description,
      },
      context: {},
    });

    const postsCollection = db.getCollection('posts');
    expect(postsCollection.options.description).toEqual(description);
  });

  it('should extend collections collection', async () => {
    expect(db.getRepository<CollectionRepository>('collections')).toBeTruthy();

    db.extendCollection({
      name: 'collections',
      fields: [{ type: 'string', name: 'tests' }],
    });

    expect(Collection.getField('tests')).toBeTruthy();
    const afterRepository = db.getRepository<CollectionRepository>('collections');

    expect(afterRepository.load).toBeTruthy();
  });

  it('should set collection schema from env', async () => {
    if (!db.inDialect('postgres')) {
      return;
    }

    const plugin = app.getPlugin<CollectionManagerPlugin>('collection-manager');
    plugin.schema = 'testSchema';

    await Collection.repository.create({
      values: {
        name: 'posts',
      },
      context: {},
    });

    const postsCollection = db.getCollection('posts');
    expect(postsCollection.options.schema).toEqual('testSchema');

    await Collection.repository.create({
      values: {
        name: 'tags',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'posts',
        type: 'belongsToMany',
        target: 'posts',
        through: 'posts_tags',
        foreignKey: 'tag_id',
        otherKey: 'post_id',
        interface: 'm2m',
        collectionName: 'tags',
      },
      context: {},
    });

    const throughCollection = db.getCollection('posts_tags');
    expect(throughCollection.options.schema).toEqual('testSchema');
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

  it('should destroy when fields refer to the same field', async () => {
    await Collection.repository.create({
      context: {},
      values: {
        name: 'tests',
        timestamps: true,
        fields: [
          {
            type: 'date',
            name: 'dateA',
          },
          {
            type: 'date',
            name: 'date_a',
          },
        ],
      },
    });

    const testCollection = db.getCollection('tests');
    const getTableInfo = async () =>
      await db.sequelize.getQueryInterface().describeTable(testCollection.getTableNameWithSchema());

    const tableInfo0 = await getTableInfo();
    expect(tableInfo0['date_a']).toBeDefined();

    await Field.repository.destroy({
      context: {},
      filter: {
        name: ['dateA', 'date_a'],
      },
    });

    const count = await Field.repository.count();
    expect(count).toBe(0);
    const tableInfo1 = await getTableInfo();
    expect(tableInfo1['dateA']).not.toBeDefined();
    expect(tableInfo1['date_a']).not.toBeDefined();
  });

  it('should not destroy timestamps columns', async () => {
    const createdAt = db.options.underscored ? 'created_at' : 'createdAt';
    await Collection.repository.create({
      context: {},
      values: {
        name: 'tests',
        timestamps: true,
        fields: [
          {
            type: 'date',
            name: 'createdAt',
          },
        ],
      },
    });

    const testCollection = db.getCollection('tests');
    const getTableInfo = async () =>
      await db.sequelize.getQueryInterface().describeTable(testCollection.getTableNameWithSchema());

    const tableInfo0 = await getTableInfo();
    expect(tableInfo0[createdAt]).toBeDefined();

    await Field.repository.destroy({
      context: {},
      filter: {
        name: 'createdAt',
      },
    });

    const tableInfo1 = await getTableInfo();
    expect(tableInfo1[createdAt]).toBeDefined();
    expect(testCollection.hasField('createdAt')).toBeFalsy();
    expect(testCollection.model.rawAttributes['createdAt']).toBeDefined();
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
            name: 'test123',
            field: 'test_field',
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
      await db.sequelize.getQueryInterface().describeTable(testCollection.getTableNameWithSchema());

    const tableInfo0 = await getTableInfo();

    expect(tableInfo0['other_field']).toBeDefined();

    await Field.repository.destroy({
      context: {},
      filter: {
        name: 'otherField',
      },
    });

    expect(testCollection.model.rawAttributes['otherField']).toBeUndefined();
    const tableInfo1 = await getTableInfo();
    expect(tableInfo1['other_field']).not.toBeDefined();

    await Field.repository.destroy({
      context: {},
      filter: {
        name: 'testField',
      },
    });

    expect(testCollection.model.rawAttributes['testField']).toBeUndefined();
    const tableInfo2 = await getTableInfo();
    expect(tableInfo2['test_field']).toBeDefined();

    await Field.repository.destroy({
      context: {},
      filter: {
        name: 'test_field',
      },
    });

    const tableInfo3 = await getTableInfo();
    expect(tableInfo3['test_field']).toBeDefined();

    await Field.repository.destroy({
      context: {},
      filter: {
        name: 'test123',
      },
    });

    const tableInfo4 = await getTableInfo();
    expect(tableInfo4['test_field']).not.toBeDefined();
  });

  it('should destroy relation field after foreignKey destroyed', async () => {
    await Collection.repository.create({
      context: {},
      values: {
        name: 'c1Z',
        fields: [
          {
            type: 'integer',
            name: 'a',
          },
        ],
      },
    });

    await Collection.repository.create({
      context: {},
      values: {
        name: 'c2Z',
      },
    });

    await Field.repository.create({
      values: {
        name: 'g1',
        foreignKey: 'a',
        target: 'c2Z',
        type: 'belongsTo',
        collectionName: 'c1Z',
        interface: 'm2o',
      },
      context: {},
    });

    const foreignKey = await Field.repository.findOne({
      filter: {
        collectionName: 'c1Z',
        name: 'a',
      },
    });

    expect(foreignKey.get('isForeignKey')).toBeTruthy();

    await Field.repository.destroy({
      filter: {
        name: 'a',
      },
      context: {},
    });

    expect(await Field.repository.findOne({ filter: { name: 'g1' } })).toBeFalsy();
  });

  it('should create field normal when repeat create and destroy', async () => {
    const c1Z = await Collection.repository.create({
      values: {
        name: 'c1Z',
      },
      context: {},
    });

    const c2Z = await Collection.repository.create({
      values: {
        name: 'c2Z',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'a',
        type: 'integer',
        collectionName: 'c1Z',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'b',
        type: 'integer',
        collectionName: 'c1Z',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'g1',
        type: 'belongsTo',
        target: 'c2Z',
        foreignKey: 'a',
        collectionName: 'c1Z',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'g2',
        type: 'belongsTo',
        target: 'c2Z',
        foreignKey: 'b',
        collectionName: 'c1Z',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'g3',
        type: 'belongsTo',
        target: 'c2Z',
        foreignKey: 'a',
        collectionName: 'c1Z',
        interface: 'm2o',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'g1',
        type: 'hasMany',
        target: 'c1Z',
        foreignKey: 'a',
        collectionName: 'c2Z',
        interface: 'o2m',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'g2',
        type: 'hasMany',
        target: 'c1Z',
        foreignKey: 'b',
        collectionName: 'c2Z',
        interface: 'o2m',
      },
      context: {},
    });

    await Field.repository.destroy({
      filter: {
        collectionName: 'c1Z',
        name: ['a', 'b'],
      },
      context: {},
    });

    expect(await Field.repository.count()).toBe(0);

    await Field.repository.create({
      values: {
        name: 'g5',
        type: 'belongsTo',
        target: 'c2Z',
        foreignKey: 'a1',
        collectionName: 'c1Z',
        interface: 'm2o',
      },
      context: {},
    });

    expect(await Field.repository.count()).toBe(2);
  });

  it('should destroy field when collection set to difference schema', async () => {
    if (db.sequelize.getDialect() !== 'postgres') {
      return;
    }

    const collection = await Collection.repository.create({
      values: {
        name: 'test',
        schema: 'test_schema',
      },
      context: {},
    });

    const field = await Field.repository.create({
      values: {
        name: 'test_field',
        type: 'string',
        collectionName: collection.get('name'),
      },
      context: {},
    });

    let err;
    try {
      await Field.repository.destroy({
        filter: {
          name: field.get('name'),
        },
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeFalsy();
  });

  it('should update association field', async () => {
    const A = await Collection.repository.create({
      values: {
        name: 'a',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'bs',
            type: 'hasMany',
            uiSchema: {
              title: 'bs-title',
            },
          },
        ],
      },
      context: {},
    });

    const B = await Collection.repository.create({
      values: {
        name: 'b',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'belongsTo',
            name: 'a',
          },
        ],
        uiSchema: {
          title: 'b-title',
        },
      },
      context: {},
    });

    const C = await Collection.repository.create({
      values: {
        name: 'c',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'belongsTo',
            name: 'a',
          },
        ],
        uiSchema: {
          title: 'c-title',
        },
      },
      context: {},
    });

    await db.sync();

    await db.getRepository<HasManyRepository>('collections.fields', 'c').update({
      filterByTk: 'a',
      values: {
        key: C.key,
        collectionName: 'c',
        uiSchema: {
          title: 'c-hello-world',
        },
      },
    });
  });
});
