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

describe('get action with acl', () => {
  let app: MockServer;

  let Post;

  let Comment;
  let userAgent;

  beforeEach(async () => {
    app = await prepareApp();
    const UserRepo = app.db.getCollection('users').repository;
    const users = await UserRepo.create({
      values: [{ nickname: 'a', roles: [{ name: 'test' }] }],
    });
    userAgent = await app.agent().login(users[0]);

    Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'bigInt',
          name: 'createdById',
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

  it('should get with fields', async () => {
    const testRole = app.acl.define({
      role: 'test',
    });

    testRole.grantAction('posts:view', {
      fields: ['title', 'comments'],
    });

    testRole.grantAction('comments:view', {
      fields: ['content'],
    });

    const [p1] = await Post.repository.create({
      values: [
        {
          title: 'p1',
          comments: [{ content: 'c1' }, { content: 'c2' }],
        },
      ],
    });

    app.resourceManager.use(
      (ctx, next) => {
        ctx.state.currentRole = 'test';
        return next();
      },
      {
        before: 'acl',
      },
    );

    const response = await userAgent.resource('posts').get({
      filterByTk: p1.get('id'),
      fields: ['comments'],
    });

    expect(response.status).toBe(200);

    console.log(response.body);
    // expect only has comments
    expect(response.body.data.title).toBeUndefined();
    expect(response.body.data.comments).toBeDefined();
  });
});
