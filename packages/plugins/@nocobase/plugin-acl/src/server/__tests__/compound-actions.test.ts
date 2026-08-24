/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeDataSource } from '@nocobase/data-source-manager';
import { createMockDatabase, MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('compound actions with ACL', () => {
  let app: MockServer;
  let userId: number;

  beforeEach(async () => {
    app = await prepareApp();

    app.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'slug', unique: true },
        { type: 'string', name: 'title' },
        { type: 'string', name: 'secret' },
      ],
    });

    await app.db.sync();

    const user = await app.db.getRepository('users').findOne();
    userId = user.get('id');

    const role = app.acl.define({ role: 'create-only' });
    role.grantAction('posts:create', {});

    app.resourcer.use(
      (ctx, next) => {
        ctx.state.currentRole = 'create-only';
        ctx.state.currentRoles = ['create-only'];
        return next();
      },
      {
        before: 'acl',
        after: 'auth',
      },
    );
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('rejects firstOrCreate when an existing record lacks view permission', async () => {
    await app.db.getRepository('posts').create({
      values: {
        slug: 'existing-post',
        title: 'private title',
      },
    });

    const viewResponse = await (await app.agent().login(userId)).resource('posts').get({
      filter: {
        slug: 'existing-post',
      },
    });
    expect(viewResponse.statusCode).toBe(403);

    const response = await (await app.agent().login(userId)).resource('posts').firstOrCreate({
      filterKeys: ['slug'],
      values: {
        slug: 'existing-post',
      },
    });

    expect(response.statusCode).toBe(403);

    const created = await (await app.agent().login(userId)).resource('posts').firstOrCreate({
      filterKeys: ['slug'],
      values: { slug: 'created-post', title: 'created title' },
    });
    expect(created.statusCode).toBe(200);

    app.acl.getRole('create-only').grantAction('posts:view', {
      filter: { slug: 'existing-post' },
      fields: ['slug'],
    });
    const allowed = await (await app.agent().login(userId)).resource('posts').firstOrCreate({
      filterKeys: ['slug'],
      fields: ['slug', 'title'],
      values: { slug: 'existing-post' },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.body.data.slug).toBe('existing-post');
    expect(allowed.body.data).not.toHaveProperty('title');

    await app.db.getRepository('posts').create({ values: { slug: 'outside-scope' } });
    const outsideScope = await (await app.agent().login(userId)).resource('posts').firstOrCreate({
      filterKeys: ['slug'],
      values: { slug: 'outside-scope' },
    });
    expect(outsideScope.statusCode).toBe(403);
    expect(await app.db.getRepository('posts').count({ filter: { slug: 'outside-scope' } })).toBe(1);
  });

  it('rejects updateOrCreate when an existing record lacks update permission', async () => {
    const post = await app.db.getRepository('posts').create({
      values: {
        slug: 'existing-post',
        title: 'original title',
      },
    });

    const updateResponse = await (await app.agent().login(userId)).resource('posts').update({
      filterByTk: post.get('id'),
      values: {
        title: 'updated directly',
      },
    });
    expect(updateResponse.statusCode).toBe(403);

    const response = await (await app.agent().login(userId)).resource('posts').updateOrCreate({
      filterKeys: ['slug'],
      values: {
        slug: 'existing-post',
        title: 'updated through compound action',
      },
    });

    expect(response.statusCode).toBe(403);
    await post.reload();
    expect(post.get('title')).toBe('original title');

    const created = await (await app.agent().login(userId)).resource('posts').updateOrCreate({
      filterKeys: ['slug'],
      values: { slug: 'created-post', title: 'created title' },
    });
    expect(created.statusCode).toBe(200);

    app.acl.getRole('create-only').grantAction('posts:update', {
      filter: { slug: 'existing-post' },
      fields: ['title'],
    });
    const allowed = await (await app.agent().login(userId)).resource('posts').updateOrCreate({
      filterKeys: ['slug'],
      values: {
        slug: 'existing-post',
        title: 'allowed title',
        secret: 'forbidden secret',
      },
    });
    expect(allowed.statusCode).toBe(200);
    await post.reload();
    expect(post.get('title')).toBe('allowed title');
    expect(post.get('secret')).toBeNull();

    await app.db.getRepository('posts').create({ values: { slug: 'outside-scope', title: 'original' } });
    const outsideScope = await (await app.agent().login(userId)).resource('posts').updateOrCreate({
      filterKeys: ['slug'],
      values: { slug: 'outside-scope', title: 'forbidden' },
    });
    expect(outsideScope.statusCode).toBe(403);
    const unchanged = await app.db.getRepository('posts').findOne({ filter: { slug: 'outside-scope' } });
    expect(unchanged.get('title')).toBe('original');
  });

  it('enforces actual action permissions for external data sources', async () => {
    const database = await createMockDatabase({ tablePrefix: 'compound_acl_ds_' });
    const dataSource = new SequelizeDataSource({
      name: 'compound-acl-ds',
      resourceManager: { prefix: app.resourcer.options.prefix },
      collectionManager: { database },
    });
    dataSource.collectionManager.defineCollection({
      name: 'externalPosts',
      fields: [
        { type: 'string', name: 'slug', unique: true },
        { type: 'string', name: 'title' },
      ],
    });
    await dataSource.collectionManager.sync();
    await app.dataSourceManager.add(dataSource);

    const role = dataSource.acl.define({ role: 'external-create-only' });
    role.grantAction('externalPosts:create', {});
    let externalRoleName = 'external-create-only';
    dataSource.resourceManager.use(
      (ctx, next) => {
        ctx.state.currentRole = externalRoleName;
        ctx.state.currentRoles = [externalRoleName];
        return next();
      },
      { before: 'acl', after: 'auth' },
    );

    const repository = dataSource.collectionManager.getRepository('externalPosts');
    const existing = await repository.create({ values: { slug: 'existing', title: 'private' } });
    const agent = await app.agent().login(userId);

    const readResponse = await agent
      .resource('externalPosts')
      .firstOrCreate({ filterKeys: ['slug'], values: { slug: 'existing' } })
      .set('x-data-source', 'compound-acl-ds');
    expect(readResponse.statusCode).toBe(403);

    const updateResponse = await agent
      .resource('externalPosts')
      .updateOrCreate({ filterKeys: ['slug'], values: { slug: 'existing', title: 'overwritten' } })
      .set('x-data-source', 'compound-acl-ds');
    expect(updateResponse.statusCode).toBe(403);
    await existing.reload();
    expect(existing.get('title')).toBe('private');

    const created = await agent
      .resource('externalPosts')
      .updateOrCreate({ filterKeys: ['slug'], values: { slug: 'created', title: 'allowed' } })
      .set('x-data-source', 'compound-acl-ds');
    expect(created.statusCode).toBe(200);

    dataSource.acl.define({ role: 'external-no-access' });
    externalRoleName = 'external-no-access';
    const deniedCreate = await agent
      .resource('externalPosts')
      .updateOrCreate({ filterKeys: ['slug'], values: { slug: 'denied', title: 'forbidden' } })
      .set('x-data-source', 'compound-acl-ds');
    expect(deniedCreate.statusCode).toBe(403);
    expect(await repository.count({ filter: { slug: 'denied' } })).toBe(0);
  });
});
