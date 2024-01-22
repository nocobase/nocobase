import { MockServer } from '@nocobase/test';
import { createApp } from './helper';

describe('playground', () => {
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

  it('should connect to test server', async () => {
    const res = await app
      .agent()
      .resource('databaseConnections')
      .create({
        values: {
          name: 'remote-pg',
          description: 'test database connection',
          dialect: 'postgres',
          host: '121.40.141.87',
          database: 'main',
          username: 'nocobase',
          password: 'nocobase',
          port: '55432',
        },
      });

    expect(res.status).toBe(200);

    const listRes = await app.agent().resource('databaseConnections').list();
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);
  });
});
