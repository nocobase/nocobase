/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database } from '@nocobase/database';
import qs from 'qs';

describe('find with associations', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createMockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should append primary key to sort option', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        {
          name: 'age',
          type: 'integer',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        {
          name: 'user1',
          age: '10',
        },
        {
          name: 'user2',
          age: '10',
        },
        {
          name: 'user3',
          age: '10',
        },
      ],
    });

    const records = await User.repository.find({
      sort: ['age'],
    });

    expect(records[0].get('name')).toBe('user1');
    expect(records[1].get('name')).toBe('user2');
    expect(records[2].get('name')).toBe('user3');
  });

  it('should filter with associations by pagination', async () => {
    const Org = db.collection({
      name: 'organizations',
      fields: [
        { name: 'name', type: 'string' },
        {
          name: 'owner',
          type: 'belongsTo',
          target: 'users',
        },
      ],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        {
          name: 'qualifications',
          type: 'belongsToMany',
          target: 'qualifications',
        },
      ],
    });

    const Qualification = db.collection({
      name: 'qualifications',
      fields: [
        { name: 'name', type: 'string' },
        {
          name: 'user',
          type: 'belongsToMany',
          target: 'users',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        {
          name: 'u1',
          qualifications: [
            {
              name: 'q1',
            },
            {
              name: 'q2',
            },
          ],
        },
        {
          name: 'u2',
          qualifications: [
            {
              name: 'q1',
            },
            {
              name: 'q2',
            },
          ],
        },
      ],
    });

    const u1 = await User.repository.findOne({ filter: { name: 'u1' } });
    const u2 = await User.repository.findOne({ filter: { name: 'u2' } });

    await Org.repository.create({
      values: [
        {
          name: 'o1',
          owner: u1.get('id'),
        },
        {
          name: 'o2',
          owner: u2.get('id'),
        },
      ],
    });

    const orgs = await Org.repository.findAndCount({
      limit: 2,
      filter: {
        $or: [{ 'owner.qualifications.name.$includes': 'q1' }, { 'owner.qualifications.name.$includes': 'q2' }],
      },
    });

    const [results, count] = orgs;
    expect(count).toEqual(2);
    expect(results.length).toEqual(2);
  });

  it('should filter has many with limit', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'posts',
        },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        {
          name: 'u1',
          posts: [
            {
              title: 'u1p1',
            },
            {
              title: 'u1p2',
            },
          ],
        },
        {
          name: 'u2',
          posts: [
            {
              title: 'u2p1',
            },
            {
              title: 'u2p2',
            },
          ],
        },
      ],
    });

    const users = await User.repository.find({
      filter: {
        'posts.title.$includes': 'p',
      },
      limit: 2,
    });

    expect(users.length).toEqual(2);
  });

  it('should filter by association array field', async () => {
    const Group = db.collection({
      name: 'groups',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'users',
        },
        {
          type: 'array',
          name: 'tagFields',
        },
      ],
    });
    const User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'posts',
        },
        {
          type: 'belongsTo',
          name: 'group',
        },
        {
          type: 'array',
          name: 'tagFields',
        },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        {
          type: 'array',
          name: 'tagFields',
        },
        {
          type: 'string',
          name: 'title',
        },
      ],
    });

    await db.sync();

    await Group.repository.create({
      values: [
        {
          name: 'g1',
          users: [
            {
              name: 'u1',
              tagFields: ['u1'],
              posts: [
                {
                  tagFields: ['p1'],
                  title: 'u1p1',
                },
              ],
            },
          ],
          tagFields: ['g1'],
        },
      ],
    });

    // zero nested
    const posts = await Post.repository.find({
      filter: {
        tagFields: {
          $match: ['p1'],
        },
      },
    });

    expect(posts.length).toEqual(1);

    const filter0 = {
      $and: [
        {
          posts: {
            tagFields: {
              $match: ['p1'],
            },
          },
        },
      ],
    };

    const userFindResult = await User.repository.find({
      filter: filter0,
    });

    expect(userFindResult.length).toEqual(1);

    const filter = {
      $and: [
        {
          users: {
            posts: {
              tagFields: {
                $match: ['p1'],
              },
            },
          },
        },
      ],
    };

    const results = await Group.repository.find({
      filter,
    });

    expect(results[0].get('name')).toEqual('g1');
  });

  it('should filter by array not empty', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'posts',
        },
        {
          type: 'array',
          name: 'tags',
        },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        {
          type: 'array',
          name: 'tags',
        },
        {
          type: 'string',
          name: 'title',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        {
          name: 'u1',
          tags: ['u1-tag', 'u2-tag'],
          posts: [
            {
              tags: ['t1'],
              title: 'u1p1',
            },
          ],
        },
      ],
    });

    const posts = await User.repository.find({
      filter: {
        'posts.tags': {
          $noneOf: ['t2'],
        },
      },
    });

    expect(posts.length).toEqual(1);

    expect(posts[0].get('name')).toEqual('u1');
  });

  it('should filter with append', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [
        { name: 'title', type: 'string' },
        {
          name: 'user',
          type: 'belongsTo',
        },
        {
          name: 'category',
          type: 'belongsTo',
        },
      ],
    });

    const Category = db.collection({
      name: 'categories',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
      ],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        { type: 'belongsTo', name: 'organization' },
        {
          type: 'belongsTo',
          name: 'department',
        },
      ],
    });

    const Org = db.collection({
      name: 'organizations',
      fields: [{ name: 'name', type: 'string' }],
    });

    const Dept = db.collection({
      name: 'departments',
      fields: [{ name: 'name', type: 'string' }],
    });

    await db.sync();

    await Post.repository.create({
      values: [
        {
          title: 'p1',
          category: { name: 'c1' },
          user: {
            name: 'u1',
            organization: {
              name: 'o1',
            },
            department: {
              name: 'd1',
            },
          },
        },
        {
          title: 'p2',
          category: { name: 'c2' },
          user: {
            name: 'u2',
            organization: {
              name: 'o2',
            },
            department: {
              name: 'd2',
            },
          },
        },
      ],
    });

    const filterResult = await Post.repository.find({
      appends: ['user.department'],
      filter: {
        'user.name': 'u1',
      },
    });

    expect(filterResult[0].get('user').get('department')).toBeDefined();
  });

  it('should find with associations with sort params', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'posts',
        },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        {
          name: 'u1',
          posts: [
            {
              title: 'u1p1',
            },
            {
              title: 'u1p2',
            },
          ],
        },
        {
          name: 'u2',
          posts: [
            {
              title: 'u2p1',
            },
            {
              title: 'u2p2',
            },
          ],
        },
      ],
    });

    const appendArgs = [`posts(${qs.stringify({ sort: ['-id'] })})`];
    const users = await User.repository.find({
      appends: appendArgs,
    });

    expect(users[0].get('name')).toEqual('u1');
    expect(users[0].get('posts')[0].get('title')).toEqual('u1p2');
  });
});

