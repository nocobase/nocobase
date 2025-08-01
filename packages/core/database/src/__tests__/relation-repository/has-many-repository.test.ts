/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, {
  BelongsToManyRepository,
  Collection,
  createMockDatabase,
  HasManyRepository,
} from '@nocobase/database';

describe('has many with target key', function () {
  let db: Database;
  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  test('target key with filterTargetKey', async () => {
    const User = db.collection<{ id: number; name: string }, { name: string }>({
      name: 'users',
      filterTargetKey: 'name',
      autoGenId: false,
      fields: [
        { type: 'string', name: 'name', unique: true },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts', sourceKey: 'name', foreignKey: 'userName', targetKey: 'title' },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      filterTargetKey: 'title',
      autoGenId: false,
      fields: [
        { type: 'string', name: 'title', unique: true },
        { type: 'string', name: 'status' },
        {
          type: 'belongsTo',
          name: 'user',
          targetKey: 'name',
          foreignKey: 'userName',
        },
      ],
    });
  });

  test('destroy by target key and filter', async () => {
    const User = db.collection<{ id: number; name: string }, { name: string }>({
      name: 'users',
      filterTargetKey: 'name',
      autoGenId: false,
      fields: [
        { type: 'string', name: 'name', unique: true },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts', sourceKey: 'name', foreignKey: 'userName', targetKey: 'title' },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      filterTargetKey: 'title',
      autoGenId: false,
      fields: [
        { type: 'string', name: 'title', unique: true },
        { type: 'string', name: 'status' },
        {
          type: 'belongsTo',
          name: 'user',
          targetKey: 'name',
          foreignKey: 'userName',
        },
      ],
    });

    await db.sync({ force: true });

    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.get('name') as string);

    const p1 = await UserPostRepository.create({
      values: {
        title: 't1',
        status: 'published',
      },
    });

    const p2 = await UserPostRepository.create({
      values: {
        title: 't2',
        status: 'draft',
      },
    });

    await UserPostRepository.destroy({
      filterByTk: p1.title,
      filter: { status: 'draft' },
    });

    expect(await UserPostRepository.count()).toEqual(2);

    await UserPostRepository.destroy({
      filterByTk: p1.title,
      filter: {
        status: 'published',
      },
    });

    expect(
      await UserPostRepository.findOne({
        filterByTk: p1.title,
      }),
    ).toBeNull();

    expect(
      await UserPostRepository.findOne({
        filterByTk: p2.id,
      }),
    ).not.toBeNull();
  });
});

describe('has many repository', () => {
  let db;
  let User;
  let Post;
  let Comment;
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
        { type: 'string', name: 'status' },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
        { type: 'belongsToMany', name: 'tags', through: 'posts_tags' },
        { type: 'hasMany', name: 'comments' },
        { type: 'string', name: 'status' },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        { type: 'belongsToMany', name: 'posts', through: 'posts_tags' },
        { type: 'string', name: 'name' },
      ],
    });

    Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    await db.sync({ force: true });
  });

  test('find', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    await UserPostRepository.create({
      values: {
        title: 't1',
      },
    });

    const t1 = await UserPostRepository.findOne();
    expect(t1.title).toEqual('t1');
  });

  test('create', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    const post = await UserPostRepository.create({
      values: {
        title: 't1',
        comments: [{ content: 'content1' }],
      },
    });

    expect(post.title).toEqual('t1');
    expect(post.userId).toEqualNumberOrString(u1.id);
  });

  test('create with array', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    const posts = await UserPostRepository.create({
      values: [
        {
          title: 't1',
        },
        {
          title: 't2',
        },
      ],
    });

    expect(posts.length).toEqual(2);
  });

  test('update', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    await UserPostRepository.create({
      values: {
        title: 't1',
        comments: [{ content: 'content1' }],
      },
    });

    await UserPostRepository.update({
      filter: {
        title: 't1',
      },
      values: {
        title: 'u1t1',
      },
    });

    const p1 = await UserPostRepository.findOne();
    expect(p1.title).toEqual('u1t1');
  });

  test('firstOrCreate', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);

    // 测试基本创建
    const post1 = await UserPostRepository.firstOrCreate({
      filterKeys: ['title'],
      values: {
        title: 't1',
      },
    });

    expect(post1.title).toEqual('t1');
    expect(post1.userId).toEqualNumberOrString(u1.id);

    // 测试查找已存在记录
    const post2 = await UserPostRepository.firstOrCreate({
      filterKeys: ['title'],
      values: {
        title: 't1',
      },
    });

    expect(post2.id).toEqualNumberOrString(post1.id);

    // 测试带关联数据的创建
    const post3 = await UserPostRepository.firstOrCreate({
      filterKeys: ['title'],
      values: {
        title: 't2',
        comments: [{ content: 'comment1' }],
      },
    });

    expect(post3.title).toEqual('t2');
    expect(await post3.countComments()).toEqual(1);

    // 测试多个 filterKeys
    const post4 = await UserPostRepository.firstOrCreate({
      filterKeys: ['title', 'status'],
      values: {
        title: 't2',
        status: 'draft',
      },
    });

    expect(post4.id).not.toEqual(post3.id);
  });

  test('updateOrCreate', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);

    // 测试基本创建
    const post1 = await UserPostRepository.updateOrCreate({
      filterKeys: ['title'],
      values: {
        title: 't1',
        status: 'draft',
      },
    });

    expect(post1.title).toEqual('t1');
    expect(post1.status).toEqual('draft');
    expect(post1.userId).toEqualNumberOrString(u1.id);

    // 测试更新已存在记录
    const post2 = await UserPostRepository.updateOrCreate({
      filterKeys: ['title'],
      values: {
        title: 't1',
        status: 'published',
      },
    });

    expect(post2.id).toEqualNumberOrString(post1.id);
    expect(post2.status).toEqual('published');

    // 测试带关联数据的更新
    const post3 = await UserPostRepository.updateOrCreate({
      filterKeys: ['title'],
      values: {
        title: 't1',
        status: 'archived',
        comments: [{ content: 'new comment' }],
      },
    });

    expect(post3.id).toEqualNumberOrString(post1.id);
    expect(post3.status).toEqual('archived');
    expect(await post3.countComments()).toEqual(1);

    // 测试多个 filterKeys 的创建
    const post4 = await UserPostRepository.updateOrCreate({
      filterKeys: ['title', 'status'],
      values: {
        title: 't1',
        status: 'draft',
        comments: [{ content: 'another comment' }],
      },
    });

    expect(post4.id).not.toEqual(post1.id);
    expect(await post4.countComments()).toEqual(1);
  });

  test('find with has many', async () => {
    const u1 = await User.repository.create({ values: { name: 'u1' } });

    const t1 = await Tag.repository.create({ values: { name: 't1' } });

    const t2 = await Tag.repository.create({ values: { name: 't2' } });

    const t3 = await Tag.repository.create({ values: { name: 't3' } });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const p2 = await Post.repository.create({
      values: { title: 'p2', tags: [t1, t2, t3] },
    });

    const p3 = await Post.repository.create({
      values: { title: 'p3', tags: [t1, t2, t3] },
    });
    const p4 = await Post.repository.create({
      values: { title: 'p4', tags: [t1, t2, t3] },
    });
    const p5 = await Post.repository.create({
      values: { title: 'p5', tags: [t1, t2, t3] },
    });
    const p6 = await Post.repository.create({
      values: { title: 'p6', tags: [t1, t2, t3] },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    const ids = [p1, p2, p3, p4, p5, p6].map((p) => p.id);
    await UserPostRepository.add(ids);

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    await PostTagRepository.set([t1.id, t2.id, t3.id]);

    const post = await UserPostRepository.findOne({
      filter: {
        'tags.name': 't1',
      },
      appends: ['tags'],
    });

    expect(post.tags.length).toEqual(3);

    const findAndCount = await UserPostRepository.findAndCount({
      filter: {
        'tags.name.$like': 't%',
      },
    });

    expect(findAndCount[1]).toEqual(6);
  });

  test('destroy by pk and filter', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);

    const p1 = await UserPostRepository.create({
      values: {
        title: 't1',
        status: 'published',
      },
    });

    const p2 = await UserPostRepository.create({
      values: {
        title: 't2',
        status: 'draft',
      },
    });

    await UserPostRepository.destroy({
      filterByTk: p1.id,
      filter: {
        status: 'draft',
      },
    });

    expect(await UserPostRepository.count()).toEqual(2);

    await UserPostRepository.destroy({
      filterByTk: p1.id,
      filter: {
        status: 'published',
      },
    });

    expect(
      await UserPostRepository.findOne({
        filterByTk: p1.id,
      }),
    ).toBeNull();

    expect(
      await UserPostRepository.findOne({
        filterByTk: p2.id,
      }),
    ).not.toBeNull();
  });

  test('destroy by pk and filter with association', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);

    const p1 = await UserPostRepository.create({
      values: {
        title: 't1',
        status: 'published',
        user: u1,
      },
    });

    const p2 = await UserPostRepository.create({
      values: {
        title: 't2',
        status: 'draft',
        user: u1,
      },
    });

    await UserPostRepository.destroy({
      filterByTk: p1.id,
      filter: {
        user: {
          id: u1.id,
        },
      },
    });

    expect(
      await UserPostRepository.findOne({
        filterByTk: p1.id,
      }),
    ).toBeNull();

    expect(
      await UserPostRepository.findOne({
        filterByTk: p2.id,
      }),
    ).not.toBeNull();
  });

  test('destroy by pk', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    const p1 = await UserPostRepository.create({
      values: {
        title: 't1',
      },
    });

    await UserPostRepository.destroy(p1.id);

    expect(await UserPostRepository.findOne()).toBeNull();
  });

  test('destroy', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    const p1 = await UserPostRepository.create({
      values: {
        title: 't1',
      },
    });

    await UserPostRepository.destroy();

    expect(await UserPostRepository.findOne()).toBeNull();
  });

  test('destroy by filter', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    const p1 = await UserPostRepository.create({
      values: {
        title: 't1',
      },
    });

    await UserPostRepository.destroy({
      filter: {
        title: 't1',
      },
    });

    expect(await UserPostRepository.findOne()).toBeNull();
  });

  test('transaction', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    const p1 = await UserPostRepository.create({
      values: {
        title: 't1',
      },
    });

    await UserPostRepository.destroy({
      filter: {
        title: 't1',
      },
    });

    expect(await UserPostRepository.findOne()).toBeNull();
  });
});
