/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionManager, DataSource, IRepository } from '@nocobase/data-source-manager';
import { ICollectionManager, IModel } from '@nocobase/data-source-manager/src/types';
import { UNION_ROLE_KEY } from '@nocobase/plugin-acl';
import { MockServer, createMockServer } from '@nocobase/test';
import os from 'os';
import { SuperAgentTest } from 'supertest';

describe('data source with acl', () => {
  let app: MockServer;

  const getDataSourceAgent = (agent: SuperAgentTest, dataSourceKey: string) => {
    return agent.set('X-data-source', dataSourceKey) as any;
  };

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
      acl: true,
    });

    class MockRepository implements IRepository {
      count(options?: any): Promise<Number> {
        return Promise.resolve(0);
      }

      findAndCount(options?: any): Promise<[IModel[], Number]> {
        return Promise.resolve([[], 0]);
      }

      async find() {
        return [];
      }

      async findOne() {
        return {};
      }

      async create() {}

      async update() {}

      async destroy() {}
    }

    class MockCollectionManager extends CollectionManager {
      getRepository(name: string, sourceId?: string | number): IRepository {
        return new MockRepository();
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

      createCollectionManager(options?: any): ICollectionManager {
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

  it.skipIf(os.platform() === 'win32')('should call application middleware', async () => {
    const middlewareFn = vi.fn();
    app.use(async (ctx, next) => {
      middlewareFn();
      await next();
    });

    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = (await app.agent().login(adminUser)).set('x-data-source', 'mockInstance1');
    const listRes = await adminAgent.resource('api/posts').list();
    expect(listRes.status).toBe(200);
    expect(middlewareFn).toBeCalledTimes(1);
  });

  it.skipIf(os.platform() === 'win32')('should allow root user', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = (await app.agent().login(adminUser)).set('x-data-source', 'mockInstance1');
    const postRes = await adminAgent.resource('api/posts').list({});
    expect(postRes.status).toBe(200);
  });

  it('should update roles resources', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = await app.agent().login(adminUser);

    await adminAgent.resource('dataSources.roles', 'mockInstance1').update({
      filterByTk: 'member',
      values: {
        resources: [
          {
            posts: {
              actions: {
                view: {
                  fields: ['title'],
                },
              },
            },
          },
        ],
      },
    });
  });

  it('should set main data source strategy', async () => {
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

    await app.db.getCollection('collections').repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      },
      context: {},
    });

    const adminAgent: any = await app.agent().login(adminUser);

    const testUserAgent: any = await app.agent().login(testUser);

    const listRes = await testUserAgent.resource('posts').list({});
    expect(listRes.status).toBe(403);

    const updateRes = await adminAgent.resource('dataSources.roles', 'main').update({
      filterByTk: 'testRole',
      values: {
        strategy: {
          actions: ['view'],
        },
      },
    });

    expect(updateRes.status).toBe(200);

    // get strategy
    const getRes = await adminAgent.resource('dataSources.roles', 'main').get({
      filterByTk: 'testRole',
    });

    expect(getRes.status).toBe(200);

    const testRole = app.acl.getRole('testRole');
    const roleData = testRole.toJSON();

    expect(roleData.strategy).toMatchObject({
      actions: ['view'],
    });

    const listRes2 = await testUserAgent.resource('posts').list({});
    expect(listRes2.status).toBe(200);
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

    const adminAgent: any = await app.agent().login(adminUser);

    // should get permission error
    const testAgent = await app.agent().login(testUser);
    const testUserAgent = getDataSourceAgent(testAgent, 'mockInstance1');

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

    const adminAgent: any = await app.agent().login(adminUser);

    // should get permission error
    const testUserAgent = getDataSourceAgent(await app.agent().login(testUser), 'mockInstance1');

    const createResourceResp = await adminAgent.resource('dataSources.rolesResourcesScopes', 'mockInstance1').create({
      values: {
        name: 'posts title starts with test',
        resourceName: 'posts',
        scope: {
          title: {
            $startsWith: 'test',
          },
        },
      },
    });

    expect(createResourceResp.status).toBe(200);

    // list scopes
    const listScopesResp = await adminAgent.resource('dataSources.rolesResourcesScopes', 'mockInstance1').list({});

    expect(listScopesResp.status).toBe(200);

    const scope = listScopesResp.body.data.find((item) => item.name === 'posts title starts with test');

    // create user resource permission
    const createConnectionResourceResp = await adminAgent.resource('roles.dataSourceResources', 'testRole').create({
      values: {
        dataSourceKey: 'mockInstance1',
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
        name: 'posts',
      },
    });

    expect(createConnectionResourceResp.status).toBe(200);

    const data = createConnectionResourceResp.body.data;

    // update scope to null
    const updateScopeResp = await adminAgent.resource('roles.dataSourceResources', 'testRole').update({
      filter: {
        dataSourceKey: 'mockInstance1',
        name: 'posts',
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
    const getResourceResp = await adminAgent.resource('roles.dataSourceResources', 'testRole').get({
      filter: {
        dataSourceKey: 'mockInstance1',
        name: 'posts',
      },
      appends: ['actions.scope'],
    });

    expect(getResourceResp.status).toBe(200);
    expect(getResourceResp.body.data.actions[0].scope).toBeNull();

    // get collection list
    const collectionListRep = await adminAgent.resource('roles.dataSourcesCollections', 'testRole').list({
      filter: {
        dataSourceKey: 'mockInstance1',
      },
    });
    expect(collectionListRep.status).toBe(200);

    // call roles check
    // @ts-ignore
    const checkRep = await (await app.agent().login(testUser)).resource('roles').check({});
    expect(checkRep.status).toBe(200);

    const checkData = checkRep.body;

    expect(checkData.meta.dataSources.mockInstance1).toBeDefined();
  });

  it('should update roles strategy', async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    // update strategy
    const updateRes = await (await app.agent().login(adminUser)).resource('dataSources.roles', 'main').update({
      filterByTk: 'admin',
      values: {
        strategy: {
          actions: [],
        },
      },
    });

    // get role
    const adminRoleResp = await (await app.agent().login(adminUser)).resource('dataSources.roles', 'main').get({
      filterByTk: 'admin',
    });

    const data = adminRoleResp.body;
    expect(data.data.strategy.actions).toHaveLength(0);

    // update role
    const updateRoleRes = await (await app.agent().login(adminUser)).resource('roles').update({
      filterByTk: 'admin',
      values: {
        snippets: ['pm.*'],
      },
    });

    expect(updateRoleRes.status).toBe(200);

    const adminRoleResp2 = await (await app.agent().login(adminUser)).resource('dataSources.roles', 'main').get({
      filterByTk: 'admin',
    });

    expect(adminRoleResp2.body.data.strategy.actions).toHaveLength(0);
  });

  it(`should list response meta include new data sources`, async () => {
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

    const adminAgent: any = await app.agent().login(adminUser);

    // create user resource permission
    const createConnectionResourceResp = await adminAgent.resource('roles.dataSourceResources', 'testRole').create({
      values: {
        dataSourceKey: 'mockInstance1',
        usingActionsConfig: true,
        strategy: {
          actions: ['view'],
        },
        name: 'posts',
      },
    });

    expect(createConnectionResourceResp.status).toBe(200);

    const createResourceResp = await adminAgent.resource('dataSources.roles', 'mockInstance1').update({
      filterByTk: 'testRole',
      values: {
        strategy: {
          actions: ['view'],
        },
      },
    });

    expect(createResourceResp.status).toBe(200);

    // call roles check
    let checkRep = await (await app.agent().login(testUser)).resource('roles').check({});
    expect(checkRep.status).toBe(200);

    let checkData = checkRep.body;

    expect(checkData.meta.dataSources.mockInstance1).exist;
    expect(checkData.meta.dataSources.mockInstance1.strategy).toEqual({ actions: ['view'] });

    const testUserAgent = await app.agent().login(testUser, UNION_ROLE_KEY);
    checkRep = await testUserAgent.resource('roles').check({});
    expect(checkRep.status).toBe(200);

    checkData = checkRep.body;

    expect(checkData.meta.dataSources.mockInstance1).exist;
    expect(checkData.meta.dataSources.mockInstance1.strategy).toEqual({ actions: ['view'] });
  });

  it(`should update data sources`, async () => {
    const adminUser = await app.db.getRepository('users').create({
      values: {
        roles: ['root'],
      },
    });

    const adminAgent: any = await app.agent().login(adminUser);

    await adminAgent.resource('roles').create({
      values: {
        name: 'testRole',
        snippets: ['!ui.*', '!pm', '!pm.*'],
        title: 'testRole',
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    await app.db.getCollection('collections').repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      },
      context: {},
    });

    const createScopeResp = await adminAgent
      .post('/dataSources/main/rolesResourcesScopes:create')
      .send({ scope: { $and: [{ title: { $includes: '456' } }] }, resourceName: 'posts', name: 't2' });

    expect(createScopeResp.status).toBe(200);
    const scope = createScopeResp.body.data;

    const createRoleScopeResp = await adminAgent
      .post('/roles/testRole/dataSourceResources:create')
      .query({
        filterByTk: 'posts',
        filter: {
          dataSourceKey: 'main',
          name: 'posts',
        },
      })
      .send({
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            fields: ['title'],
            scope: {
              id: scope.id,
              createdAt: '2025-06-13T09:19:38.000Z',
              updatedAt: '2025-06-13T09:19:38.000Z',
              key: 'i50ffsy0aky',
              dataSourceKey: 'main',
              name: 't2',
              resourceName: 'posts',
              scope: { $and: [{ title: { $includes: '456' } }] },
            },
          },
        ],
        name: 'posts',
        dataSourceKey: 'main',
      });

    expect(createRoleScopeResp.status).toBe(200);

    await app.db.getRepository('posts').create({
      values: [{ title: '123' }, { title: '123456' }],
    });

    const testUserAgent: any = await app.agent().login(testUser, 'testRole');
    const listRes1 = await testUserAgent.resource('posts').list({
      filter: {},
      pageSize: 10,
    });

    expect(listRes1.status).toBe(200);
    expect(listRes1.body.data).toHaveLength(1);

    const updateScopeResp = await adminAgent
      .post('/dataSources/main/rolesResourcesScopes:update')
      .query({
        filterByTk: scope.id,
      })
      .send({ scope: { $and: [{ title: { $includes: '123' } }] }, resourceName: 'posts', name: 't2' });

    expect(updateScopeResp.status).toBe(200);

    const listRes2 = await testUserAgent.resource('posts').list({
      filter: {},
      pageSize: 10,
    });

    expect(listRes2.status).toBe(200);
    expect(listRes2.body.data).toHaveLength(2);
  });
});
