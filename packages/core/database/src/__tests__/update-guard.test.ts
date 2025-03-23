/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database } from '@nocobase/database';
import lodash from 'lodash';
import { UpdateGuard } from '../update-guard';

describe('update-guard', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;
  let Tag: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts' },
        {
          type: 'belongsToMany',
          name: 'tags',
          target: 'tags',
          through: 'users_tags',
          sourceKey: 'id',
          foreignKey: 'userId',
          otherKey: 'tagName',
          targetKey: 'name',
        },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'string', name: 'content' },
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'hasMany',
          name: 'comments',
        },
      ],
    });

    Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'string', name: 'comment_as' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name', unique: true }],
    });

    await db.sync({
      force: true,
      alter: { drop: false },
    });

    const repository = User.repository;

    await repository.create({
      values: [
        {
          name: 'u1',
          age: 10,
          posts: [{ title: 'u1t1', comments: [{ content: 'u1t1c1' }] }],
          tags: [
            {
              name: 't1',
            },
            {
              name: 't2',
            },
          ],
        },
        {
          name: 'u2',
          age: 20,
          posts: [{ title: 'u2t1', comments: [{ content: 'u2t1c1' }] }],
          tags: [
            {
              name: 't1',
            },
            {
              name: 't2',
            },
          ],
        },
        {
          name: 'u3',
          age: 30,
          posts: [{ title: 'u3t1', comments: [{ content: 'u3t1c1' }] }],
          tags: [
            {
              name: 't1',
            },
            {
              name: 't2',
            },
            {
              name: 't3',
            },
          ],
        },
      ],
    });
  });

  afterEach(async () => {
    await db.close();
  });

  test('association values', async () => {
    const values = {
      name: 'u1',
      tags: [
        {
          name: 't1',
        },
        {
          name: 't2',
        },
      ],
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);

    const sanitized = guard.sanitize(values);
    console.log(sanitized);
  });

  test('white list', () => {
    const values = {
      name: '123',
      age: 30,
    };
    const guard = new UpdateGuard();
    guard.setModel(User.model);
    guard.setWhiteList(['name']);

    expect(guard.sanitize(values)).toEqual({
      name: '123',
    });
  });

  test('black list', () => {
    const values = {
      name: '123',
      age: 30,
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);
    guard.setBlackList(['name']);

    expect(guard.sanitize(values)).toEqual({
      age: 30,
    });
  });

  test('association with null array', () => {
    const values = {
      name: 'u1',
      posts: [null],
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);
    const sanitized = guard.sanitize(values);

    expect(sanitized).toEqual({ name: 'u1', posts: [null] });
  });

  test('association black list', () => {
    const values = {
      name: 'username123',
      age: 30,
      posts: [
        {
          title: 'post-title123',
          content: '345',
        },
      ],
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);
    guard.setBlackList(['name', 'posts']);

    expect(guard.sanitize(values)).toEqual({
      age: 30,
    });
  });

  test('association fields black list', () => {
    const values = {
      name: 'username123',
      age: 30,
      posts: [
        {
          title: 'post-title123',
          content: '345',
        },
      ],
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);
    guard.setBlackList(['name', 'posts.content']);

    expect(guard.sanitize(values)).toEqual({
      age: 30,
      posts: values.posts.map((p) => {
        return {
          title: p.title,
        };
      }),
    });
  });

  test('association subfield white list', () => {
    const values = {
      name: 'username123',
      age: 30,
      posts: [
        {
          title: 'post-title123',
          content: '345',
        },
      ],
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);
    guard.setWhiteList(['name', 'posts.title']);

    expect(guard.sanitize(values)).toEqual({
      name: values.name,
      posts: values.posts.map((post) => {
        return {
          title: post.title,
        };
      }),
    });
  });

  test('association nested fields white list', () => {
    const values = {
      name: 'username123',
      age: 30,
      posts: [
        {
          title: 'post-title123',
          content: '345',
          comments: [1, 2, 3],
        },
      ],
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);
    guard.setWhiteList(['name', 'posts.comments']);

    expect(guard.sanitize(values)).toEqual({
      name: values.name,
      posts: values.posts.map((post) => {
        return {
          comments: post.comments,
        };
      }),
    });
  });

  test('association white list', () => {
    const values = {
      name: '123',
      age: 30,
      posts: [
        {
          title: '123',
          content: '345',
        },
      ],
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);
    guard.setWhiteList(['posts']);

    expect(guard.sanitize(values)).toEqual({
      posts: values.posts,
    });
  });

  test('associationKeysToBeUpdate', () => {
    const values = {
      name: '123',
      age: 30,
      posts: [
        {
          title: '123',
          content: '345',
        },
        {
          id: 1,
          title: '456',
          content: '789',
        },
      ],
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);

    expect(guard.sanitize(values)).toEqual({
      name: '123',
      age: 30,
      posts: [
        {
          title: '123',
          content: '345',
        },
        {
          id: 1,
        },
      ],
    });

    guard.setAssociationKeysToBeUpdate(['posts']);
    expect(guard.sanitize(values)).toEqual(values);
  });

  test('associationKeysToBeUpdate nested association', () => {
    const values = {
      name: '123',
      age: 30,
      posts: [
        {
          title: '123',
          content: '345',
        },
        {
          id: 1,
          title: '456',
          content: '789',
          comments: [
            {
              id: 1,
              content: '123',
            },
          ],
        },
      ],
    };

    const guard = new UpdateGuard();
    guard.setModel(User.model);

    expect(guard.sanitize(lodash.clone(values))).toEqual({
      name: '123',
      age: 30,
      posts: [
        {
          title: '123',
          content: '345',
        },
        {
          id: 1,
          comments: [
            {
              id: 1,
            },
          ],
        },
      ],
    });

    guard.setAssociationKeysToBeUpdate(['posts']);

    expect(guard.sanitize(lodash.clone(values))).toEqual({
      name: '123',
      age: 30,
      posts: [
        {
          title: '123',
          content: '345',
        },
        {
          id: 1,
          title: '456',
          content: '789',
          comments: [
            {
              id: 1,
            },
          ],
        },
      ],
    });
  });
});

describe('One2One Association', () => {
  test('associationKeysToBeUpdate hasOne & BelongsTo', async () => {
    const db = await createMockDatabase();
    await db.clean({ drop: true });
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'belongsTo', name: 'user', targetKey: 'uid' }],
    });

    const User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'uid', unique: true }],
    });

    const values = {
      title: '123',
      content: '456',
      user: {
        uid: 1,
        name: '123',
      },
      userId: 1,
    };

    const guard = new UpdateGuard();
    guard.setModel(Post.model);

    expect(guard.sanitize(values)).toEqual({
      title: '123',
      content: '456',
      user: {
        uid: 1,
      },
      userId: 1,
    });

    guard.setAssociationKeysToBeUpdate(['user']);
    expect(guard.sanitize(values)).toEqual(values);
  });
});
