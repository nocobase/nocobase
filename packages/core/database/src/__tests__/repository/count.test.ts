/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, HasManyRepository, createMockDatabase } from '@nocobase/database';

describe('count', () => {
  let db;
  let User: Collection;
  let Post: Collection;
  let Tag;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
        { type: 'belongsToMany', name: 'tags' },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'posts' },
      ],
    });
    await db.sync();
  });

  test('count with association', async () => {
    const user1 = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

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

    const UserPostRepository = User.repository.relation<HasManyRepository>('posts');

    await UserPostRepository.of(user1['id']).create({
      values: {
        title: 'u1p1',
        tags: [t1, t2, t3],
      },
    });

    await UserPostRepository.of(user1['id']).create({
      values: {
        title: 'u1p2',
        tags: [t1, t2, t3],
      },
    });

    await UserPostRepository.of(user1['id']).create({
      values: {
        title: 'u1p3',
        tags: [t1, t2, t3],
      },
    });

    expect(await Post.repository.count()).toEqual(3);

    expect(
      await Post.repository.count({
        filter: {
          'tags.name': 't1',
        },
      }),
    ).toEqual(3);

    let posts = await Post.repository.findAndCount();
    expect(posts[1]).toEqual(3);

    posts = await Post.repository.findAndCount({
      filter: {
        title: 'u1p1',
      },
    });

    expect(posts[0][0]['tags']).toBeUndefined();

    posts = await Post.repository.findAndCount({
      filter: {
        title: 'u1p1',
      },
      appends: ['tags'],
    });

    expect(posts[0][0].get('tags')).toBeDefined();
  });

  test('without filter params', async () => {
    const repository = User.repository;

    await repository.createMany({
      records: [
        {
          name: 'u1',
          age: 10,
          posts: [{ title: 'u1t1', comments: ['u1t1c1'] }],
        },
        {
          name: 'u2',
          age: 20,
          posts: [{ title: 'u2t1', comments: ['u2t1c1'] }],
        },
        {
          name: 'u3',
          age: 30,
          posts: [{ title: 'u3t1', comments: ['u3t1c1'] }],
        },
      ],
    });

    expect(await User.repository.count()).toEqual(3);
  });

  test('with filter params', async () => {
    const repository = User.repository;

    await repository.createMany({
      records: [
        {
          name: 'u1',
          age: 10,
          posts: [{ title: 'u1t1', comments: ['u1t1c1'] }],
        },
        {
          name: 'u2',
          age: 20,
          posts: [{ title: 'u2t1', comments: ['u2t1c1'] }],
        },
        {
          name: 'u3',
          age: 30,
          posts: [{ title: 'u3t1', comments: ['u3t1c1'] }],
        },
      ],
    });

    expect(
      await User.repository.count({
        filter: {
          name: 'u1',
        },
      }),
    ).toEqual(1);
  });
});
