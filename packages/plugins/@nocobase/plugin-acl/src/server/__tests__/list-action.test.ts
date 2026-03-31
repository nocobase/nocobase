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

describe('list action with acl', () => {
  let app: MockServer;
  let Post;
  let userAgent;

  beforeEach(async () => {
    app = await prepareApp();
    const UserRepo = app.db.getCollection('users').repository;
    const users = await UserRepo.create({
      values: [
        { id: 2, nickname: 'a', roles: [{ name: 'user' }] },
        { id: 3, nickname: 'b', roles: [{ name: 'user' }] },
      ],
    });
    userAgent = await app.agent().login(users[0], 'user');

    Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
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

    const response = await userAgent.resource('posts').list({
      fields: ['title', 'comments'],
    });

    expect(response.status).toBe(200);
    const { data } = response.body;
    expect(data[0].title).toBeDefined();
    expect(data[0].comments[0].content).toBeDefined();
  });
});
