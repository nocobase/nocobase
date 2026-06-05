/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, getConfigByEnv } from '@nocobase/database';
import { SequelizeCollectionManager, SequelizeDataSource } from '@nocobase/data-source-manager';
import { MockServer, sleep } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import { prepareApp } from './prepare';

describe('list action with acl', () => {
  let app: MockServer;

  let Post;

  let userAgent;
  let users;

  beforeEach(async () => {
    app = await prepareApp();
    const UserRepo = app.db.getCollection('users').repository;
    users = await UserRepo.create({
      values: [
        { id: 2, nickname: 'a', roles: [{ name: 'user' }] },
        { id: 3, nickname: 'a', roles: [{ name: 'user' }] },
      ],
    });
    userAgent = await app.agent().login(users[0], 'user');

    Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'bigInt',
          name: 'createdById',
        },
        {
          type: 'belongsTo',
          name: 'createdBy',
          target: 'users',
        },
        {
          type: 'hasMany',
          name: 'comments',
          target: 'comments',
        },
      ],
    });

    app.db.collection({
      name: 'comments',
      fields: [
        {
          type: 'string',
          name: 'content',
        },
      ],
    });

    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should list with meta permission that has difference primary key', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    app.acl.addFixedParams('tests', 'destroy', () => {
      return {
        filter: {
          $and: [{ 'name.$ne': 't1' }, { 'name.$ne': 't2' }],
        },
      };
    });

    userRole.grantAction('tests:view', {});

    userRole.grantAction('tests:update', {
      own: true,
    });

    userRole.grantAction('tests:destroy', {});

    const Test = app.db.collection({
      name: 'tests',
      fields: [
        { type: 'string', name: 'name', primaryKey: true },
        {
          type: 'bigInt',
          name: 'createdById',
        },
      ],
      autoGenId: false,
      filterTargetKey: 'name',
    });

    await app.db.sync();

    await Test.repository.create({
      values: [
        { name: 't1', createdById: 1 },
        { name: 't2', createdById: 1 },
        { name: 't3', createdById: 2 },
      ],
    });

    app.resourcer.use(
      (ctx, next) => {
        ctx.state.currentRole = 'user';
        ctx.state.currentUser = {
          id: 1,
        };

        return next();
      },
      {
        before: 'acl',
        after: 'auth',
      },
    );

    //@ts-ignore
    const response = await userAgent.set('X-With-ACL-Meta', true).resource('tests').list({});

    const data = response.body;
    expect(data.meta.allowedActions.view).toEqual(['t1', 't2', 't3']);
    expect(data.meta.allowedActions.update).toEqual(['t1', 't2']);
    expect(data.meta.allowedActions.destroy).toEqual(['t3']);
  });

  it('should list items meta permissions by association field', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    userRole.grantAction('posts:view', {});

    userRole.grantAction('posts:update', {
      filter: {
        'createdBy.id': '{{ ctx.state.currentUser.id }}',
      },
    });

    await Post.repository.create({
      values: [
        { title: 'p1', createdById: users[0].id },
        { title: 'p2', createdById: users[0].id },
        { title: 'p3', createdById: users[1].id },
      ],
    });

    // app.resourcer.use(
    //   (ctx, next) => {
    //     ctx.state.currentRole = 'user';
    //     ctx.state.currentUser = {
    //       id: 1,
    //     };

    //     return next();
    //   },
    //   {
    //     before: 'acl',
    //     after: 'auth',
    //   },
    // );

    // @ts-ignore
    const response = await (await app.agent().login(users[0].id, 'user'))
      .set('X-With-ACL-Meta', true)
      .resource('posts')
      .list();
    const data = response.body;
    expect(data.meta.allowedActions.view).toEqual(expect.arrayContaining([1, 2, 3]));
    expect(data.meta.allowedActions.update).toEqual(expect.arrayContaining([1, 2]));
    expect(data.meta.allowedActions.destroy).toEqual([]);
  });

  it('should list items meta permissions by m2m association field', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    const Tag = app.db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name' }],
    });

    app.db.extendCollection({
      name: 'posts',
      fields: [
        {
          type: 'belongsToMany',
          name: 'tags',
          through: 'posts_tags',
        },
      ],
    });
    await app.db.sync();

    await Tag.repository.create({
      values: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    });
    await Post.repository.create({
      values: [
        { title: 'p1', tags: [1, 2] },
        { title: 'p2', tags: [1, 3] },
        { title: 'p3', tags: [2, 3] },
      ],
    });

    userRole.grantAction('posts:view', {});

    userRole.grantAction('posts:update', {
      filter: {
        $and: [
          {
            tags: {
              name: {
                $includes: 'c',
              },
            },
          },
        ],
      },
    });

    // @ts-ignore
    const response = await (await app.agent().login(users[0].id, 'user'))
      .set('X-With-ACL-Meta', true)
      .resource('posts')
      .list();
    const data = response.body;
    expect(data.meta.allowedActions.view).toEqual([1, 2, 3]);
    expect(data.meta.allowedActions.update).toEqual([2, 3]);
    expect(data.meta.allowedActions.destroy).toEqual([]);
  });
});

