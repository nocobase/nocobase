/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer } from '@nocobase/test';
import { ACL } from '@nocobase/acl';
import { prepareApp } from './prepare';

describe('association operate', async () => {
  let app: MockServer;
  let db: MockDatabase;
  let acl: ACL;
  let admin;
  let adminAgent;

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.acl;

    const UserRepo = db.getCollection('users').repository;

    admin = await UserRepo.create({
      values: {
        roles: ['admin'],
      },
    });

    adminAgent = await app.agent().login(admin);
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('should not allow to change associations', async () => {
    await db.getCollection('collections').repository.create({
      values: {
        name: 'comments',
        fields: [
          {
            name: 'content',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await db.getCollection('collections').repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'comments',
            type: 'hasMany',
            target: 'comments',
            interface: 'linkTo',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test-role',
      },
    });

    await adminAgent.resource('roles.resources', 'test-role').create({
      values: {
        usingActionsConfig: true,
        name: 'comments',
        actions: [
          {
            name: 'update',
          },
        ],
      },
    });

    expect(
      acl.can({
        role: 'test-role',
        resource: 'comments',
        action: 'add',
      }),
    ).toBeNull();
  });

  it('should allow to change associations', async () => {
    await db.getCollection('collections').repository.create({
      values: {
        name: 'comments',
        fields: [
          {
            name: 'content',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await db.getCollection('collections').repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'comments',
            type: 'hasMany',
            target: 'comments',
            interface: 'linkTo',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('posts').create({
      values: {
        title: 'test-post',
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test-role',
      },
    });

    await adminAgent.resource('roles.resources', 'test-role').create({
      values: {
        usingActionsConfig: true,
        name: 'posts',
        actions: [
          {
            name: 'update',
            fields: ['comments'],
          },
        ],
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const agent = await app.agent().login(user);

    const res = await agent.resource('posts.comments', 1).add({
      values: [],
    });

    expect(res.status).toBe(200);
  });

  it('should not allow to change associations', async () => {
    await db.getCollection('collections').repository.create({
      values: {
        name: 'comments',
        fields: [
          {
            name: 'content',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await db.getCollection('collections').repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'comments',
            type: 'hasMany',
            target: 'comments',
            interface: 'linkTo',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('posts').create({
      values: {
        title: 'test-post',
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test-role',
      },
    });

    await adminAgent.resource('roles.resources', 'test-role').create({
      values: {
        usingActionsConfig: true,
        name: 'posts',
        actions: [
          {
            name: 'update',
            fields: ['title'],
          },
        ],
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const agent = await app.agent().login(user);

    const res = await agent.resource('posts.comments', 1).add({
      values: [],
    });

    expect(res.status).toBe(403);
  });

  it('should allow to change associations when has snippets', async () => {
    await db.getCollection('collections').repository.create({
      values: {
        name: 'comments',
        fields: [
          {
            name: 'content',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await db.getCollection('collections').repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'comments',
            type: 'hasMany',
            target: 'comments',
            interface: 'linkTo',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('posts').create({
      values: {
        title: 'test-post',
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test-role',
        snippets: ['pm', 'pm.*'],
      },
    });

    acl.registerSnippet({
      name: `pm.test`,
      actions: ['posts.comments:add'],
    });

    await adminAgent.resource('roles.resources', 'test-role').create({
      values: {
        usingActionsConfig: true,
        name: 'posts',
        actions: [
          {
            name: 'update',
            fields: ['title'],
          },
        ],
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['test-role'],
      },
    });

    const agent = await app.agent().login(user);
    const res = await agent.resource('posts.comments', 1).add({
      values: [],
    });

    expect(res.status).toBe(200);
  });
});
