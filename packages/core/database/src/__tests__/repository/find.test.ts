import { mockDatabase } from '../index';
import Database from '@nocobase/database';
import { Collection } from '../../collection';
import { OptionsParser } from '../../options-parser';

describe('repository find', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;
  let Tag: Collection;

  let A1: Collection;
  let A2: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();

    User = db.collection<{ id: number; name: string }, { name: string }>({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts' },
        { type: 'belongsToMany', name: 'a1' },
        { type: 'belongsToMany', name: 'a2' },
      ],
    });

    A1 = db.collection({
      name: 'a1',
      fields: [{ type: 'string', name: 'name' }],
    });

    A2 = db.collection({
      name: 'a2',
      fields: [{ type: 'string', name: 'name' }],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'hasMany',
          name: 'comments',
        },
        {
          type: 'belongsToMany',
          name: 'abc1',
          target: 'tags',
        },
      ],
    });

    Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'posts' },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await db.sync();
    const repository = User.repository;

    await repository.createMany({
      records: [
        {
          name: 'u1',
          age: 10,
          posts: [{ title: 'u1t1', comments: [{ content: 'u1t1c1' }], abc1: [{ name: 't1' }] }],
          a1: [{ name: 'u1a11' }, { name: 'u1a12' }],
          a2: [{ name: 'u1a21' }, { name: 'u1a22' }],
        },
        {
          name: 'u2',
          age: 20,
          posts: [{ title: 'u2t1', comments: [{ content: 'u2t1c1' }] }],
          a1: [{ name: 'u2a11' }, { name: 'u2a12' }],
          a2: [{ name: 'u2a21' }, { name: 'u2a22' }],
        },
        {
          name: 'u3',
          age: 30,
          posts: [{ title: 'u3t1', comments: [{ content: 'u3t1c1' }] }],
        },
      ],
    });
  });

  it('append with associations', async () => {
    const users = await User.repository.findAndCount({
      appends: ['posts', 'posts.comments'],
    });

    const user = users[0][0];
    // @ts-ignore
    expect(user.get('posts')[0].get('comments')).toBeDefined();
  });

  describe('findOne', () => {
    test('find one with attribute', async () => {
      const user = await User.repository.findOne({
        filter: {
          name: 'u2',
        },
      });
      expect(user['name']).toEqual('u2');
    });

    test('find one with relation', async () => {
      const user = await User.repository.findOne({
        filter: {
          'posts.title': 'u2t1',
        },
      });
      expect(user['name']).toEqual('u2');
    });

    test('find one with fields', async () => {
      const user = await User.repository.findOne({
        filter: {
          name: 'u2',
        },
        fields: ['id'],
        appends: ['posts'],
        except: ['posts.id'],
      });

      const data = user.toJSON();
      expect(Object.keys(data)).toEqual(['id', 'posts']);
      expect(Object.keys(data['posts'])).not.toContain('id');
    });
  });

  describe('find', () => {
    test('find with logic or', async () => {
      const users = await User.repository.findAndCount({
        filter: {
          $or: [{ 'posts.title': 'u1t1' }, { 'posts.title': 'u2t1' }],
        },
      });

      expect(users[1]).toEqual(2);
    });

    test('find with empty or', async () => {
      const usersCount = await User.repository.count({
        filter: {
          $or: [],
        },
      });

      expect(usersCount).toEqual(await User.repository.count());
    });

    test('find with fields', async () => {
      let user = await User.repository.findOne({
        fields: ['name'],
      });

      expect(user['name']).toBeDefined();
      expect(user['age']).toBeUndefined();
      expect(user['posts']).toBeUndefined();

      user = await User.repository.findOne({
        fields: ['name', 'posts'],
      });

      expect(user['posts']).toBeDefined();
    });

    describe('find with appends', () => {
      test('toJSON', async () => {
        const user = await User.repository.findOne({
          filter: {
            name: 'u1',
          },
          appends: ['a1', 'a2'],
        });

        const data = user.toJSON();

        expect(user['a1']).toBeDefined();
        expect(user['a2']).toBeDefined();
        expect(data['a1'][0].createdAt).toBeDefined();
        expect(data['a2'][0].createdAt).toBeDefined();
      });

      test('filter attribute', async () => {
        const user = await User.repository.findOne({
          filter: {
            name: 'u1',
          },
          appends: ['posts'],
        });

        expect(user['posts']).toBeDefined();
      });

      test('filter association attribute', async () => {
        const user2 = await User.repository.findOne({
          filter: {
            'posts.title': 'u1t1',
          },
          appends: ['posts'],
        });
        expect(user2['posts']).toBeDefined();
      });

      test('without appends', async () => {
        const user3 = await User.repository.findOne({
          filter: {
            'posts.title': 'u1t1',
          },
        });

        expect(user3['posts']).toBeUndefined();
      });
    });

    describe('find all', () => {
      test('without params', async () => {
        expect((await User.repository.find()).length).toEqual(3);
      });
      test('with limit', async () => {
        expect(
          (
            await User.repository.find({
              limit: 1,
            })
          ).length,
        ).toEqual(1);
      });
    });

    describe('find and count', () => {
      test('without params', async () => {
        expect((await User.repository.findAndCount())[1]).toEqual(3);
      });
    });

    test('find with filter', async () => {
      const results = await User.repository.find({
        filter: {
          name: 'u1',
        },
      });

      expect(results.length).toEqual(1);
    });

    test('find with association', async () => {
      const results = await User.repository.find({
        filter: {
          'posts.title': 'u1t1',
        },
      });

      expect(results.length).toEqual(1);
    });

    test('find with association with $and', async () => {
      const results = await Post.repository.find({
        filter: {
          'abc1.name': 't1',
        },
      });

      expect(results.length).toEqual(1);
    });
  });
});
