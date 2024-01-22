import { MockServer } from '@nocobase/test';
import { createApp } from '../helper';
import path from 'path';

describe('roles remote collections', () => {
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

  it('should get role remote collections', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');

    // create remote collection
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

    // create role
    await app
      .agent()
      .resource('roles')
      .create({
        values: {
          name: 'admin',
          title: '管理员',
        },
      });

    const UserRepo = app.db.getCollection('users').repository;

    const admin = await UserRepo.create({
      values: {
        roles: ['admin'],
      },
    });

    // get role remote collections
    const resp = await getDatabaseAgent(app, 'test')
      .resource('roles.remoteCollections', 'admin')
      .list({
        filter: {
          connectionName: 'test',
        },
      });

    expect(resp.status).toBe(200);

    const adminAgent = app.agent().login(admin);

    // @ts-ignore
    await adminAgent.resource('roles.resources', 'admin').create({
      values: {
        name: 'test|Articles',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
          },
        ],
      },
    });

    const resp2 = await getDatabaseAgent(app, 'test').resource('roles.remoteCollections', 'admin').list({});
    const articlesConfig = resp2.body.data.find((item: any) => item.name === 'test|Articles');
    expect(articlesConfig).toBeDefined();
  });
});
