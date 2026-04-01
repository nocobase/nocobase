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

describe('query action', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = actionMockServer();
    registerActions(app);

    const Post = app.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'hasMany',
          name: 'comments',
        },
        { type: 'string', name: 'status' },
      ],
    });

    app.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'content' }],
    });

    await app.db.sync();

    await Post.repository.create({
      values: [
        { title: 'p1', status: 'draft', comments: [{ content: 'c1' }] },
        { title: 'p2', status: 'published' },
      ],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should query collection data', async () => {
    const response = await app
      .agent()
      .post('/api/posts:query')
      .send({
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
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([
      { status: 'draft', count: 1 },
      { status: 'published', count: 1 },
    ]);
  });

  it('should pass timezone header to repository query', async () => {
    const response = await app
      .agent()
      .post('/api/posts:query')
      .set('x-timezone', 'Asia/Shanghai')
      .send({
        measures: [
          {
            field: ['id'],
            aggregation: 'count',
            alias: 'count',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([{ count: 2 }]);
  });

  it('should reject association resources', async () => {
    const response = await app
      .agent()
      .resource('posts.comments', 1)
      .query({
        values: {
          dimensions: [
            {
              field: ['content'],
              alias: 'content',
            },
          ],
        },
      });

    expect(response.status).toBe(400);
  });

  it('should reject query without measures or dimensions', async () => {
    const response = await app.agent().post('/api/posts:query').send({});

    expect(response.status).toBe(400);
    expect(response.text).toBe('Query action requires at least one measure or dimension');
  });
});
