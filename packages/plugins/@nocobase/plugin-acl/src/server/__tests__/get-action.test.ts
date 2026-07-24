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

  async function setupApp(options?: Parameters<typeof prepareApp>[0]) {
    app = await prepareApp(options);
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
  }

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  function useCurrentRole(role = 'test') {
    app.resourceManager.use(
      (ctx, next) => {
        ctx.state.currentRole = role;
        return next();
      },
      {
        before: 'acl',
      },
    );
  }

  it('should get with fields', async () => {
    await setupApp();

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

    useCurrentRole();

    const response = await userAgent.resource('posts').get({
      filterByTk: p1.get('id'),
      fields: ['comments'],
    });

    expect(response.status).toBe(200);

    // expect only has comments
    expect(response.body.data.title).toBeUndefined();
    expect(response.body.data.comments).toBeDefined();
  });

  it('should keep nested many-to-many file table fields allowed by association target permissions for templates', async () => {
    await setupApp({
      plugins: ['file-manager'],
    });

    app.db.collection({
      name: 'files',
      template: 'file',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'text',
          name: 'url',
        },
      ],
    });

    Comment.setField('files', {
      type: 'belongsToMany',
      target: 'files',
      through: 'comments_files',
    });

    await app.db.sync();

    const testRole = app.acl.define({
      role: 'test',
    });

    testRole.grantAction('posts:view', {
      fields: ['title', 'comments'],
    });

    testRole.grantAction('comments:view', {
      fields: ['content', 'files'],
    });

    testRole.grantAction('files:view', {
      fields: ['title'],
    });

    const [p1] = await Post.repository.create({
      values: [
        {
          title: 'p1',
          comments: [
            {
              content: 'c1',
              files: [
                {
                  title: 'file1',
                  url: 'https://example.com/file1.png',
                },
              ],
            },
          ],
        },
      ],
    });

    useCurrentRole();

    const response = await userAgent.resource('posts').get({
      filterByTk: p1.get('id'),
      fields: ['comments', 'comments.files'],
      isTemplate: true,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.comments[0].files[0].title).toBe('file1');
    expect(response.body.data.comments[0].files[0].url).toBeUndefined();
  });

  it('should keep nested attachment fields allowed by attachment field permissions for templates', async () => {
    await setupApp({
      plugins: ['file-manager'],
    });

    Comment.setField('attachments', {
      type: 'belongsToMany',
      target: 'attachments',
      through: 'comments_attachments',
      interface: 'attachment',
    });

    await app.db.sync();

    const testRole = app.acl.define({
      role: 'test',
    });

    testRole.grantAction('posts:view', {
      fields: ['title', 'comments'],
    });

    testRole.grantAction('comments:view', {
      fields: ['content', 'attachments'],
    });

    const [p1] = await Post.repository.create({
      values: [
        {
          title: 'p1',
          comments: [
            {
              content: 'c1',
              attachments: [
                {
                  title: 'file1',
                  url: 'https://example.com/file1.png',
                },
              ],
            },
          ],
        },
      ],
    });

    useCurrentRole();

    const response = await userAgent.resource('posts').get({
      filterByTk: p1.get('id'),
      fields: ['comments', 'comments.attachments'],
      isTemplate: true,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.comments[0].attachments[0].title).toBe('file1');
    expect(response.body.data.comments[0].attachments[0].url).toBe('https://example.com/file1.png');
  });
});