describe('list association action with acl', () => {
  let app;
  let db: Database;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;

    app.db.collection({
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

    app.db.collection({
      name: 'comments',
      fields: [
        {
          type: 'string',
          name: 'content',
        },
        {
          type: 'belongsTo',
          name: 'post',
        },
      ],
    });

    await app.db.sync();
  });

  it('should list allowedActions', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'newRole',
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['newRole'],
      },
    });

    await db.getRepository('roles.resources', 'newRole').create({
      values: [
        {
          name: 'posts',
          usingActionConfig: true,
          actions: [
            {
              name: 'view',
              fields: ['title', 'comments'],
            },
            {
              name: 'create',
              fields: ['title', 'comments'],
            },
          ],
        },
        {
          name: 'comments',
          usingActionConfig: true,
          actions: [
            {
              name: 'create',
            },
          ],
        },
      ],
    });

    const userAgent = await (await app.agent().login(user, 'newRole')).set('X-With-ACL-Meta', true);

    const createResp = await userAgent.resource('posts').create({
      values: {
        title: 'post1',
        comments: [{ content: 'comment1' }, { content: 'comment2' }],
      },
      updateAssociationValues: ['comments'],
    });

    expect(createResp.statusCode).toBe(200);

    const listPostsResp = await userAgent.resource('posts').list({});
    expect(listPostsResp.statusCode).toEqual(200);

    // list comments
    const commentsResponse0 = await userAgent.resource('posts.comments', 1).list({});
    expect(commentsResponse0.statusCode).toEqual(403);

    await db.getRepository('roles.resources', 'newRole').create({
      values: {
        name: 'comments',
        usingActionConfig: true,
        actions: [
          {
            name: 'view',
          },
        ],
      },
    });

    const commentsResponse = await userAgent.resource('posts.comments', 1).list({});
    expect(commentsResponse.statusCode).toEqual(200);

    const data = commentsResponse.body;

    /**
     * allowedActions.view == [1]
     * allowedActions.update = []
     * allowedActions.destroy = []
     */
    expect(data['meta']['allowedActions']).toBeDefined();
    expect(data['meta']['allowedActions'].view).toContain(1);
    expect(data['meta']['allowedActions'].view).toContain(2);
  });
});

describe('external data source acl meta', () => {
  let app: MockServer;

  afterEach(async () => {
    await app.destroy();
  });

  it('should list external data source items with acl meta', async () => {
    app = await prepareApp();
    app.dataSourceManager.factory.register('sequelize', SequelizeDataSource);

    await app.db.getRepository('dataSources').create({
      values: {
        key: 'another',
        name: 'Another Data Source',
        type: 'sequelize',
        options: {
          collectionManager: {
            ...getConfigByEnv(),
            tablePrefix: `t${uid(5)}`,
          },
        },
      },
    });

    const loadStart = Date.now();
    let another = app.dataSourceManager.dataSources.get('another');
    while (!another?.collectionManager) {
      if (Date.now() - loadStart >= 5000) {
        throw new Error('Timed out waiting for the "another" data source to load');
      }
      await sleep(200);
      another = app.dataSourceManager.dataSources.get('another');
    }

    const anotherDB = (another.collectionManager as SequelizeCollectionManager).db;

    anotherDB.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'bigInt', name: 'createdById' },
        {
          type: 'belongsTo',
          name: 'createdBy',
          target: 'users',
        },
      ],
    });
    anotherDB.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'nickname' }],
    });
    await anotherDB.sync();

    await app.db.getRepository('roles').create({
      values: {
        name: 'testRole',
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    await anotherDB.getRepository('users').create({
      values: [{ id: 999999, nickname: 'external-user-2' }],
    });

    await anotherDB.getRepository('posts').create({
      values: [
        { title: 'p1', createdById: testUser.id },
        { title: 'p2', createdById: 999999 },
      ],
    });

    const adminUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const adminAgent: any = await app.agent().login(adminUser);

    await adminAgent.resource('dataSources.roles', 'another').update({
      filterByTk: 'testRole',
      values: {
        strategy: {
          actions: ['view'],
        },
      },
    });

    const externalAcl = app.dataSourceManager.dataSources.get('another').acl;
    const externalRole = externalAcl.define({
      role: 'testRole',
    });
    externalRole.grantAction('posts:view', {});
    externalRole.grantAction('posts:update', {
      filter: {
        createdById: '{{ $user.id }}',
      },
    });

    // @ts-ignore
    const listRes = await (await app.agent().login(testUser, 'testRole'))
      .set('X-data-source', 'another')
      .set('X-With-ACL-Meta', true)
      .resource('api/posts')
      .list({});

    expect(listRes.status).toBe(200);
    expect(listRes.body.meta.allowedActions.view).toEqual([1, 2]);
    expect(listRes.body.meta.allowedActions.update).toEqual([1]);
    expect(listRes.body.meta.allowedActions.destroy).toEqual([]);
  });
});
