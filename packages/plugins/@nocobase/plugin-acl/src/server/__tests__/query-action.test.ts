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

describe('query action with acl', () => {
  let app: MockServer;
  let Post;
  let userAgent;
  let currentUser;

  beforeEach(async () => {
    app = await prepareApp();
    const userRepo = app.db.getCollection('users').repository;
    [currentUser] = await userRepo.create({
      values: [{ nickname: 'u1', roles: [{ name: 'test' }] }],
    });
    userAgent = await app.agent().login(currentUser);

    Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'string', name: 'status' },
        {
          type: 'belongsTo',
          name: 'author',
          target: 'users',
          foreignKey: 'authorId',
          targetKey: 'id',
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: [
        { title: 'p1', status: 'draft', authorId: currentUser.get('id') },
        { title: 'p2', status: 'published', authorId: currentUser.get('id') },
      ],
    });

    app.resourceManager.use(
      (ctx, next) => {
        ctx.state.currentRole = 'test';
        ctx.state.currentRoles = ['test'];
        return next();
      },
      {
        before: 'acl',
      },
    );
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should allow query through view permission alias', async () => {
    const role = app.acl.define({
      role: 'test',
    });

    role.grantAction('posts:view', {
      fields: ['status'],
    });

    const response = await userAgent.resource('posts').query({
      values: {
        measures: [
          {
            field: ['id'],
            aggregation: 'count',
            alias: 'count',
          },
        ],
        dimensions: [
          {
            field: ['status'],
            alias: 'status',
          },
        ],
        orders: [{ field: ['status'], alias: 'status', order: 'asc' }],
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject([{ status: 'draft' }, { status: 'published' }]);
    expect(response.body.data[0].count).toBeUndefined();
  });

  it('should keep permitted relation fields only', async () => {
    const role = app.acl.define({
      role: 'test',
    });

    role.grantAction('posts:view', {
      fields: ['status', 'author'],
    });

    role.grantAction('users:view', {
      fields: ['nickname'],
    });

    const response = await userAgent.resource('posts').query({
      values: {
        dimensions: [
          {
            field: ['status'],
            alias: 'status',
          },
          {
            field: ['author', 'nickname'],
            alias: 'authorName',
          },
          {
            field: ['author', 'email'],
            alias: 'authorEmail',
          },
        ],
        orders: [{ field: ['status'], alias: 'status', order: 'asc' }],
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject([
      { status: 'draft', authorName: 'u1' },
      { status: 'published', authorName: 'u1' },
    ]);
    expect(response.body.data[0].authorEmail).toBeUndefined();
  });

  it('should reject query when resource view permission is missing', async () => {
    const response = await userAgent.resource('posts').query({
      values: {
        dimensions: [
          {
            field: ['status'],
            alias: 'status',
          },
        ],
      },
    });

    expect(response.status).toBe(403);
    expect(response.body.errors[0].message).toBe('No permissions');
  });
});
