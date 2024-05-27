/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mockServer } from './index';
import { registerActions } from '@nocobase/actions';
import { Collection } from '@nocobase/database';

describe('update or create', () => {
  let app;

  let Post: Collection;

  beforeEach(async () => {
    app = mockServer();
    await app.db.clean({ drop: true });
    registerActions(app);

    Post = app.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('update or create resource', async () => {
    expect(await Post.repository.findOne()).toBeNull();
    const response = await app
      .agent()
      .resource('posts')
      .updateOrCreate({
        values: {
          title: 't1',
        },
        filterKeys: ['title'],
      });

    expect(response.statusCode).toEqual(200);
    const post = await Post.repository.findOne();
    expect(post).not.toBeNull();
    expect(post['title']).toEqual('t1');
  });

  test('update or create with empty values', async () => {
    await Post.repository.create({ values: { title: 't1' } });

    const response = await app
      .agent()
      .resource('posts')
      .updateOrCreate({
        values: {},
        filterKeys: ['title'],
      });

    expect(response.statusCode).toEqual(200);
    const post = await Post.repository.findOne({
      filter: {
        'title.$empty': true,
      },
    });

    expect(post).not.toBeNull();

    await app
      .agent()
      .resource('posts')
      .updateOrCreate({
        values: {},
        filterKeys: ['title'],
      });

    expect(
      await Post.repository.count({
        filter: {
          'title.$empty': true,
        },
      }),
    ).toEqual(1);

    expect(
      await Post.repository.count({
        filter: {
          title: 't1',
        },
      }),
    ).toEqual(1);
  });
});
