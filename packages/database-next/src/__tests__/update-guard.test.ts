import Database from '@nocobase/database';
import { Collection } from '../collection';
import { mockDatabase } from './index';
import { string } from '@nocobase/client/lib/schemas/database-field/interfaces/string';
import { UpdateGuard } from '../update-guard';
import lodash from 'lodash';

describe('update-guard', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

  beforeEach(async () => {
    const db = mockDatabase();

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts' },
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
      field: [
        { type: string, name: 'content' },
        { type: string, name: 'comment_as' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    await db.sync();
    const repository = User.repository;

    await repository.createMany([
      {
        name: 'u1',
        age: 10,
        posts: [{ title: 'u1t1', comments: [{ content: 'u1t1c1' }] }],
      },
      { name: 'u2', age: 20, posts: [{ title: 'u2t1', comments: ['u2t1c1'] }] },
      { name: 'u3', age: 30, posts: [{ title: 'u3t1', comments: ['u3t1c1'] }] },
    ]);
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
