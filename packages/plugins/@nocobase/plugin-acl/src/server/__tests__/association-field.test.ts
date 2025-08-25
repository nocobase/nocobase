/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL } from '@nocobase/acl';
import { Database, HasManyRepository } from '@nocobase/database';
import UsersPlugin from '@nocobase/plugin-users';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('association test', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;

  let user;
  let userAgent;
  let admin;
  let adminAgent;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.acl;
  });

  it('should access association actions by target permission', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          { name: 'title', type: 'string' },
          { name: 'userComments', foreignKey: 'userId', type: 'hasMany', target: 'comments', interface: 'linkTo' },
        ],
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'comments',
        fields: [{ name: 'content', type: 'string' }],
      },
      context: {},
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test-role',
      },
      context: {},
    });

    // can view posts
    await db.getRepository('roles.resources', 'test-role').create({
      values: {
        name: 'posts',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            fields: ['userComments'],
          },
        ],
      },
      context: {},
    });

    const role = acl.getRole('test-role');

    // should not have association actions permission
    expect(
      acl.can({
        role: 'test-role',
        action: 'list',
        resource: 'posts.userComments',
      }),
    ).toBeFalsy();

    // can view comments
    await db.getRepository('roles.resources', 'test-role').create({
      values: {
        name: 'comments',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
          },
        ],
      },
      context: {},
    });

    const post = await db.getRepository('posts').create({
      values: {
        title: 'hello world',
        userComments: [{ content: 'comment 1' }],
      },
    });

    const UserRepo = db.getCollection('users').repository;
    const user = await UserRepo.create({
      values: {
        roles: ['test-role'],
      },
    });

    const userAgent = await app.agent().login(user);

    const postCommentsResp = await userAgent.resource('posts.userComments', post.get('id')).list({});
    expect(postCommentsResp.statusCode).toEqual(200);
  });

  it('should forbid creating nested association without target permission', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          { name: 'title', type: 'string' },
          { name: 'userComments', foreignKey: 'userId', type: 'hasMany', target: 'comments', interface: 'linkTo' },
        ],
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'comments',
        fields: [{ name: 'content', type: 'string' }],
      },
      context: {},
    });

    // role only has create posts permission
    await db.getRepository('roles').create({
      values: { name: 'limited-role' },
      context: {},
    });

    await db.getRepository('roles.resources', 'limited-role').create({
      values: {
        name: 'posts',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
          },
        ],
      },
      context: {},
    });

    const UserRepo = db.getCollection('users').repository;
    const user = await UserRepo.create({ values: { roles: ['limited-role'] } });
    const userAgent = await app.agent().login(user);

    const resp = await userAgent.resource('posts').create({
      values: {
        title: 'post with comments',
        userComments: [{ content: 'c1' }],
      },
      updateAssociationValues: ['userComments'],
    });

    expect(resp.statusCode).toEqual(403);
  });
});

