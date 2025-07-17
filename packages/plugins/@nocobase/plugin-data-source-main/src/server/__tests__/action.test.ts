/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '.';

describe('action test', () => {
  let db: Database;
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get uiSchema', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    await db.getRepository('fields').create({
      values: {
        name: 'title',
        collectionName: 'posts',
        type: 'string',
        uiSchema: {
          'x-uid': 'test',
        },
      },
    });

    // @ts-ignore
    await db.getRepository('collections').load();
    await db.sync();

    const response = await app
      .agent()
      .resource('collections.fields', 'posts')
      .list({
        pageSize: 5,
        sort: ['sort'],
      });

    expect(response.statusCode).toEqual(200);
    const data = response.body.data;

    expect(data[0].uiSchema).toMatchObject({
      'x-uid': 'test',
    });
  });

  test('enable auto simple pagination for large datasets', async () => {
    const collectionRepository = app.db.getCollection('collections').repository;
    await collectionRepository.create({
      values: {
        name: 'posts',
      },
    });
    // @ts-ignore
    await db.getRepository('collections').load();
    await db.sync();
    const repository = app.db.getRepository('posts');
    vi.spyOn(repository, 'getEstimatedRowCount').mockResolvedValue(1000000);
    await app
      .agent()
      .resource('posts')
      .list({
        fields: ['id'],
        pageSize: 1,
        page: 2,
        sort: ['id'],
      });

    const posts = await collectionRepository.findOne({ where: { name: 'posts' } });
    expect(posts.options.simplePaginate).toBeTruthy();

    await collectionRepository.update({
      filter: { name: 'posts' },
      values: {
        options: {
          ...posts.options,
          simplePaginate: false,
        },
      },
    });
    // @ts-ignore
    await db.getRepository('collections').load();

    await app
      .agent()
      .resource('posts')
      .list({
        fields: ['id'],
        pageSize: 1,
        page: 2,
        sort: ['id'],
      });
    const updatedPosts = await collectionRepository.findOne({ where: { name: 'posts' } });
    expect(updatedPosts.options.simplePaginate).toBeFalsy();
    vi.restoreAllMocks();
  });
});
