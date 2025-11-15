/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('Change with association', async () => {
  let app: MockServer;
  let db: MockDatabase;
  let admin;
  let adminAgent;

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    const UserRepo = db.getCollection('users').repository;
    admin = await UserRepo.create({
      values: {
        roles: ['admin'],
      },
    });

    adminAgent = await app.agent().login(admin);

    await db.getCollection('collections').repository.create({
      values: {
        name: 'assoc2',
        fields: [
          {
            name: 'name',
            type: 'string',
            unique: true,
          },
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
      context: {},
    });
    await db.getCollection('collections').repository.create({
      values: {
        name: 'assoc1',
        fields: [
          {
            name: 'name',
            type: 'string',
            unique: true,
          },
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'assoc2',
            type: 'belongsToMany',
            target: 'assoc2',
            sourceKey: 'name',
            targetKey: 'name',
          },
        ],
      },
      context: {},
    });
    await db.getCollection('collections').repository.create({
      values: {
        name: 'assoc3',
        autoGenId: false,
        fields: [
          {
            name: 'assoc3_name',
            type: 'string',
            primaryKey: true,
          },
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await db.getCollection('collections').repository.create({
      values: {
        name: 'test',
        fields: [
          {
            name: 'name',
            type: 'string',
            unique: true,
          },
          {
            name: 'assoc1',
            type: 'belongsToMany',
            target: 'assoc1',
            sourceKey: 'name',
            targetKey: 'name',
          },
          {
            name: 'assoc3',
            type: 'hasOne',
            target: 'assoc3',
            sourceKey: 'name',
            foreignKey: 'test_name',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test-role',
      },
    });
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  test('disallow to associate', async () => {
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: {
        usingActionsConfig: true,
        name: 'test',
        actions: [
          {
            name: 'create',
            fields: ['name'],
          },
        ],
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        values: {
          name: 'test-1',
          assoc1: [
            {
              name: 'assoc1-1',
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
    });
  });

  test('associate only', async () => {
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: {
        usingActionsConfig: true,
        name: 'test',
        actions: [
          {
            name: 'create',
            fields: ['name', 'assoc1'],
          },
        ],
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        values: {
          name: 'test-1',
          assoc1: [
            {
              name: 'assoc1-1',
              title: 'assoc1 title',
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc1: [
        {
          name: 'assoc1-1',
        },
      ],
    });
  });

  test('allow create association, nested disallow associate', async () => {
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: [
        {
          usingActionsConfig: true,
          name: 'test',
          actions: [
            {
              name: 'create',
              fields: ['name', 'assoc1'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc1',
          actions: [
            {
              name: 'create',
              fields: ['name', 'title'],
            },
          ],
        },
      ],
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        updateAssociationValues: ['assoc1'],
        values: {
          name: 'test-1',
          assoc1: [
            {
              title: 'assoc1 title',
              assoc2: [
                {
                  name: 'assoc2-1',
                },
              ],
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc1: [
        {
          title: 'assoc1 title',
        },
      ],
    });
  });

  test('allow update association, nested disallow associate', async () => {
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: [
        {
          usingActionsConfig: true,
          name: 'test',
          actions: [
            {
              name: 'create',
              fields: ['name', 'assoc1'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc1',
          actions: [
            {
              name: 'update',
              fields: ['name', 'title'],
            },
          ],
        },
      ],
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        updateAssociationValues: ['assoc1'],
        values: {
          name: 'test-1',
          assoc1: [
            {
              name: 'assoc1-1',
              title: 'assoc1 title',
              assoc2: [
                {
                  name: 'assoc2-1',
                },
              ],
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc1: [
        {
          name: 'assoc1-1',
          title: 'assoc1 title',
        },
      ],
    });
  });

  test('disallow update association outside scope', async () => {
    const res = await adminAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        name: 'assoc1',
        resourceName: 'test',
        scope: { $and: [{ assoc1: { name: { $eq: 'assoc1' } } }] },
      },
    });
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: [
        {
          usingActionsConfig: true,
          name: 'test',
          actions: [
            {
              name: 'create',
              fields: ['name', 'assoc1'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc1',
          actions: [
            {
              name: 'update',
              fields: ['name', 'title'],
              scopeId: res.body.data.id,
            },
          ],
        },
      ],
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        updateAssociationValues: ['assoc1'],
        values: {
          name: 'test-1',
          assoc1: [
            {
              name: 'assoc1-1',
              title: 'assoc1 title',
              assoc2: [
                {
                  name: 'assoc2-1',
                },
              ],
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc1: [
        {
          name: 'assoc1-1',
        },
      ],
    });
  });

  test('allow update association under scope', async () => {
    const res = await adminAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        name: 'assoc1',
        resourceName: 'test',
        scope: { $and: [{ assoc1: { name: { $eq: 'assoc1-1' } } }] },
      },
    });
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: [
        {
          usingActionsConfig: true,
          name: 'test',
          actions: [
            {
              name: 'create',
              fields: ['name', 'assoc1'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc1',
          actions: [
            {
              name: 'update',
              fields: ['name', 'title'],
              scopeId: res.body.data.id,
            },
          ],
        },
      ],
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        updateAssociationValues: ['assoc1'],
        values: {
          name: 'test-1',
          assoc1: [
            {
              name: 'assoc1-1',
              title: 'assoc1 title',
              assoc2: [
                {
                  name: 'assoc2-1',
                },
              ],
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc1: [
        {
          name: 'assoc1-1',
          title: 'assoc1 title',
        },
      ],
    });
  });

  test('allow update association, nested associate only', async () => {
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: [
        {
          usingActionsConfig: true,
          name: 'test',
          actions: [
            {
              name: 'create',
              fields: ['name', 'assoc1'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc1',
          actions: [
            {
              name: 'update',
              fields: ['name', 'title', 'assoc2'],
            },
          ],
        },
      ],
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        updateAssociationValues: ['assoc1'],
        values: {
          name: 'test-1',
          assoc1: [
            {
              name: 'assoc1-1',
              title: 'assoc1 title',
              assoc2: [
                {
                  name: 'assoc2-1',
                  title: 'assoc2 title',
                },
              ],
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc1: [
        {
          name: 'assoc1-1',
          title: 'assoc1 title',
          assoc2: [
            {
              name: 'assoc2-1',
            },
          ],
        },
      ],
    });
  });

  test('allow update association, allow create nested association', async () => {
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: [
        {
          usingActionsConfig: true,
          name: 'test',
          actions: [
            {
              name: 'create',
              fields: ['name', 'assoc1'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc1',
          actions: [
            {
              name: 'update',
              fields: ['name', 'title', 'assoc2'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc2',
          actions: [
            {
              name: 'create',
              fields: ['name', 'title'],
            },
          ],
        },
      ],
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        updateAssociationValues: ['assoc1', 'assoc1.assoc2'],
        values: {
          name: 'test-1',
          assoc1: [
            {
              name: 'assoc1-1',
              title: 'assoc1 title',
              assoc2: [
                {
                  title: 'assoc2 title',
                },
              ],
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc1: [
        {
          name: 'assoc1-1',
          title: 'assoc1 title',
          assoc2: [
            {
              title: 'assoc2 title',
            },
          ],
        },
      ],
    });
  });

  test('allow update association, disallow update nested association outside scope', async () => {
    const res = await adminAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        name: 'assoc2',
        resourceName: 'assoc1',
        scope: { $and: [{ assoc2: { name: { $eq: 'assoc2' } } }] },
      },
    });
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: [
        {
          usingActionsConfig: true,
          name: 'test',
          actions: [
            {
              name: 'create',
              fields: ['name', 'assoc1'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc1',
          actions: [
            {
              name: 'update',
              fields: ['name', 'title', 'assoc2'],
              scopeId: res.body.data.id,
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc2',
          actions: [
            {
              name: 'update',
              fields: ['name', 'title'],
            },
          ],
        },
      ],
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        updateAssociationValues: ['assoc1', 'assoc1.assoc2'],
        values: {
          name: 'test-1',
          assoc1: [
            {
              name: 'assoc1-1',
              title: 'assoc1 title',
              assoc2: [
                {
                  name: 'assoc2-1',
                  title: 'assoc2 title',
                },
              ],
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc1: [
        {
          name: 'assoc1-1',
          title: 'assoc1 title',
          assoc2: [
            {
              name: 'assoc2-1',
            },
          ],
        },
      ],
    });
  });

  test('allow update association, allow update nested association under scope', async () => {
    const res = await adminAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        name: 'assoc2',
        resourceName: 'assoc1',
        scope: { $and: [{ assoc2: { name: { $eq: 'assoc2-1' } } }] },
      },
    });
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: [
        {
          usingActionsConfig: true,
          name: 'test',
          actions: [
            {
              name: 'create',
              fields: ['name', 'assoc1'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc1',
          actions: [
            {
              name: 'update',
              fields: ['name', 'title', 'assoc2'],
              scopeId: res.body.data.id,
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc2',
          actions: [
            {
              name: 'update',
              fields: ['name', 'title'],
            },
          ],
        },
      ],
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        updateAssociationValues: ['assoc1', 'assoc1.assoc2'],
        values: {
          name: 'test-1',
          assoc1: [
            {
              name: 'assoc1-1',
              title: 'assoc1 title',
              assoc2: [
                {
                  name: 'assoc2-1',
                  title: 'assoc2 title',
                },
              ],
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc1: [
        {
          name: 'assoc1-1',
          title: 'assoc1 title',
          assoc2: [
            {
              name: 'assoc2-1',
              title: 'assoc2 title',
            },
          ],
        },
      ],
    });
  });

  test('associate hasOne', async () => {
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: {
        usingActionsConfig: true,
        name: 'test',
        actions: [
          {
            name: 'create',
            fields: ['name', 'assoc3'],
          },
        ],
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        values: {
          name: 'test-1',
          assoc3: [
            {
              assoc3_name: 'assoc3-1',
              title: 'assoc3 title',
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc3: [
        {
          assoc3_name: 'assoc3-1',
        },
      ],
    });
  });

  test('allow update hasOne', async () => {
    await adminAgent.resource('roles.resources', 'test-role').create({
      values: [
        {
          usingActionsConfig: true,
          name: 'test',
          actions: [
            {
              name: 'create',
              fields: ['name', 'assoc3'],
            },
          ],
        },
        {
          usingActionsConfig: true,
          name: 'assoc3',
          actions: [
            {
              name: 'update',
            },
          ],
        },
      ],
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const ctx = app.context;
    ctx.database = db;
    ctx.state = {
      currentUser: user,
      currentRoles: ['test-role'],
    };
    ctx.action = {
      resourceName: 'test',
      actionName: 'create',
      params: {
        updateAssociationValues: ['assoc3'],
        values: {
          name: 'test-1',
          assoc3: [
            {
              assoc3_name: 'assoc3-1',
              title: 'assoc3 title',
            },
          ],
        },
      },
    };
    await app.acl.middleware()(ctx, async () => {});
    expect(ctx.action.params.values).toMatchObject({
      name: 'test-1',
      assoc3: [
        {
          assoc3_name: 'assoc3-1',
          title: 'assoc3 title',
        },
      ],
    });
  });
});
