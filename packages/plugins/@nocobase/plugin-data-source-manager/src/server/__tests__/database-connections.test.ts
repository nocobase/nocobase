import { createMockServer, MockServer } from '@nocobase/test';
import path from 'path';

describe('database connections', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'database-connections'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should test database connection', async () => {
    const res = await app
      .agent()
      .resource('databaseConnections')
      .testConnection({
        values: {
          name: 'test1',
          host: '127.0.0.1',
          database: 'xxx',
          username: 'xxx',
          password: 'xxx',
          dialect: 'postgres',
          port: '5432',
        },
      });

    expect(res.status).not.toBe(200);
  });

  it('should throw error when database server can not connect', async () => {
    const res = await app
      .agent()
      .resource('databaseConnections')
      .create({
        values: {
          name: 'test1',
          host: '127.0.0.1',
          dialect: 'postgres',
          database: 'xxx',
          username: 'xxx',
          password: 'xxx',
          port: '5432',
        },
      });

    expect(res.status).not.toBe(200);
  });

  it('should create database connection', async () => {
    const res = await app
      .agent()
      .resource('databaseConnections')
      .create({
        values: {
          name: 'test1',
          dialect: process.env.DB_DIALECT,
          host: process.env.DB_HOST,
          database: process.env.DB_DATABASE,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
        },
      });

    expect(res.status).toBe(200);

    const databaseConnection = await app.db.getRepository('databaseConnections').findOne({
      filter: {
        name: 'test1',
      },
    });

    expect(databaseConnection.get('name')).toEqual('test1');

    expect(app.getDb('test1')).toBeTruthy();
  });

  it('should get connections with collections', async () => {
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

    const listResp = await app
      .agent()
      .resource('databaseConnections')
      .list({
        appends: ['collections'],
        paginate: false,
      });

    expect(listResp.status).toBe(200);

    const collections = listResp.body.data[0].collections;
    expect(collections.length).toBeGreaterThan(0);
  });
});
