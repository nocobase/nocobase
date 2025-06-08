/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { ExtendedAgent, MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';
import { UNION_ROLE_KEY } from '../constants';
import { SystemRoleMode } from '../enum';

describe('union role: full permissions', async () => {
  let agent: ExtendedAgent, rootUser, user, role1, role2;
  let app: MockServer, db: Database;
  function generateRandomString() {
    return Math.random().toString(36).substring(2, 15);
  }

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    rootUser = await db.getRepository('users').findOne({
      filter: {
        email: process.env.INIT_ROOT_EMAIL,
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const role1Response = await rootAgent.resource('roles').create({
      values: {
        name: 'r1',
      },
    });
    role1 = role1Response.body.data;
    const role2Response = await rootAgent.resource('roles').create({
      values: {
        name: 'r2',
      },
    });
    role2 = role2Response.body.data;
    user = await db.getRepository('users').create({
      values: {
        name: 'u1',
        roles: [role1.name, role2.name],
      },
    });
    await rootAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode: SystemRoleMode.allowUseUnion,
      },
    });
    agent = await app.agent().login(user, UNION_ROLE_KEY);
  });

  it('should roles check successful when login role is union', async () => {
    const rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    const data = rolesResponse.body.data;
    expect(data.roles.length).toBe(2);
    expect(data.roles).include(role1.name);
    expect(data.roles).include(role2.name);
  });

  it('System -> Allows to configure interface: update snippets ui.*, expect: include ui.*', async () => {
    let rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    let data = rolesResponse.body.data;
    expect(data.snippets).not.include('ui.*');
    const rootAgent = await app.agent().login(rootUser);
    const updateResponse = await rootAgent.resource('roles').update({
      filterByTk: role1.name,
      values: {
        snippets: ['ui.*', '!pm', '!pm.*', '!app'],
      },
    });
    expect(updateResponse.statusCode).toBe(200);
    agent = await app.agent().login(user, UNION_ROLE_KEY);
    rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    data = rolesResponse.body.data;
    expect(data.snippets).include('ui.*');
  });

  it('System -> Allows to install, activate, disable plugins: role1 snippets [!pm.logger], role2 snippets [!pm.workflow.workflows], expect: snippets []', async () => {
    let rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    let data = rolesResponse.body.data;
    expect(data.snippets).not.include('ui.*');
    const rootAgent = await app.agent().login(rootUser);
    let updateResponse = await rootAgent.resource('roles').update({
      filterByTk: role1.name,
      values: {
        snippets: ['!ui.*', '!pm', 'pm.*', '!app'],
      },
    });
    updateResponse = await rootAgent.resource('roles').update({
      filterByTk: role2.name,
      values: {
        snippets: ['!ui.*', '!pm', 'pm.*', '!app'],
      },
    });
    expect(updateResponse.statusCode).toBe(200);

    await rootAgent.post(`/roles/${role1.name}/snippets:add`).send(['!pm.logger']);
    await rootAgent.post(`/roles/${role2.name}/snippets:add`).send(['!pm.workflow.workflows']);
    agent = await app.agent().login(user, role1.name);
    rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    data = rolesResponse.body.data;
    expect(data.snippets).include('pm.*');
    expect(data.snippets).include('!pm.logger');

    agent = await app.agent().login(user, UNION_ROLE_KEY);
    rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    data = rolesResponse.body.data;
    expect(data.snippets).include('pm.*');
    expect(data.snippets).not.include('!pm.logger');
    expect(data.snippets).not.include('!pm.workflow.workflows');
  });

  it('System -> Allows to install, activate, disable plugins: role1 snippets [pm.*, !pm.authenticators], role2 snippets [!pm.*], expect: snippets [pm.*, !pm.authenticators]', async () => {
    let rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    let data = rolesResponse.body.data;
    expect(data.snippets).not.include('pm.*');
    const rootAgent = await app.agent().login(rootUser);
    const updateResponse = await rootAgent.resource('roles').update({
      filterByTk: role1.name,
      values: {
        snippets: ['!ui.*', '!pm', 'pm.*', '!app'],
      },
    });
    expect(updateResponse.statusCode).toBe(200);

    await rootAgent.post(`/roles/${role1.name}/snippets:add`).send(['!pm.auth.authenticators']);
    agent = await app.agent().login(user, role1.name);
    rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    data = rolesResponse.body.data;
    expect(data.snippets).include('pm.*');
    expect(data.snippets).include('!pm.auth.authenticators');

    agent = await app.agent().login(user, UNION_ROLE_KEY);
    rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    data = rolesResponse.body.data;
    expect(data.snippets).include('pm.*');
    expect(data.snippets).include('!pm.auth.authenticators');
  });

  it('Data sources -> General action permissions, strategy.actions: role1->[view], role2->[create], expect: strategy.actions=[view,create]', async () => {
    let getRolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(getRolesResponse.statusCode).toBe(403);

    // set strategy actions: [view]
    const dataSourceRoleRepo = db.getRepository('dataSourcesRoles');
    let dataSourceRole = await dataSourceRoleRepo.findOne({
      where: { dataSourceKey: 'main', roleName: role1.name },
    });
    await dataSourceRoleRepo.update({
      filter: { id: dataSourceRole.id },
      values: {
        strategy: { actions: ['view'] },
      },
    });

    getRolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(getRolesResponse.statusCode).toBe(200);
    expect(getRolesResponse.body.data.length).gt(0);

    let createRoleResponse = await agent.resource('roles').create({ name: 'r3', title: '角色3' });
    expect(createRoleResponse.statusCode).toBe(403);

    dataSourceRole = await dataSourceRoleRepo.findOne({
      where: { dataSourceKey: 'main', roleName: role2.name },
    });
    await dataSourceRoleRepo.update({
      filter: { id: dataSourceRole.id },
      values: {
        strategy: { actions: ['create'] },
      },
    });

    createRoleResponse = await agent.resource('roles').create({ name: 'r3', title: '角色3' });
    expect(createRoleResponse.statusCode).toBe(200);

    // verfiy strategy actions: role1 + role2 = [view, create]
    const rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.statusCode).toBe(200);
    const data = rolesResponse.body.data;
    expect(data.roles.length).toBe(2);
    expect(data.strategy.actions).include('view');
    expect(data.strategy.actions).include('create');
  });

  it('Data sources -> Action permissions, actions', async () => {
    const rootAgent = await app.agent().login(rootUser);
    const tbResponse = await rootAgent.resource('collections').create({
      values: {
        logging: true,
        name: 'test_tb_1',
        template: 'tree',
        view: false,
        tree: 'adjacencyList',
        fields: [
          {
            interface: 'integer',
            name: 'parentId',
            type: 'bigInt',
            isForeignKey: true,
            uiSchema: {
              type: 'number',
              title: '{{t("Parent ID")}}',
              'x-component': 'InputNumber',
              'x-read-pretty': true,
            },
          },
          {
            interface: 'm2o',
            type: 'belongsTo',
            name: 'parent',
            foreignKey: 'parentId',
            treeParent: true,
            onDelete: 'CASCADE',
            uiSchema: {
              title: '{{t("Parent")}}',
              'x-component': 'AssociationField',
              'x-component-props': {
                multiple: false,
                fieldNames: {
                  label: 'id',
                  value: 'id',
                },
              },
            },
            target: 'test_tb_1',
          },
          {
            interface: 'o2m',
            type: 'hasMany',
            name: 'children',
            foreignKey: 'parentId',
            treeChildren: true,
            onDelete: 'CASCADE',
            uiSchema: {
              title: '{{t("Children")}}',
              'x-component': 'AssociationField',
              'x-component-props': {
                multiple: true,
                fieldNames: {
                  label: 'id',
                  value: 'id',
                },
              },
            },
            target: 'test_tb_1',
          },
          {
            name: 'id',
            type: 'bigInt',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            uiSchema: {
              type: 'number',
              title: '{{t("ID")}}',
              'x-component': 'InputNumber',
              'x-read-pretty': true,
            },
            interface: 'integer',
          },
          {
            name: 'title_id',
            interface: 'input',
            type: 'string',
            uiSchema: {
              type: 'string',
              'x-component': 'Input',
              title: 'title',
            },
            defaultValue: null,
          },
          {
            name: 'createdBy',
            interface: 'createdBy',
            type: 'belongsTo',
            target: 'users',
            foreignKey: 'createdById',
            uiSchema: {
              type: 'object',
              title: '{{t("Created by")}}',
              'x-component': 'AssociationField',
              'x-component-props': {
                fieldNames: {
                  value: 'id',
                  label: 'nickname',
                },
              },
              'x-read-pretty': true,
            },
          },
        ] as any,
        autoGenId: false,
        title: '测试表1',
      },
    });
    expect(tbResponse.statusCode).toBe(200);
    const testTbName = tbResponse.body.data.name;
    agent = await app.agent().login(user, UNION_ROLE_KEY);
    let getTbResponse = await agent.resource(testTbName).list({ pageSize: 30 });
    expect(getTbResponse.statusCode).toBe(403);

    const ownDataSourceScopeRole = await db.getRepository('dataSourcesRolesResourcesScopes').findOne({
      where: {
        key: 'own',
        dataSourceKey: 'main',
      },
    });
    const scopeFields = ['id', 'createdBy', 'createdById'];
    const dataSourceResourcesResponse = await rootAgent
      .post(`/roles/${role1.name}/dataSourceResources:create`)
      .query({
        filterByTk: testTbName,
        filter: {
          dataSourceKey: 'main',
          name: testTbName,
        },
      })
      .send({
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            fields: scopeFields,
            scope: {
              id: ownDataSourceScopeRole.id,
              createdAt: '2025-02-19T08:57:17.385Z',
              updatedAt: '2025-02-19T08:57:17.385Z',
              key: 'own',
              dataSourceKey: 'main',
              name: '{{t("Own records")}}',
              resourceName: null,
              scope: {
                createdById: '{{ ctx.state.currentUser.id }}',
              },
            },
          },
        ],
        name: testTbName,
        dataSourceKey: 'main',
      });
    expect(dataSourceResourcesResponse.statusCode).toBe(200);
    const rootUserCreatedName = generateRandomString();
    await db.getRepository(testTbName).create({
      values: {
        createdBy: rootUser.id,
        title_id: rootUserCreatedName,
      },
    });
    const userCreatedName = generateRandomString();
    await db.getRepository(testTbName).create({
      values: {
        createdBy: user.id,
        title_id: userCreatedName,
      },
    });

    agent = await app.agent().login(user, UNION_ROLE_KEY);
    getTbResponse = await agent.resource(testTbName).list({ pageSize: 30 });
    expect(getTbResponse.statusCode).toBe(200);
    expect(getTbResponse.body.data.length).gt(0);
    expect(getTbResponse.body.data.some((x) => x.createdById === user.id)).toBe(true);
    expect(getTbResponse.body.data.some((x) => x.createdById === rootUser.id)).toBe(false);
    // no title_id, only id and createdById
    expect(getTbResponse.body.data.some((x) => Boolean(x.title_id))).toBe(false);
  });

  it('should list allowedActions include update of all data when set general actions: { edit: all records, delete: all records }', async () => {
    const rootAgent = await app.agent().login(rootUser);
    const updateRoleActions = await rootAgent
      .post(`/dataSources/main/roles:update`)
      .query({
        filterByTk: role1.name,
      })
      .send({
        roleName: role1.name,
        strategy: {
          actions: ['create', 'view', 'destroy', 'update'],
        },
        dataSourceKey: 'main',
      });
    expect(updateRoleActions.statusCode).toBe(200);
    const createUserResponse1 = await rootAgent.resource('roles').create({
      values: {
        name: generateRandomString(),
      },
    });
    agent = (await (await app.agent().login(user, UNION_ROLE_KEY)).set({ 'X-With-ACL-Meta': true })) as any;
    const rolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(rolesResponse.statusCode).toBe(200);
    const meta = rolesResponse.body.meta;
    const data = rolesResponse.body.data;
    expect(data.length).gt(0);
    expect(meta.allowedActions.update).exist;
    expect(meta.allowedActions.destroy).exist;
    expect(meta.allowedActions.update).include(createUserResponse1.body.data.name);
    expect(meta.allowedActions.destroy).include(createUserResponse1.body.data.name);
  });

  it('should update user role mode successfully', async () => {
    const rootAgent = await app.agent().login(rootUser);
    let rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.status).toBe(200);
    expect(rolesResponse.body.data.roleMode).toStrictEqual(SystemRoleMode.allowUseUnion);
    await rootAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode: SystemRoleMode.default,
      },
    });
    rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.status).toBe(200);
    expect(rolesResponse.body.data.roleMode).toStrictEqual(SystemRoleMode.default);
  });

  it(`should response no permission when createdById field is missing in data tables`, async () => {
    let getRolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(getRolesResponse.statusCode).toBe(403);

    const dataSourceRoleRepo = db.getRepository('dataSourcesRoles');
    const dataSourceRole1 = await dataSourceRoleRepo.findOne({
      where: { dataSourceKey: 'main', roleName: role1.name },
    });
    await dataSourceRoleRepo.update({
      filter: { id: dataSourceRole1.id },
      values: {
        strategy: { actions: ['view:own'] },
      },
    });

    const dataSourceRole2 = await dataSourceRoleRepo.findOne({
      where: { dataSourceKey: 'main', roleName: role2.name },
    });
    await dataSourceRoleRepo.update({
      filter: { id: dataSourceRole2.id },
      values: {
        strategy: { actions: ['view:own'] },
      },
    });

    agent = await app.agent().login(user, role1.name);
    getRolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(getRolesResponse.statusCode).toBe(403);

    agent = await app.agent().login(user, role2.name);
    getRolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(getRolesResponse.statusCode).toBe(403);

    agent = await app.agent().login(user, UNION_ROLE_KEY);
    getRolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(getRolesResponse.statusCode).toBe(403);
  });

  it(`should response allowedActions no edit when createdById field is missing in data tables and set edit:own`, async () => {
    const dataSourceRoleRepo = db.getRepository('dataSourcesRoles');
    const dataSourceRole1 = await dataSourceRoleRepo.findOne({
      where: { dataSourceKey: 'main', roleName: role1.name },
    });
    await dataSourceRoleRepo.update({
      filter: { id: dataSourceRole1.id },
      values: {
        strategy: { actions: ['view', 'edit:own'] },
      },
    });

    const dataSourceRole2 = await dataSourceRoleRepo.findOne({
      where: { dataSourceKey: 'main', roleName: role2.name },
    });
    await dataSourceRoleRepo.update({
      filter: { id: dataSourceRole2.id },
      values: {
        strategy: { actions: ['view', 'edit:own'] },
      },
    });

    agent = (await (await app.agent().login(user, role1.name)).set({ 'X-With-ACL-Meta': true })) as any;
    let getRolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(getRolesResponse.statusCode).toBe(200);
    expect(getRolesResponse.body.meta.allowedActions.update.length).toBe(0);

    agent = (await (await app.agent().login(user, role2.name)).set({ 'X-With-ACL-Meta': true })) as any;
    getRolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(getRolesResponse.statusCode).toBe(200);
    expect(getRolesResponse.body.meta.allowedActions.update.length).toBe(0);

    agent = (await (await app.agent().login(user, UNION_ROLE_KEY)).set({ 'X-With-ACL-Meta': true })) as any;
    getRolesResponse = await agent.resource('roles').list({ pageSize: 30 });
    expect(getRolesResponse.statusCode).toBe(200);
    expect(getRolesResponse.body.meta.allowedActions.update.length).toBe(0);
  });

  it('should login successfully when use __union__ role in allowUseUnion mode #1906', async () => {
    const rootAgent = await app.agent().login(rootUser);
    await rootAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode: SystemRoleMode.allowUseUnion,
      },
    });
    agent = await app.agent().login(user);
    const createRoleResponse = await agent.resource('roles').check();
    expect(createRoleResponse.statusCode).toBe(200);
  });

  it('should currentRole not be __union__ when default role mode #1907', async () => {
    const rootAgent = await app.agent().login(rootUser);
    await rootAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode: SystemRoleMode.default,
      },
    });
    agent = await app.agent().login(user, UNION_ROLE_KEY);
    const createRoleResponse = await agent.resource('roles').check();
    expect(createRoleResponse.statusCode).toBe(200);
    expect(createRoleResponse.body.data.role).not.toBe(UNION_ROLE_KEY);
  });

  it('should general action permissions override specific resource permissions when using union role #1924', async () => {
    const rootAgent = await app.agent().login(rootUser);
    await rootAgent
      .post(`/dataSources/main/roles:update`)
      .query({
        filterByTk: role1.name,
      })
      .send({
        roleName: role1.name,
        strategy: {
          actions: ['view'],
        },
        dataSourceKey: 'main',
      });

    const ownDataSourceScopeRole = await db.getRepository('dataSourcesRolesResourcesScopes').findOne({
      where: {
        key: 'own',
        dataSourceKey: 'main',
      },
    });
    const scopeFields = ['id', 'createdBy', 'createdById'];
    const dataSourceResourcesResponse = await rootAgent
      .post(`/roles/${role2.name}/dataSourceResources:create`)
      .query({
        filterByTk: 'users',
        filter: {
          dataSourceKey: 'main',
          name: 'users',
        },
      })
      .send({
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            fields: scopeFields,
            scope: {
              id: ownDataSourceScopeRole.id,
              createdAt: '2025-02-19T08:57:17.385Z',
              updatedAt: '2025-02-19T08:57:17.385Z',
              key: 'own',
              dataSourceKey: 'main',
              name: '{{t("Own records")}}',
              resourceName: null,
              scope: {
                createdById: '{{ ctx.state.currentUser.id }}',
              },
            },
          },
        ],
        name: 'users',
        dataSourceKey: 'main',
      });
    expect(dataSourceResourcesResponse.statusCode).toBe(200);

    agent = await app.agent().login(user, UNION_ROLE_KEY);
    const rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.status).toBe(200);
    expect(rolesResponse.body.data.actions['users:view']).toStrictEqual({});
  });

  it('should verify actions configuration for union role with specific scopes', async () => {
    const rootAgent = await app.agent().login(rootUser);
    await rootAgent
      .post(`/dataSources/main/roles:update`)
      .query({
        filterByTk: role1.name,
      })
      .send({
        roleName: role1.name,
        strategy: {
          actions: ['view', 'create:own', 'update'],
        },
        dataSourceKey: 'main',
      });

    const ownDataSourceScopeRole = await db.getRepository('dataSourcesRolesResourcesScopes').findOne({
      where: {
        key: 'own',
        dataSourceKey: 'main',
      },
    });
    const scopeFields = ['id', 'createdBy', 'createdById'];
    const dataSourceResourcesResponse = await rootAgent
      .post(`/roles/${role2.name}/dataSourceResources:create`)
      .query({
        filterByTk: 'users',
        filter: {
          dataSourceKey: 'main',
          name: 'users',
        },
      })
      .send({
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            fields: scopeFields,
            scope: {
              id: ownDataSourceScopeRole.id,
              createdAt: '2025-02-19T08:57:17.385Z',
              updatedAt: '2025-02-19T08:57:17.385Z',
              key: 'own',
              dataSourceKey: 'main',
              name: '{{t("Own records")}}',
              resourceName: null,
              scope: {
                createdById: '{{ ctx.state.currentUser.id }}',
              },
            },
          },
          {
            name: 'create',
            fields: scopeFields,
            scope: {
              id: ownDataSourceScopeRole.id,
              createdAt: '2025-02-19T08:57:17.385Z',
              updatedAt: '2025-02-19T08:57:17.385Z',
              key: 'own',
              dataSourceKey: 'main',
              name: '{{t("Own records")}}',
              resourceName: null,
              scope: {
                createdById: '{{ ctx.state.currentUser.id }}',
              },
            },
          },
        ],
        name: 'users',
        dataSourceKey: 'main',
      });
    expect(dataSourceResourcesResponse.statusCode).toBe(200);

    agent = await app.agent().login(user, UNION_ROLE_KEY);
    const rolesResponse = await agent.resource('roles').check();
    expect(rolesResponse.status).toBe(200);
    expect(rolesResponse.body.data.actions).toHaveProperty('users:create');
    expect(rolesResponse.body.data.actions).toHaveProperty('users:view');
    expect(rolesResponse.body.data.actions['users:view']).toStrictEqual({});
    expect(rolesResponse.body.data.actions).not.toHaveProperty('users:create:own');
    expect(rolesResponse.body.data.actions['users:create']).toHaveProperty('filter');
    expect(rolesResponse.body.data.actions['users:create']).toHaveProperty('whitelist');
    expect(rolesResponse.body.data.actions['users:update']).toStrictEqual({});
  });
});