describe.skip('association field acl', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;

  let user;
  let userAgent;
  let admin;
  let adminAgent;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.acl;

    await db.getRepository('roles').create({
      values: {
        name: 'new',
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'testAdmin',
        snippets: ['pm.*'],
      },
    });

    const UserRepo = db.getCollection('users').repository;

    user = await UserRepo.create({
      values: {
        roles: ['new'],
      },
    });

    admin = await UserRepo.create({
      values: {
        roles: ['testAdmin'],
      },
    });

    const userPlugin = app.getPlugin('users') as UsersPlugin;
    userAgent = await app.agent().login(user);

    adminAgent = await app.agent().login(admin);

    await db.getRepository('collections').create({
      values: {
        name: 'orders',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'users').create({
      values: {
        name: 'name',
        type: 'string',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'users').create({
      values: {
        name: 'age',
        type: 'integer',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'users').create({
      values: {
        interface: 'linkTo',
        name: 'orders',
        type: 'hasMany',
        target: 'orders',
      },
      context: {},
    });

    await db.getRepository('collections.fields', 'orders').create({
      values: {
        name: 'content',
        type: 'string',
      },
      context: {},
    });

    await adminAgent.resource('roles.resources', 'new').create({
      values: {
        name: 'users',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
            fields: ['orders'],
          },
          {
            name: 'view',
            fields: ['orders'],
          },
        ],
      },
    });

    await adminAgent.resource('roles.resources', 'new').create({
      values: {
        name: 'orders',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
          },
        ],
      },
    });
  });

  it('should revoke association action on action revoke', async () => {
    expect(
      acl.can({
        role: 'new',
        resource: 'users.orders',
        action: 'add',
      }),
    ).toBeNull();

    const viewAction = await db.getRepository('dataSourcesRolesResourcesActions').findOne({
      filter: {
        name: 'view',
      },
    });

    const actionId = viewAction.get('id') as number;

    const response = await adminAgent.resource('roles.resources', 'new').update({
      filter: {
        name: 'users',
        dataSourceKey: 'main',
      },
      values: {
        name: 'users',
        usingActionsConfig: true,
        actions: [
          {
            id: actionId,
          },
        ],
      },
    });

    expect(response.statusCode).toEqual(200);

    expect(
      acl.can({
        role: 'new',
        resource: 'users.orders',
        action: 'add',
      }),
    ).toBeNull();
  });

  it('should not redundant fields after field set', async () => {
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
        name: 'content',
        type: 'string',
      },
      context: {},
    });

    await adminAgent.resource('roles.resources', 'new').create({
      values: {
        name: 'posts',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
            fields: ['content', 'title'],
          },
        ],
      },
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'posts',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'posts',
      action: 'create',
      params: {
        whitelist: ['content', 'title'],
      },
    });

    await adminAgent.resource('collections').setFields({
      filterByTk: 'posts',
      values: {
        fields: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'content',
            type: 'text',
          },
        ],
      },
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'posts',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'posts',
      action: 'create',
      params: {
        whitelist: ['content', 'name'],
      },
    });
  });

  it('should revoke association action on field deleted', async () => {
    await adminAgent.resource('roles.resources', 'new').update({
      filter: {
        name: 'users',
        dataSourceKey: 'main',
      },
      values: {
        name: 'users',
        usingActionsConfig: true,
        actions: [
          {
            name: 'create',
            fields: ['name', 'age'],
          },
        ],
      },
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'users',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'users',
      action: 'create',
      params: {
        whitelist: ['age', 'name'],
      },
    });

    const roleResource = await db.getRepository('dataSourcesRolesResources').findOne({
      filter: {
        name: 'users',
      },
    });

    const action = await db
      .getRepository<HasManyRepository>('dataSourcesRolesResources.actions', roleResource.get('id') as string)
      .findOne({
        filter: {
          name: 'create',
        },
      });

    expect(action.get('fields').includes('name')).toBeTruthy();

    // remove field
    await db.getRepository<HasManyRepository>('collections.fields', 'users').destroy({
      filter: {
        name: 'name',
      },
      context: {},
    });

    expect(
      acl.can({
        role: 'new',
        resource: 'users',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'users',
      action: 'create',
      params: {
        whitelist: ['age'],
      },
    });
  });

  it('should allow association fields access', async () => {
    const createResponse = await userAgent.resource('users').create({
      values: {
        orders: [
          {
            content: 'apple',
          },
        ],
      },
    });

    expect(createResponse.statusCode).toEqual(200);

    const user = await db.getRepository('users').findOne({
      filterByTk: createResponse.body.data.id,
    });
    // @ts-ignore
    expect(await user.countOrders()).toEqual(1);

    expect(
      acl.can({
        role: 'new',
        resource: 'orders',
        action: 'list',
      }),
    ).toMatchObject({
      role: 'new',
      resource: 'orders',
      action: 'list',
    });
  });
});
