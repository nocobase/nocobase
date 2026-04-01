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

  afterEach(async () => {
    await app.destroy();
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
        ctx.state.currentRoles = ['test'];
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

  it('should get nested relation field by target collection acl', async () => {
    const testRole = app.acl.define({
      role: 'test',
    });

    app.db.collection({
      name: 'attachments_test',
      fields: [{ type: 'string', name: 'filename' }],
    });

    app.db.collection({
      name: 'files_test',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'belongsTo',
          name: 'file',
          target: 'attachments_test',
        },
      ],
    });

    const Docs = app.db.collection({
      name: 'docs_test',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'files',
          target: 'files_test',
        },
      ],
    });

    await app.db.sync();

    testRole.grantAction('docs_test:view', {
      fields: ['files'],
    });

    testRole.grantAction('files_test:view', {
      fields: ['file'],
    });

    const record = await Docs.repository.create({
      values: {
        name: 'doc-1',
        files: [
          {
            title: 'entry-1',
            file: {
              filename: 'demo.png',
            },
          },
        ],
      },
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

    const response = await userAgent.resource('docs_test').get({
      filterByTk: record.get('id'),
      fields: ['files', 'files.file'],
    });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBeUndefined();
    expect(response.body.data.files).toBeDefined();
    expect(response.body.data.files[0].title).toBeUndefined();
    expect(response.body.data.files[0].file).toBeDefined();
    expect(response.body.data.files[0].file.filename).toBe('demo.png');
  });
});
