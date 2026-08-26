/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('roles applyDataPermissions action', () => {
  let app: MockServer;
  let db: Database;
  let adminAgent;

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;

    const admin = await db.getRepository('users').create({
      values: {
        roles: ['admin'],
      },
    });

    adminAgent = await app.agent().login(admin);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should apply independent permissions for multiple collections in one call', async () => {
    const roleName = 'acl_apply_multi_test';

    await db.getRepository('roles').create({
      values: {
        name: roleName,
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'acl_apply_orders',
        fields: [{ type: 'string', name: 'title' }],
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'acl_apply_customers',
        fields: [{ type: 'string', name: 'name' }],
      },
      context: {},
    });

    const response = await adminAgent.resource('roles').applyDataPermissions({
      filterByTk: roleName,
      values: {
        dataSourceKey: 'main',
        resources: [
          {
            name: 'acl_apply_orders',
            usingActionsConfig: true,
            actions: [
              {
                name: 'view',
                fields: ['id', 'title'],
              },
            ],
          },
          {
            name: 'acl_apply_customers',
            usingActionsConfig: true,
            actions: [
              {
                name: 'create',
              },
            ],
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.count).toBe(2);

    const resources = await db.getRepository('dataSourcesRolesResources').find({
      filter: {
        roleName,
        dataSourceKey: 'main',
      },
      appends: ['actions'],
    });

    expect(resources.length).toBe(2);
    expect(
      app.acl.can({
        role: roleName,
        resource: 'acl_apply_orders',
        action: 'view',
      }),
    ).toBeDefined();
    expect(
      app.acl.can({
        role: roleName,
        resource: 'acl_apply_customers',
        action: 'create',
      }),
    ).toBeDefined();
  });

  it('should resolve scope by scopeKey for resource actions', async () => {
    const roleName = 'acl_apply_scope_test';

    await db.getRepository('roles').create({
      values: {
        name: roleName,
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: 'acl_apply_scope_posts',
        createdBy: true,
        fields: [{ type: 'string', name: 'title' }],
      },
      context: {},
    });

    const response = await adminAgent.resource('roles').applyDataPermissions({
      filterByTk: roleName,
      values: {
        dataSourceKey: 'main',
        resources: [
          {
            name: 'acl_apply_scope_posts',
            usingActionsConfig: true,
            actions: [
              {
                name: 'view',
                fields: ['id', 'title', 'createdById'],
                scopeKey: 'own',
              },
            ],
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.count).toBe(1);

    const ownScope = await db.getRepository('dataSourcesRolesResourcesScopes').findOne({
      filter: {
        key: 'own',
        dataSourceKey: 'main',
      },
    });

    const resourceAction = await db.getRepository('dataSourcesRolesResourcesActions').findOne({
      filter: {
        name: 'view',
        'resource.roleName': roleName,
        'resource.name': 'acl_apply_scope_posts',
        'resource.dataSourceKey': 'main',
      },
      appends: ['resource'],
    });

    expect(resourceAction.get('scopeId')).toEqual(ownScope.get('id'));

    const canResult = app.acl.can({
      role: roleName,
      resource: 'acl_apply_scope_posts',
      action: 'view',
    });

    expect(canResult).toBeDefined();
    expect(canResult.params.own).toBe(true);
    expect(canResult.params.filter).toMatchObject({
      createdById: '{{ ctx.state.currentUser.id }}',
    });
  });
});
