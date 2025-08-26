/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { ACL } from '@nocobase/acl';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { prepareApp } from './prepare';

describe('acl', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;
  let admin;
  let adminAgent;

  let userPlugin;

  let uiSchemaRepository: UiSchemaRepository;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.acl;

    const UserRepo = db.getCollection('users').repository;

    admin = await UserRepo.create({
      values: {
        roles: ['root', 'admin'],
      },
    });

    adminAgent = (await app.agent().login(admin)).set('x-role', 'root');
    uiSchemaRepository = db.getRepository('uiSchemas');
    await db.getRepository('collections').create({
      context: {},
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'boolean',
            name: 'published',
            defaultValue: true,
          },
        ],
      },
    });

    await db.getRepository('posts').create({
      values: {
        title: 'old title',
      },
    });

    const response = await adminAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: 'posts',
        name: 'published posts',
        scope: {
          published: true,
        },
      },
    });

    expect(response.statusCode).toEqual(200);

    const scope = await db.getRepository('dataSourcesRolesResourcesScopes').findOne({
      filter: {
        name: 'published posts',
      },
    });

    expect(scope.get('scope')).toMatchObject({
      published: true,
    });

    // assign scope to admin role
    const createResp = await adminAgent.resource('roles.resources', 'admin').create({
      values: {
        name: 'posts',
        usingActionsConfig: true,
        actions: [
          {
            name: 'update',
            scope: scope.id,
          },
        ],
      },
    });

    expect(createResp.statusCode).toEqual(200);
  });

  it('should throw error when filter is empty', async () => {
    const updateResp = await adminAgent.resource('posts').update({
      filter: {},
      values: {
        title: 'new title',
      },
    });

    expect(updateResp.statusCode).not.toBe(200);

    expect(
      await db.getRepository('posts').count({
        filter: {
          title: 'new title',
        },
      }),
    ).toBe(0);
  });

  it('should throw error when no filter is passed', async () => {
    const updateResp = await adminAgent.resource('posts').update({
      values: {
        title: 'new title',
      },
    });

    expect(updateResp.statusCode).not.toBe(200);
  });

  it('should not throw error when filter is not empty', async () => {
    const updateResp = await adminAgent.resource('posts').update({
      filter: {
        title: 'old title',
      },
      values: {
        title: 'new title',
      },
    });

    expect(updateResp.statusCode).toBe(200);
  });

  it('should not throw error when filter by tk is passed', async () => {
    const post = await db.getRepository('posts').findOne();

    const updateResp = await adminAgent.resource('posts').update({
      filterByTk: post.id,
      values: {
        title: 'new title',
      },
    });

    expect(updateResp.statusCode).toBe(200);
  });
});