describe('repository find', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;
  let Tag: Collection;
  let Profile: Collection;

  let A1: Collection;
  let A2: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    User = db.collection<{ id: number; name: string }, { name: string }>({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts' },
        { type: 'hasOne', name: 'profile' },
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

    Profile = db.collection({
      name: 'profiles',
      fields: [
        { type: 'integer', name: 'salary' },
        { type: 'belongsTo', name: 'user' },
        { type: 'string', name: 'description' },
      ],
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
          profile: { salary: 1000 },
        },
        {
          name: 'u2',
          age: 20,
          posts: [{ title: 'u2t1', comments: [{ content: 'u2t1c1' }] }],
          a1: [{ name: 'u2a11' }, { name: 'u2a12' }],
          a2: [{ name: 'u2a21' }, { name: 'u2a22' }],
          profile: { salary: 2000 },
        },
        {
          name: 'u3',
          age: 30,
          posts: [{ title: 'u3t1', comments: [{ content: 'u3t1c1' }] }],
          profile: { salary: 3000 },
        },
      ],
    });
  });

  describe('find with fields', () => {
    it('should only output filed in fields args', async () => {
      const users = await User.repository.find({
        fields: ['profile.salary'],
      });

      const firstUser = users[0].toJSON();
      expect(Object.keys(firstUser)).toEqual(['profile']);
      expect(Object.keys(firstUser.profile)).toEqual(['salary']);
    });

    it('should output all fields when field has relation field', async () => {
      const users = await User.repository.find({
        fields: ['profile.salary', 'profile'],
      });

      const firstUser = users[0].toJSON();
      expect(Object.keys(firstUser)).toEqual(['profile']);
      expect(Object.keys(firstUser.profile)).toEqual([
        'id',
        'createdAt',
        'updatedAt',
        'salary',
        'userId',
        'description',
      ]);
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

    test('find one with appends', async () => {
      const profile = await Profile.repository.findOne({
        filterByTk: 1,
        appends: ['user.name'],
      });

      expect(profile.get('user').get('name')).toEqual('u1');
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

    test('find with nested fields', async () => {
      const user = await User.repository.findOne({
        fields: ['posts.comments.content'],
      });

      const userData = user.toJSON();

      const post = userData['posts'][0];
      expect(Object.keys(post)).toEqual(['comments']);
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
