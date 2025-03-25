/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import { MockDataSource } from './mock-data-source';
import { checkPermission } from '../actions/query';

describe('external data source', () => {
  let ctx: any;
  let app: MockServer;
  let db: MockDatabase;
  let adminAgent: any;
  beforeAll(async () => {
    process.env.INIT_ROOT_USERNAME = 'test';
    app = await createMockServer({
      plugins: ['field-sort', 'data-source-manager', 'users', 'acl', 'auth', 'system-settings'],
    });
    db = app.db;
    ctx = {
      app,
      db,
    };
    app.dataSourceManager.factory.register('mock', MockDataSource);
    await app.db.getRepository('dataSources').create({
      values: {
        key: 'mockInstance1',
        type: 'mock',
        displayName: 'Mock',
        options: {},
      },
    });
    const adminUser = await app.db.getRepository('users').findOne({
      filter: {
        username: process.env.INIT_ROOT_USERNAME,
      },
    });
    adminAgent = await app.agent().login(adminUser);
  });

  it('should check permission for external data source', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'test',
        title: 'test',
      },
    });
    const context = {
      ...ctx,
      state: {
        currentRole: 'test',
        currentRoles: ['test'],
      },
      action: {
        params: {
          values: {
            dataSource: 'mockInstance1',
            collection: 'posts',
          },
        },
      },
      throw: vi.fn(),
    };
    await checkPermission(context, async () => {});
    expect(context.throw).toBeCalledWith(403, 'No permissions');
    vi.resetAllMocks();
    await adminAgent.resource('dataSources.roles', 'mockInstance1').update({
      filterByTk: 'test',
      values: {
        strategy: {
          actions: ['view'],
        },
      },
    });
    await checkPermission(context, async () => {});
    expect(context.throw).not.toBeCalled();
  });
});
