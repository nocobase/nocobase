/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerActions } from '@nocobase/actions';
import { MockServer, mockServer as actionMockServer } from './index';

describe('list action', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = actionMockServer();
    registerActions(app);

    const Post = app.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'hasMany', name: 'comments' },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
        { type: 'string', name: 'status', defaultValue: 'draft' },
      ],
    });

    const Tag = app.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'posts' },
      ],
    });

    app.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'string', name: 'status', defaultValue: 'draft' },
      ],
    });

    await app.db.sync();

    const t1 = await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    const t3 = await Tag.repository.create({
      values: {
        name: 't3',
      },
    });

    const p1 = await Post.repository.create({
      values: {
        title: 'pt1',
        tags: [t1.get('id'), t2.get('id')],
      },
    });

    await Post.repository.createMany({
      records: [
        {
          title: 'pt2',
          tags: [t2.get('id')],
        },
        {
          title: 'pt3',
          tags: [t3.get('id')],
        },
      ],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('list with pagination', async () => {
    const response = await app
      .agent()
      .resource('posts')
      .list({
        fields: ['id'],
        pageSize: 1,
        page: 2,
        sort: ['id'],
      });

    const body = response.body;
    expect(body.rows.length).toEqual(1);
    expect(body.rows[0]['id']).toEqual(2);
    expect(body.count).toEqual(3);
    expect(body.totalPage).toEqual(3);
  });

  test('list with non-paged', async () => {
    const response = await app.agent().resource('posts').list({
      paginate: false,
    });
    const body = response.body;
    expect(body.length).toEqual(3);
  });

  test.skip('list by association', async () => {
    const p1 = await app.db.getRepository('posts').create({
      values: {
        title: 'pt1',
        tags: [1, 2],
      },
    });
    // const r = await app.db
    //   .getRepository<any>('posts.tags', p1.id)
    //   .find({ fields: ['id', 'postsTags.createdAt'], sort: ['id'] });
    // console.log(r.map((i) => JSON.stringify(i)));
    const response = await app
      .agent()
      .resource('posts.tags', p1.id)
      .list({ fields: ['id', 'postsTags.createdAt'], sort: ['id'] });

    const body = response.body;
    expect(body.count).toEqual(2);
    expect(body.rows).toMatchObject([{ id: 1 }, { id: 2 }]);
  });

  it.skip('should return empty error when relation not exists', async () => {
    const response = await app
      .agent()
      .resource('posts.tags', 999)
      .list({ fields: ['id', 'postsTags.createdAt'], sort: ['id'] });

    expect(response.status).toEqual(200);
    expect(response.body.count).toEqual(0);
  });

  it('should list with simple paginate', async () => {
    const Item = app.collection({
      name: 'items',
      simplePaginate: true,
      fields: [{ type: 'string', name: 'name' }],
    });

    await app.db.sync();

    await Item.repository.create({
      values: [
        {
          name: 'item1',
        },
        {
          name: 'item2',
        },
        {
          name: 'item3',
        },
      ],
    });

    const response = await app
      .agent()
      .resource('items')
      .list({
        fields: ['id'],
        pageSize: 1,
        page: 2,
      });

    const body = response.body;
    expect(body.hasNext).toBeTruthy();

    const lastPageResponse = await app
      .agent()
      .resource('items')
      .list({
        fields: ['id'],
        pageSize: 1,
        page: 3,
      });

    const lastPageBody = lastPageResponse.body;
    expect(lastPageBody.hasNext).toBeFalsy();
  });
});
