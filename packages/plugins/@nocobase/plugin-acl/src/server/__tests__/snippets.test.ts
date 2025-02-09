/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('snippet', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await prepareApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it.skip('should not allow to create collections when global allow create', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'testRole',
        strategy: { actions: ['view', 'update:own', 'destroy:own', 'create'] },
        snippets: ['!ui.*', '!pm', '!pm.*'],
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const userPlugin: any = app.getPlugin('users');
    const userAgent: any = await app.agent().login(user);
    const createCollectionResponse = await userAgent.resource('collections').create({});

    expect(createCollectionResponse.statusCode).toEqual(403);
  });

  it('should allowed when snippet not allowed but resource allowed', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'testRole',
        strategy: { actions: ['view'] },
        snippets: ['!ui.*', '!pm', '!pm.*'],
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const userAgent: any = await app.agent().login(testUser);

    const listResp = await userAgent.resource('users').list();

    expect(listResp.statusCode).toEqual(200);
  });

  it('should allow to get roles ', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'testRole',
        strategy: { actions: ['view'] },
        snippets: ['pm.acl.roles'],
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const userAgent: any = await app.agent().login(testUser);

    const getResp = await userAgent.resource('dataSources.roles', 'main').get({
      filterByTk: 'testRole',
    });

    expect(getResp.statusCode).toEqual(200);
  });

  it('should allow to get roles dataSourceCollections', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'testRole',
        snippets: ['pm.acl.roles'],
      },
    });

    const canRes = app.acl.can({
      role: 'testRole',
      action: 'list',
      resource: 'roles.dataSourcesCollections',
    });

    expect(canRes).toBeTruthy();

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const userAgent: any = await app.agent().login(testUser);

    const getResp = await userAgent.resource('roles.dataSourcesCollections', 'testRole').list({
      filter: {
        dataSourceKey: 'main',
      },
    });

    expect(getResp.statusCode).toEqual(200);
  });
});
