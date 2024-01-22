import { createMockServer, MockServer } from '@nocobase/test';
import path from 'path';
import { Field } from '@nocobase/database';
import { DataTypes } from 'sequelize';

describe('database collections', () => {
  let app: MockServer;

  const getDatabaseAgent = (app: MockServer, databaseName: string) => {
    return app.agent().set('X-Database', databaseName) as any;
  };

  const getConnectionAgent = (app: MockServer, connectionName: string) => {
    return app.agent().set('X-Connection', connectionName) as any;
  };

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'database-connections'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get error when insert allow null false field', async () => {
    const storagePath = path.resolve(__dirname, './fixtures/test.sqlite');
    const res = await app
      .agent()
      .resource('databaseConnections')
      .create({
        values: {
          name: 'test',
          description: 'test database connection',
          dialect: 'sqlite',
          storage: storagePath,
        },
      });

    expect(res.status).toBe(200);

    const response = await getConnectionAgent(app, 'test').resource('example_table').create({
      values: {},
    });

    expect(response.status).toBe(400);
  });

  it('should copy extended field from main database', async () => {
    class CustomField extends Field {
      get dataType() {
        return DataTypes.STRING;
      }
    }

    app.db.registerFieldTypes({
      custom: CustomField,
    });

    expect(app.db.fieldTypes.get('custom')).toBe(CustomField);

    const storagePath = path.resolve(__dirname, '../fixtures/chinese-table-name.sqlite');
    await app
      .agent()
      .resource('databaseConnections')
      .create({
        values: {
          name: 'test',
          description: 'test database connection',
          dialect: 'sqlite',
          storage: storagePath,
        },
      });

    expect(app.getDb('test').fieldTypes.get('custom')).toBe(CustomField);
  });

  it('should refresh database connection', async () => {
    await app
      .agent()
      .resource('databaseConnections')
      .create({
        values: {
          name: 'test',
          description: 'test database connection',
          dialect: process.env.DB_DIALECT,
          host: process.env.DB_HOST,
          database: process.env.DB_DATABASE,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
        },
      });

    await app.db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'content',
            type: 'text',
          },
        ],
      },
      context: {},
    });

    expect(app.getDb('test').getCollection('posts')).toBeFalsy();

    // refresh
    const refreshResp = await app.agent().resource('databaseConnections').refresh({
      filterByTk: 'test',
    });

    expect(refreshResp.status).toBe(200);
    expect(app.getDb('test').getCollection('posts')).toBeTruthy();

    // list collections
    const collectionsListResp = await getDatabaseAgent(app, 'test').resource('remoteCollections').list({
      paginate: false,
    });

    expect(collectionsListResp.status).toBe(200);

    expect(app.getDb('test').getCollection('posts')).toBeTruthy();
  });

  it('should update database connection', async () => {
    const res = await app
      .agent()
      .resource('databaseConnections')
      .create({
        values: {
          name: 'test',
          description: 'test database connection',
          dialect: process.env.DB_DIALECT,
          host: process.env.DB_HOST,
          database: process.env.DB_DATABASE,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
        },
      });

    expect(res.status).toBe(200);

    const updateRes = await app
      .agent()
      .resource('databaseConnections')
      .update({
        filterByTk: 'test',
        values: {
          description: 'new description',
        },
      });

    expect(updateRes.status).toBe(200);
  });

  it('should list database collections in remote database', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'content',
            type: 'text',
          },
        ],
      },
      context: {},
    });

    await app.db.getRepository('posts').create({
      values: [
        {
          title: 'test1',
          content: 'test1',
        },
        {
          title: 'test2',
          content: 'test2',
        },
      ],
    });

    const localPostCollection = app.db.getCollection('posts');

    const createdAtAttribute = localPostCollection.model.rawAttributes.createdAt;
    const updatedAtAttribute = localPostCollection.model.rawAttributes.updatedAt;

    const databaseName = 'test1';

    // create database connection
    const res = await app
      .agent()
      .resource('databaseConnections')
      .create({
        values: {
          name: databaseName,
          description: 'test database connection',
          dialect: process.env.DB_DIALECT,
          host: process.env.DB_HOST,
          database: process.env.DB_DATABASE,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
        },
      });

    expect(res.status).toBe(200);

    // list connections
    const listRes = await app.agent().resource('databaseConnections').list();
    expect(listRes.status).toBe(200);

    // list collections in remote database
    // @ts-ignore
    const response = await getDatabaseAgent(app, databaseName).resource('remoteCollections').list({
      paginate: false,
    });

    expect(response.status).toBe(200);
    const data = response.body.data;

    const postCollection = data.find((item: any) => item.name === 'posts');

    expect(postCollection).toMatchObject({
      name: 'posts',
      tableName: 'posts',
      timestamps: false,
    });

    // find data
    const dataResponse = await getConnectionAgent(app, databaseName).resource('posts').list();
    expect(dataResponse.status).toBe(200);
    expect(dataResponse.body.meta.count).toEqual(2);

    // update field interface to createdAt/updatedAt
    await getDatabaseAgent(app, databaseName)
      .resource('remoteCollections.fields', postCollection.name)
      .update({
        filterByTk: createdAtAttribute.field,
        values: {
          interface: 'createdAt',
        },
      });

    await getDatabaseAgent(app, databaseName)
      .resource('remoteCollections.fields', postCollection.name)
      .update({
        filterByTk: updatedAtAttribute.field,
        values: {
          interface: 'updatedAt',
        },
      });

    // insert data
    const insertResponse = await getConnectionAgent(app, databaseName)
      .resource('posts')
      .create({
        values: {
          title: 'test3',
          content: 'test3',
        },
      });

    expect(insertResponse.status).toBe(200);
  });

  it('should connect to collection without id primary key', async () => {
    const storagePath = path.resolve(__dirname, './fixtures/table-without-id.sqlite');

    await app.db.getRepository('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    const dataResponse = await getConnectionAgent(app, 'test').resource('users').list();
    expect(dataResponse.status).toBe(200);

    const insertResponse = await getConnectionAgent(app, 'test')
      .resource('users')
      .create({
        values: {
          user_id: 'test_id',
        },
      });

    expect(insertResponse.status).toBe(200);
  });

  it('should connect to collection with auto incr field', async () => {
    const storagePath = path.resolve(__dirname, './fixtures/table-without-id.sqlite');

    await app.db.getRepository('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    const dataResponse = await getConnectionAgent(app, 'test').resource('users_auto_increment').list();
    expect(dataResponse.status).toBe(200);

    const insertResponse = await getConnectionAgent(app, 'test').resource('users_auto_increment').create({
      values: {},
    });

    expect(insertResponse.status).toBe(200);
  });
});
