import { createApp } from './helper';
import { MockServer } from '@nocobase/test';

describe('relation fields', () => {
  let app: MockServer;

  const getDatabaseAgent = (app: MockServer, databaseName: string) => {
    return app.agent().set('X-Database', databaseName) as any;
  };

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should add belongsTo association fields', async () => {
    await app.db.getRepository('collections').create({
      values: {
        timestamps: false,
        name: 'authors',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'posts',
            type: 'hasMany',
            target: 'posts',
            foreignKey: 'author_id',
          },
        ],
      },
      context: {},
    });

    await app.db.getRepository('collections').create({
      values: {
        name: 'posts',
        timestamps: false,
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'author',
            type: 'belongsTo',
            target: 'authors',
            foreignKey: 'author_id',
          },
        ],
      },
      context: {},
    });

    const localPostCollection = app.db.getCollection('posts');
    await app.db.getRepository('posts').create({
      values: {
        title: 'test',
        content: 'test',
        author: {
          name: 'test',
        },
      },
    });

    const databaseName = 'test1';

    // create database connection
    await app
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

    const createFieldResponse = await getDatabaseAgent(app, databaseName)
      .resource('remoteCollections.fields', localPostCollection.name)
      .create({
        values: {
          name: 'author',
          type: 'belongsTo',
          target: 'authors',
          foreignKey: 'author_id',
        },
      });

    expect(createFieldResponse.status).toBe(200);

    await getDatabaseAgent(app, databaseName)
      .resource('remoteCollections.fields', 'authors')
      .create({
        values: {
          name: 'posts',
          type: 'hasMany',
          target: 'posts',
          foreignKey: 'author_id',
        },
      });

    const remoteAuthorsCollection = app.getDb(databaseName).getCollection('authors');
    expect(remoteAuthorsCollection.getField('posts')).toBeTruthy();

    const remotePostsCollection = app.getDb(databaseName).getCollection('posts');
    expect(remotePostsCollection.getField('author')).toBeTruthy();

    const data = await remoteAuthorsCollection.repository.find({
      appends: ['posts'],
    });

    expect(data[0].posts).toBeTruthy();

    const app2 = await createApp({ clean: false, name: 'app2' });
    const app2DbTest1 = app2.getDb(databaseName);

    expect(app2DbTest1).toBeTruthy();
    const app2AuthorsCollection = app2DbTest1.getCollection('authors');
    expect(app2AuthorsCollection.getField('posts')).toBeTruthy();
  });
});
