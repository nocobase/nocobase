import { createMockServer, MockServer } from '@nocobase/test';
import { CollectionManager, DataSource } from '@nocobase/data-source-manager';
import { SuperAgentTest } from 'supertest';

describe('data source with acl', () => {
  let app: MockServer;

  const getDataSourceAgent = (agent: SuperAgentTest, dataSourceKey: string) => {
    return agent.set('X-data-source', dataSourceKey) as any;
  };

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'data-source-manager'],
      acl: true,
    });

    class MockCollectionManager extends CollectionManager {
      // @ts-ignore
      getRepository(name, sourceId) {
        return {
          async find() {
            return [];
          },
          async findAndCount() {
            return [0, []];
          },
        };
      }
    }

    class MockDataSource extends DataSource {
      async load(): Promise<void> {
        this.collectionManager.defineCollection({
          name: 'posts',
          fields: [
            {
              type: 'string',
              name: 'title',
            },
            {
              type: 'hasMany',
              name: 'comments',
            },
          ],
        });

        this.collectionManager.defineCollection({
          name: 'comments',
          fields: [
            {
              type: 'string',
              name: 'content',
            },
          ],
        });
      }

      createCollectionManager(options?: any) {
        return new MockCollectionManager();
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    await app.db.getRepository('dataSources').create({
      values: {
        key: 'mockInstance1',
        type: 'mock',
        displayName: 'Mock',
        options: {},
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create strategy', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
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

    const adminAgent: any = app.agent().login(adminUser);

    // should get permission error
    const testUserAgent = getDataSourceAgent(app.agent().login(testUser), 'mockInstance1');

    // @ts-ignore
    const listRes = await testUserAgent.resource('api/posts').list({});
    expect(listRes.status).toBe(403);

    // // update connection roles strategy
    const updateRes = await adminAgent.resource('dataSources.roles', 'mockInstance1').update({
      filterByTk: 'testRole',
      values: {
        strategy: {
          actions: ['view'],
        },
      },
    });

    expect(updateRes.status).toBe(200);
    // get strategy
    const getRes = await adminAgent.resource('dataSources.roles', 'mockInstance1').get({
      filterByTk: 'testRole',
    });
    expect(getRes.status).toBe(200);

    const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
    const acl = dataSource.acl;
    const testRole = acl.getRole('testRole');
    expect(testRole).toBeDefined();

    const roleData = testRole.toJSON();

    expect(roleData.strategy).toMatchObject({
      actions: ['view'],
    });

    const listRes2 = await testUserAgent.resource('api/posts').list({});
    expect(listRes2.status).toBe(200);
  });

  it('should create resources', async () => {
    class MockDataSource extends DataSource {
      async load(): Promise<void> {}

      createCollectionManager(options?: any): any {
        return undefined;
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = app.agent().login(adminUser);

    await app.db.getRepository('dataSources').create({
      values: {
        key: 'test',
        type: 'mock',
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

    const testUserAgent = app.agent().login(testUser);

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
});
