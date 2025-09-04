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

describe('list action with acl', () => {
  let app: MockServer;

  let Post;

  let Comment;
  let userAgent;
  let users;

  beforeEach(async () => {
    app = await prepareApp();
    const UserRepo = app.db.getCollection('users').repository;
    const root = await UserRepo.findOne({});
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

    Comment = app.db.collection({
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

  it('should list associations with fields filter', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    userRole.grantAction('posts:view', {
      fields: ['title', 'comments'],
    });

    userRole.grantAction('comments:view', {
      fields: ['content'],
    });

    await Post.repository.create({
      updateAssociationValues: ['comments'],
      values: [
        {
          title: 'p1',
          comments: [{ content: 'c1' }, { content: 'c2' }],
        },
      ],
    });

    app.resourceManager.use(
      (ctx, next) => {
        ctx.state.currentRole = 'user';
        return next();
      },
      {
        before: 'acl',
      },
    );

    const response = await userAgent
      .set('X-With-ACL-Meta', true)
      .resource('posts')
      .list({
        fields: ['title', 'comments'],
      });

    expect(response.status).toBe(200);
    const { data } = response.body;
    expect(data[0].title).toBeDefined();
    expect(data[0].comments[0].content).toBeDefined();
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

  it('should list items with meta permission', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    userRole.grantAction('posts:view', {});

    userRole.grantAction('posts:update', {
      own: true,
    });

    await Post.repository.create({
      values: [
        { title: 'p1', createdById: 1 },
        { title: 'p2', createdById: 1 },
        { title: 'p3', createdById: 2 },
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

    // @ts-ignore
    const response = await userAgent.set('X-With-ACL-Meta', true).resource('posts').list({});

    const data = response.body;
    expect(data.meta.allowedActions.view).toEqual([1, 2, 3]);
    expect(data.meta.allowedActions.update).toEqual([1, 2]);
    expect(data.meta.allowedActions.destroy).toEqual([]);
  });

  it('should response item permission when request get action', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    userRole.grantAction('posts:view', {});

    userRole.grantAction('posts:update', {
      own: true,
    });

    await Post.repository.create({
      values: [
        { title: 'p1', createdById: 1 },
        { title: 'p2', createdById: 1 },
        { title: 'p3', createdById: 2 },
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

    // @ts-ignore
    const getResponse = await userAgent.set('X-With-ACL-Meta', true).resource('posts').get({
      filterByTk: 1,
    });

    const getBody = getResponse.body;

    expect(getBody.meta.allowedActions).toBeDefined();
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
      updateAssociationValues: ['actions'],
      values: {
        name: 'comments',
        usingActionConfig: true,
        actions: [
          {
            name: 'create',
            fields: ['content', 'post'],
          },
        ],
      },
    });

    await db.getRepository('roles.resources', 'newRole').create({
      values: {
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
    });

    const userAgent = await (await app.agent().login(user, 'newRole')).set('X-With-ACL-Meta', true);

    const createResp = await userAgent.resource('posts').create({
      updateAssociationValues: ['comments'],
      values: {
        title: 'post1',
        comments: [{ content: 'comment1' }, { content: 'comment2' }],
      },
    });

    expect(createResp.statusCode).toBe(200);

    const listPostsResp = await userAgent.resource('posts').list({});
    expect(listPostsResp.statusCode).toEqual(200);

    // list comments
    const commentsResponse0 = await userAgent.resource('posts.comments', 1).list({});
    expect(commentsResponse0.statusCode).toEqual(403);

    const model = await db.getRepository('roles.resources', 'newRole').create({
      updateAssociationValues: ['actions'],
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
