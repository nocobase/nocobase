import { createMockServer, MockServer } from '@nocobase/test';
import { createApp } from '../helper';
import path from 'path';

describe('remote collection', () => {
  let app: MockServer;

  const getDatabaseAgent = (app: MockServer, databaseName: string) => {
    return app.agent().set('X-Database', databaseName) as any;
  };

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'database-connections'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get unsupported fields', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');
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

    const collectionInfo = await getDatabaseAgent(app, 'test').resource('remoteCollections').list({});

    const blobCollection = collectionInfo.body.data.find((item: any) => item.name === 'blob_table');
    console.log('blobCollection', blobCollection);

    expect(blobCollection.unsupportedFields.length).toBe(1);
  });

  it('get field options', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');
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

    const response = await getDatabaseAgent(app, 'test').resource('remoteCollections.fields', 'Users').get({
      filterByTk: 'id',
    });

    expect(response.status).toBe(200);

    const data = response.body.data;

    expect(data.type).toBe('integer');
    expect(data).toMatchObject({
      name: 'id',
      type: 'integer',
    });
  });

  it('should update filed ui schema', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');

    await app.db.getRepository('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    const adminAgent: any = getDatabaseAgent(app, 'test');

    const getEmailUiSchema = async () => {
      const fieldList = await adminAgent.resource('remoteCollections.fields', 'Users').list({});
      return fieldList.body.data.find((item: any) => item.name === 'email').uiSchema;
    };

    // update
    await adminAgent.resource('remoteCollections.fields', 'Users').update({
      filterByTk: 'email',
      values: {
        interface: 'email',
        uiSchema: {
          title: 'namexxx',
          'x-component': 'Input',
          'x-target': true,
          'x-validator': 'email',
        },
      },
    });

    const databaseConnectionRep = await adminAgent.resource('databaseConnections').list({
      appends: ['collections'],
    });

    const connectionData = databaseConnectionRep.body.data.find((item: any) => item.name === 'test');
    const UsersCollectionData = connectionData.collections.find((item: any) => item.name === 'Users');
    const emailFieldData = UsersCollectionData.fields.find((item: any) => item.name === 'email');
    expect(emailFieldData.uiSchema.title).toBe('namexxx');

    await adminAgent.resource('remoteCollections.fields', 'Users').update({
      filterByTk: 'email',
      values: {
        interface: 'input',
        uiSchema: {
          'x-component': 'Input',
        },
      },
    });

    const emailUiSchema2 = await getEmailUiSchema();

    expect(emailUiSchema2).toEqual({
      'x-component': 'Input',
    });
  });

  it('should destroy fields', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');
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

    await getDatabaseAgent(app, 'test')
      .resource('remoteCollections.fields', 'Articles')
      .create({
        values: {
          name: 'user',
          type: 'belongsTo',
          foreignKey: 'user_id',
          targetKey: 'id',
        },
      });

    const remoteBelongsToField = app.getDb('test').getCollection('Articles').getField('user');
    expect(remoteBelongsToField).toBeTruthy();

    const destroyFieldResponse = await getDatabaseAgent(app, 'test')
      .resource('remoteCollections.fields', 'Articles')
      .destroy({
        filterByTk: 'user',
      });

    expect(destroyFieldResponse.status).toBe(200);

    const remoteBelongsToField2 = app.getDb('test').getCollection('Articles').getField('user');
    expect(remoteBelongsToField2).toBeFalsy();
  });

  it('should list collections without pagination', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/chinese-table-name.sqlite');
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

    const response = await getDatabaseAgent(app, 'test').resource('remoteCollections').list({
      paginate: false,
    });

    const body = response.body;

    expect(body.data.length).toBe(3);
  });

  it('should update remote collection', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');
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

    const updateResponse = await getDatabaseAgent(app, 'test')
      .resource('remoteCollections')
      .update({
        filterByTk: 'Users',
        values: {
          title: 'testUser',
        },
      });

    expect(updateResponse.status).toBe(200);

    const updateResponse2 = await getDatabaseAgent(app, 'test')
      .resource('remoteCollections')
      .update({
        filterByTk: 'Users',
        values: {
          uiSchema: {
            title: 'testUser',
          },
        },
      });

    expect(updateResponse2.status).toBe(200);

    const fieldsListResponse = await getDatabaseAgent(app, 'test').resource('remoteCollections.fields', 'Users').list();

    expect(fieldsListResponse.status).toBe(200);
  });

  it('should list collections with paginate', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/chinese-table-name.sqlite');
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

    const response = await getDatabaseAgent(app, 'test').resource('remoteCollections').list({
      pageSize: 1,
    });

    const body = response.body;

    expect(body.data.length).toBe(1);
    expect(body.meta.count).toBe(3);
  });

  it('should connection to database with chinese table name', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/chinese-table-name.sqlite');
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

    const users = await app.getDb('test').getRepository('用户').find();
    expect(users.length).toBe(2);
  });

  it('should set local data', async () => {
    // create table with id auto increment
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

    // get collection info
    const response = await getDatabaseAgent(app, databaseName).resource('remoteCollections').list();

    expect(response.status).toBe(200);
    const postCollection = response.body.data.find((item: any) => item.name === 'posts');
    expect(postCollection.timestamps).toBeFalsy();

    const updateResponse = await getDatabaseAgent(app, databaseName)
      .resource('remoteCollections.fields', postCollection.name)
      .update({
        filterByTk: createdAtAttribute.field,
        values: {
          interface: 'createdAt',
        },
      });

    expect(updateResponse.status).toBe(200);

    // should save interface options into local database
    const localFieldInfo = await app.db.getRepository('remoteFields').findOne({
      filter: {
        name: createdAtAttribute.field,
        collectionName: postCollection.name,
      },
    });

    expect(localFieldInfo).toBeTruthy();
    expect(localFieldInfo.get('interface')).toBe('createdAt');

    const localRemotePostCollection = app.getDb('test1').getCollection('posts');
    const field = localRemotePostCollection.getField(createdAtAttribute.field);
    expect(field.options.interface).toBe('createdAt');

    // should save collection options
    const updateCollectionResponse = await getDatabaseAgent(app, databaseName)
      .resource('remoteCollections')
      .update({
        filter: {
          name: postCollection.name,
        },
        values: {
          title: '测试标题',
        },
      });

    expect(updateCollectionResponse.status).toBe(200);

    const remoteDatabase = app.getDb(databaseName);
    const remotePostCollection = remoteDatabase.getCollection('posts');
    expect(remotePostCollection.options.title).toBe('测试标题');
  });

  it('should load collections after app started', async () => {
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

    const localPostCollection = app.db.getCollection('posts');

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

    const updateCollectionResponse = await getDatabaseAgent(app, databaseName)
      .resource('remoteCollections')
      .update({
        filter: {
          name: localPostCollection.name,
        },
        values: {
          title: '测试标题',
        },
      });

    expect(updateCollectionResponse.status).toBe(200);

    const app2 = await createApp({ clean: false, name: 'app2' });
    const app2DbTest1 = app2.getDb(databaseName);
    expect(app2DbTest1).toBeTruthy();

    const app2PostCollection = app2DbTest1.getCollection('posts');
    expect(app2PostCollection.options.title).toBe('测试标题');

    await app2.destroy();
  });

  it('should load field options after app started', async () => {
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

    const localPostCollection = app.db.getCollection('posts');

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

    const updateCollectionResponse = await getDatabaseAgent(app, databaseName)
      .resource('remoteCollections.fields', localPostCollection.name)
      .update({
        filterByTk: 'title',
        values: {
          interface: 'test-interface',
        },
      });

    expect(updateCollectionResponse.status).toBe(200);

    const app2 = await createApp({ clean: false, name: 'app2' });
    const app2DbTest1 = app2.getDb(databaseName);
    expect(app2DbTest1).toBeTruthy();

    const app2PostCollection = app2DbTest1.getCollection('posts');
    const field = app2PostCollection.getField('title');
    expect(field.options.interface).toBe('test-interface');

    await app2.destroy();
  });
});
