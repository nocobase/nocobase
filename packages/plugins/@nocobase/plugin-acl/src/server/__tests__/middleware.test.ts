/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL } from '@nocobase/acl';
import { Database, Model } from '@nocobase/database';
import UsersPlugin from '@nocobase/plugin-users';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('middleware', () => {
  let app: MockServer;
  let role: Model;
  let db: Database;
  let acl: ACL;
  let admin;
  let member;
  let adminAgent;
  let memberAgent;

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.acl;

    role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });

    const UserRepo = db.getCollection('users').repository;
    admin = await UserRepo.create({
      values: {
        roles: ['admin'],
      },
    });
    member = await UserRepo.create({
      values: {
        roles: ['member'],
      },
    });

    const role2 = await db.getRepository('roles').update({
      filterByTk: 'admin',
      values: {
        strategy: {
          actions: ['create'],
        },
      },
    });

    const userPlugin = app.getPlugin('users') as UsersPlugin;
    adminAgent = await app.agent().login(admin);
    memberAgent = await app.agent().login(member);

    await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'posts').create({
      values: {
        name: 'title',
        type: 'string',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'posts').create({
      values: {
        name: 'description',
        type: 'string',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'posts').create({
      values: {
        name: 'createdById',
        type: 'integer',
      },
      context: {},
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should no permission when createdById field not exists in collection', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'foos',
        autoGenId: false,
        fields: [
          {
            type: 'string',
            name: 'name',
            primaryKey: true,
          },
        ],
      },
      context: {},
    });

    await db.getRepository('roles').update({
      filterByTk: 'admin',
      values: {
        strategy: {
          actions: ['create', 'update:own'],
        },
      },
    });

    const response = await adminAgent.resource('foos').create({
      values: {
        name: 'foo-name',
      },
    });

    expect(response.statusCode).toEqual(200);

    const updateRes = await adminAgent.resource('foos').update({
      filterByTk: response.body.data.name,
    });

    expect(updateRes.statusCode).toEqual(403);
  });

  it('should throw 403 when no permission', async () => {
    await db.getRepository('roles').update({
      filterByTk: 'member',
      values: {
        strategy: {
          actions: ['view'],
        },
      },
    });
    const response = await (await app.agent().login(member)).resource('posts').create({
      values: {},
    });

    expect(response.statusCode).toEqual(403);
  });

  it('should return 200 when role has permission', async () => {
    await db.getRepository('roles').update({
      filterByTk: 'admin',
      values: {
        strategy: {
          actions: ['create:all'],
        },
      },
    });

    const response = await adminAgent.resource('posts').create({
      values: {},
    });

    expect(response.statusCode).toEqual(200);
  });

  it('should limit fields on view actions', async () => {
    const createResp = await adminAgent.resource('roles.resources', 'member').create({
      values: {
        name: 'posts',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
            fields: ['title', 'description'],
          },
          {
            name: 'view',
            fields: ['title'],
          },
        ],
      },
    });
    expect(createResp.statusCode).toEqual(200);

    const createPostResp = await memberAgent.resource('posts').create({
      values: {
        title: 'post-title',
        description: 'post-description',
      },
    });
    expect(createPostResp.statusCode).toEqual(200);

    const post = await db.getRepository('posts').findOne();
    expect(post.get('title')).toEqual('post-title');
    expect(post.get('description')).toEqual('post-description');

    const response = await memberAgent.resource('posts').list({});
    expect(response.statusCode).toEqual(200);

    const [data] = response.body.data;

    expect(data['id']).not.toBeUndefined();
    expect(data['title']).toEqual('post-title');
    expect(data['description']).toBeUndefined();
  });

  it('should parse template value on action params', async () => {
    const res = await adminAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        name: 'own',
        scope: {
          createdById: '{{ ctx.state.currentUser.id }}',
        },
      },
    });

    await adminAgent.resource('roles.resources', role.get('name')).create({
      values: {
        name: 'posts',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
            fields: ['title', 'description', 'createdById'],
          },
          {
            name: 'view',
            fields: ['title'],
            scope: res.body.data.id,
          },
        ],
      },
    });

    await adminAgent.resource('posts').create({
      values: {
        title: 't1',
        description: 'd1',
        createdById: 1,
      },
    });

    await adminAgent.resource('posts').create({
      values: {
        title: 't2',
        description: 'p2',
        createdById: 2,
      },
    });

    const response = await adminAgent.resource('posts').list();
    const data = response.body.data;
    expect(data.length).toEqual(1);
  });

  it('should change fields params to whitelist in create action', async () => {
    await adminAgent.resource('roles.resources', 'member').create({
      values: {
        name: 'posts',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
            fields: ['title'],
          },
        ],
      },
    });

    await memberAgent.resource('posts').create({
      values: {
        title: 'post-title',
        description: 'post-description',
      },
    });

    const post = await db.getRepository('posts').findOne();
    expect(post.get('title')).toEqual('post-title');
    expect(post.get('description')).toBeNull();
  });
});
