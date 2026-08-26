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

describe('roles data source compatibility guards', () => {
  let app: MockServer;
  let db: Database;
  let adminAgent;

  const roleName = 'acl_ds_compat_role';
  const collectionName = 'acl_ds_compat_products';
  let resourceId: number;
  let allScopeId: number;

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;

    const admin = await db.getRepository('users').create({
      values: {
        roles: ['admin'],
      },
    });

    adminAgent = await app.agent().login(admin);

    await db.getRepository('roles').create({
      values: {
        name: roleName,
        title: 'ACL DS Compat Role',
        snippets: ['!ui.*', '!pm', '!pm.*', '!app'],
        strategy: {
          actions: [],
        },
      },
    });

    await db.getRepository('collections').create({
      values: {
        name: collectionName,
        fields: [{ type: 'string', name: 'title' }],
      },
      context: {},
    });

    const allScope = await db.getRepository('dataSourcesRolesResourcesScopes').findOne({
      filter: {
        key: 'all',
        dataSourceKey: 'main',
      },
    });
    allScopeId = allScope.get('id') as number;

    const createResourceResp = await adminAgent.resource('roles.dataSourceResources', roleName).create({
      values: {
        name: collectionName,
        dataSourceKey: 'main',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            scopeId: allScopeId,
            fields: ['id', 'title'],
          },
        ],
      },
    });

    expect(createResourceResp.statusCode).toBe(200);
    resourceId = createResourceResp.body.data.id;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should support dataSourceKey query param for roles.dataSourcesCollections:list', async () => {
    const response = await adminAgent.resource('roles.dataSourcesCollections', roleName).list({
      dataSourceKey: 'main',
    });

    expect(response.statusCode).toBe(200);
    const rows = response.body?.data || response.body?.rows || [];
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.find((item) => item.name === collectionName)).toBeDefined();
  });

  it('should support locator query params for roles.dataSourceResources:get', async () => {
    const response = await adminAgent.resource('roles.dataSourceResources', roleName).get({
      dataSourceKey: 'main',
      name: collectionName,
      appends: ['actions'],
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe(collectionName);
    expect(response.body.data.dataSourceKey).toBe('main');
    expect(response.body.data.actions[0].name).toBe('view');
  });

  it('should tolerate non-numeric filterByTk locator keys for roles.dataSourceResources:get', async () => {
    const response = await adminAgent.resource('roles.dataSourceResources', roleName).get({
      filterByTk: `t_${collectionName}`,
      filter: {
        dataSourceKey: 'main',
        name: collectionName,
      },
      appends: ['actions'],
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe(collectionName);
    expect(response.body.data.dataSourceKey).toBe('main');
  });

  it('should update by filterByTk with locator normalization', async () => {
    const goodResp = await adminAgent.resource('roles.dataSourceResources', roleName).update({
      filterByTk: resourceId,
      values: {
        usingActionsConfig: true,
        actions: [{ name: 'view', scopeId: allScopeId, fields: ['id'] }],
      },
    });

    expect(goodResp.statusCode).toBe(200);
  });
});
