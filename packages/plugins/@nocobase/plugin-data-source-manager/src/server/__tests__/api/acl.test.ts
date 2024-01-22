import { createMockServer, MockServer } from '@nocobase/test';
import path from 'path';
import { SuperAgentTest } from 'supertest';

describe('acl', () => {
  let app: MockServer;

  const getDatabaseAgent = (agent: SuperAgentTest, databaseName: string) => {
    return agent.set('X-Database', databaseName) as any;
  };

  const getConnectionAgent = (agent: SuperAgentTest, connectionName: string) => {
    return agent.set('X-Connection', connectionName) as any;
  };

  beforeEach(async () => {
    process.env['APPEND_PRESET_BUILT_IN_PLUGINS'] = 'database-connections';
    app = await createMockServer({
      plugins: ['nocobase'],
      acl: true,
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should list with allowedAction', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = app.agent().login(adminUser);

    // role without permission
    await adminAgent.resource('roles').create({
      values: {
        name: 'testRole',
        title: '测试角色',
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');

    await app.db.getRepository('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    // create permission
    await adminAgent.resource('roles.connectionResources', 'testRole').create({
      values: {
        connectionName: 'test',
        usingActionsConfig: true,
        actions: [{ name: 'view', fields: ['content', 'title'], scope: null }],
        name: 'Articles',
      },
    });

    const testUserAgent = app.agent().login(testUser).set('x-connection', 'test');

    // @ts-ignore
    const resp = await testUserAgent.set('X-With-ACL-Meta', true).resource('Articles').list({});
    console.log(resp.body);
    const body = resp.body;
    expect(body.meta.allowedActions).toBeDefined();
  });

  it('should get acl check', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = app.agent().login(adminUser);

    // role without permission
    await adminAgent.resource('roles').create({
      values: {
        name: 'testRole',
        title: '测试角色',
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');

    const connectionResp = await adminAgent.resource('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    expect(connectionResp.status).toBe(200);

    // create permission
    await adminAgent.resource('roles.connectionResources', 'testRole').create({
      values: {
        connectionName: 'test',
        usingActionsConfig: true,
        actions: [{ name: 'view', fields: ['content', 'title'], scope: null }],
        name: 'Articles',
      },
    });

    const testUserAgent = app.agent().login(testUser);

    // @ts-ignore
    const checkRep = await testUserAgent.resource('roles').check({});
    expect(checkRep.status).toBe(200);

    const checkData = checkRep.body;

    expect(checkData.meta.dataSources.test).toBeDefined();
    console.log(JSON.stringify(checkData, null, 2));
  });

  it('should create connection roles with strategy permission', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = app.agent().login(adminUser);

    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');

    const connectionResp = await adminAgent.resource('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    expect(connectionResp.status).toBe(200);

    // role without permission
    await adminAgent.resource('roles').create({
      values: {
        name: 'testRole',
        title: '测试角色',
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    // should get permission error
    const testUserAgent = getConnectionAgent(app.agent().login(testUser), 'test');
    const listRes = await testUserAgent.resource('Articles').list({});
    expect(listRes.status).toBe(403);

    // update connection roles strategy
    const updateRes = await adminAgent.resource('databaseConnections.roles', 'test').update({
      filterByTk: 'testRole',
      values: {
        strategy: {
          actions: ['view'],
        },
      },
    });

    expect(updateRes.status).toBe(200);

    // get strategy
    const getRes = await adminAgent.resource('databaseConnections.roles', 'test').get({
      filterByTk: 'testRole',
    });
    expect(getRes.status).toBe(200);

    const testRole = app.acls.get('test').getRole('testRole');
    expect(testRole).toBeDefined();

    const listRes2 = await testUserAgent.resource('Articles').list({});
    expect(listRes2.status).toBe(200);
  });

  it('should create default scope after connection created', async () => {
    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');
    await app.db.getRepository('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    const scopes = await app.db.getRepository('connectionsRolesResourcesScopes').find();

    expect(scopes.length).toBe(1);
  });

  it('should create resources', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = app.agent().login(adminUser);

    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');
    await app.db.getRepository('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    await app.db.getRepository('roles').create({
      values: {
        name: 'testRole',
        title: '测试角色',
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const testUserAgent = getConnectionAgent(app.agent().login(testUser), 'test');

    const createResourceResp = await adminAgent
      .resource('databaseConnections.connectionsRolesResourcesScopes', 'test')
      .create({
        values: {
          name: 'articles title starts with test',
          resourceName: 'Articles',
          scope: {
            title: {
              $startsWith: 'test',
            },
          },
        },
      });

    expect(createResourceResp.status).toBe(200);

    // list scopes

    const listScopesResp = await adminAgent
      .resource('databaseConnections.connectionsRolesResourcesScopes', 'test')
      .list({});

    expect(listScopesResp.status).toBe(200);

    const scope = listScopesResp.body.data.find((item) => item.name === 'articles title starts with test');

    // create user resource permission
    const createConnectionResourceResp = await adminAgent.resource('roles.connectionResources', 'testRole').create({
      values: {
        connectionName: 'test',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            fields: ['content', 'title'],
            scope: {
              id: scope.id,
            },
          },
        ],
        name: 'Articles',
      },
    });

    expect(createConnectionResourceResp.status).toBe(200);

    const data = createConnectionResourceResp.body.data;

    // update scope to null
    const updateScopeResp = await adminAgent.resource('roles.connectionResources', 'testRole').update({
      filter: {
        connectionName: 'test',
        name: 'Articles',
      },
      values: {
        actions: data.actions.map((action) => {
          return {
            ...action,
            scope: null,
            fields: ['content'],
          };
        }),
      },
    });

    expect(updateScopeResp.status).toBe(200);

    // get resourcers
    const getResourceResp = await adminAgent.resource('roles.connectionResources', 'testRole').get({
      filter: {
        connectionName: 'test',
        name: 'Articles',
      },
      appends: ['actions.scope'],
    });

    expect(getResourceResp.status).toBe(200);
    expect(getResourceResp.body.data.actions[0].scope).toBeNull();
  });

  it('should create connection roles with actions permission', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = app.agent().login(adminUser);

    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');
    await app.db.getRepository('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    await app.db.getRepository('roles').create({
      values: {
        name: 'testRole',
        title: '测试角色',
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const testUserAgent = getConnectionAgent(app.agent().login(testUser), 'test');

    // create permission scope
    // create resource permission
    const createConnectionResourceResp = await adminAgent.resource('roles.connectionResources', 'testRole').create({
      values: {
        connectionName: 'test',
        usingActionsConfig: true,
        actions: [{ name: 'view', fields: ['content', 'title'], scope: null }],
        name: 'Articles',
      },
    });

    expect(createConnectionResourceResp.status).toBe(200);

    const testRole = app.acls.get('test').getRole('testRole');
    expect(testRole).toBeDefined();

    expect(testRole.getResource('Articles')).toBeDefined();

    const listArticlesResp = await testUserAgent.resource('Articles').list({});
    expect(listArticlesResp.status).toBe(200);

    // get resource
    const getResourceResp = await adminAgent.resource('roles.connectionResources', 'testRole').get({
      filter: {
        connectionName: 'test',
        name: 'Articles',
      },

      appends: ['actions', 'actions.scope'],
    });

    expect(getResourceResp.status).toBe(200);

    // should list remote collections permission
    const remoteCollectionResp = await adminAgent.resource('roles.remoteCollections', 'testRole').list({
      filter: {
        connectionName: 'test',
      },
    });

    expect(remoteCollectionResp.status).toBe(200);

    const ArticleConfig = remoteCollectionResp.body.data.find((config) => config.collectionName === 'Articles');

    expect(ArticleConfig).toMatchObject({
      type: 'collection',
      name: 'Articles',
      collectionName: 'Articles',
      roleName: 'testRole',
      usingConfig: 'resourceAction',
      exists: true,
    });

    // update resource permission
    const updateConnectionResourceResp = await adminAgent.resource('roles.connectionResources', 'testRole').update({
      filter: {
        connectionName: 'test',
        name: 'Articles',
      },
      values: {
        actions: [{ name: 'update', fields: ['content'], scope: null }],
      },
    });

    expect(updateConnectionResourceResp.status).toBe(200);

    // create resource scope
    const createResourceResp = await adminAgent
      .resource('databaseConnections.connectionsRolesResourcesScopes', 'test')
      .create({
        values: {
          name: 'all articles',
          resourceName: 'Articles',
          scope: {
            title: 'test',
          },
        },
      });

    expect(createResourceResp.status).toBe(200);

    // list scopes

    const listScopesResp = await adminAgent
      .resource('databaseConnections.connectionsRolesResourcesScopes', 'test')
      .list({});

    expect(listScopesResp.status).toBe(200);
  });

  it('should request with permission', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['admin'],
      },
    });

    const adminAgent: any = app.agent().login(adminUser);

    const storagePath = path.resolve(__dirname, '../fixtures/test.sqlite');

    //@ts-ignore
    const res = await adminAgent.resource('databaseConnections').create({
      values: {
        name: 'test',
        description: 'test database connection',
        dialect: 'sqlite',
        storage: storagePath,
      },
    });

    expect(res.status).toBe(200);

    // role without permission
    await adminAgent.resource('roles').create({
      values: {
        name: 'testRole2',
        title: '测试角色2',
        strategy: {
          actions: ['list'],
        },
      },
    });

    const testUser2 = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole2'],
      },
    });

    // @ts-ignore
    const testUser2Agent = getDatabaseAgent(app.agent().login(testUser2).set('x-Role', 'testRole2'), 'test');
    const listRes2 = await testUser2Agent.resource('Articles').list({});
    expect(listRes2.status).toBe(403);

    // update namespace strategy action
    await adminAgent.resource('roles').update({
      filterByTk: 'testRole2',
      values: {
        strategy: {
          actions: [`test|list`, 'list'],
        },
      },
    });

    const listRes3 = await testUser2Agent.resource('Articles').list({});
    expect(listRes3.status).toBe(200);

    // // create role
    // await app
    //   .agent()
    //   .resource('roles')
    //   .create({
    //     values: {
    //       name: 'testRole',
    //       title: '测试角色',
    //       actions: ['test|list'],
    //     },
    //   });
    //
    // const testUser = await app.db.getRepository('users').create({
    //   values: {
    //     roles: ['testRole'],
    //   },
    // });
    //
    // const testUserAgent = getDatabaseAgent(app.agent().login(testUser), 'test');
    //
    // const listRes = await testUserAgent.resource('Articles').list({});
    // expect(listRes.status).toBe(200);
  });
});
