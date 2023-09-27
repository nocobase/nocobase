import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';

describe('belongsToMany', () => {
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
        name: 'posts',
        fields: [{ type: 'string', name: 'title' }],
      },
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'tags',
        fields: [{ type: 'string', name: 'name' }],
      },
      context: {},
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should define belongs to many when change alias name', async () => {
    await Collection.repository.create({
      values: {
        name: 'a',
        fields: [{ type: 'bigInt', name: 'id', primaryKey: true, autoIncrement: true }],
      },
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'b',
        fields: [{ type: 'bigInt', name: 'id', primaryKey: true, autoIncrement: true }],
      },
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 't1',
        fields: [{ type: 'bigInt', name: 'id', primaryKey: true, autoIncrement: true }],
      },
      context: {},
    });

    const Through = db.getCollection('t1');

    let error;
    try {
      await Field.repository.create({
        values: {
          name: 't1',
          type: 'belongsToMany',
          target: 'b',
          through: 't1',
          collectionName: 'a',
          sourceKey: 'id',
          targetKey: 'id',
          foreignKey: 'a_id',
          otherKey: 'b_id',
        },
        context: {},
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();

    let error2;
    try {
      await Field.repository.create({
        values: {
          name: 'xxx',
          type: 'belongsToMany',
          target: 'b',
          through: 't1',
          collectionName: 'a',
          sourceKey: 'id',
          targetKey: 'id',
          foreignKey: 'a_id',
          otherKey: 'b_id',
        },
        context: {},
      });
    } catch (e) {
      error2 = e;
    }

    expect(error2).not.toBeDefined();
  });

  it('should create belongsToMany field', async () => {
    await Field.repository.create({
      values: {
        name: 'tags',
        type: 'belongsToMany',
        collectionName: 'posts',
        interface: 'm2m',
        through: 'post_tags',
      },
      context: {},
    });

    const throughCollection = await Collection.repository.findOne({
      filter: {
        name: 'post_tags',
      },
    });

    expect(throughCollection.get('sortable')).toEqual(false);
    const collectionManagerSchema = process.env.COLLECTION_MANAGER_SCHEMA;
    const mainSchema = process.env.DB_SCHEMA || 'public';

    if (collectionManagerSchema && mainSchema != collectionManagerSchema && db.inDialect('postgres')) {
      expect(throughCollection.get('schema')).toEqual(collectionManagerSchema);

      const tableName = db.getCollection('post_tags').model.tableName;

      const mainSchema = process.env.DB_SCHEMA || 'public';

      const tableExists = async (tableName: string, schema: string) => {
        const sql = `SELECT EXISTS(SELECT 1 FROM information_schema.tables
                 WHERE  table_schema = '${schema}'
                 AND    table_name   = '${tableName}')`;

        const results = await db.sequelize.query(sql, { type: 'SELECT' });

        const exists = results[0]['exists'];
        return exists;
      };

      expect(await tableExists(tableName, collectionManagerSchema)).toBe(true);
      expect(await tableExists(tableName, mainSchema)).toBe(false);
    }
  });

  it('should belongs to many fields after through collection destroyed', async () => {
    await Field.repository.create({
      values: {
        name: 'tags',
        type: 'belongsToMany',
        collectionName: 'posts',
        interface: 'm2m',
        through: 'post_tags',
      },
      context: {},
    });

    const throughCollection = await Collection.repository.findOne({
      filter: {
        name: 'post_tags',
      },
    });

    await db.getRepository('posts').create({
      values: [
        {
          title: 'p1',
          tags: [{ name: 't1' }],
        },
        {
          title: 'p2',
          tags: [{ name: 't2' }],
        },
      ],
    });

    await throughCollection.destroy();

    expect(
      await Field.repository.count({
        filter: {
          name: 'tags',
          collectionName: 'posts',
        },
      }),
    ).toEqual(0);
  });
});
