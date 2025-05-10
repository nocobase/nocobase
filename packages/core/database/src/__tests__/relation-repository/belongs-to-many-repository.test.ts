/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BelongsToManyRepository, Collection, createMockDatabase, Database } from '@nocobase/database';
import { isPg } from '@nocobase/test';

const pgOnly = () => (isPg() ? describe : describe.skip);

pgOnly()('belongs to many with targetCollection', () => {
  let db: Database;

  let Org: Collection;
  let User: Collection;
  let Student: Collection;

  let OrgUser: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();

    await db.clean({ drop: true });

    OrgUser = db.collection({
      name: 'org_user',
    });

    Org = db.collection({
      name: 'orgs',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'users', target: 'users', through: 'org_user' },
      ],
    });

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'orgs', target: 'orgs', through: 'org_user' },
      ],
    });

    Student = db.collection({
      name: 'students',
      inherits: ['users'],
      fields: [{ type: 'integer', name: 'score' }],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should update child collection', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'user1',
      },
    });

    const s1 = await Student.repository.create({
      values: {
        name: 'student1',
        score: 100,
      },
    });

    const org1 = await Org.repository.create({
      values: {
        name: 'org1',
        users: [u1.get('id'), s1.get('id')],
      },
    });

    const repository = Org.repository.relation<BelongsToManyRepository>('users').of(org1.get('id'));
    await repository.update({
      filterByTk: s1.get('id'),
      targetCollection: Student.name,
      values: {
        score: 200,
      },
    });

    const s1AfterUpdate = await Student.repository.findOne({});
    expect(s1AfterUpdate.get('score')).toBe(200);
  });
});

describe('belongs to many with collection that has no id key', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createMockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should set relation', async () => {
    const A = db.collection({
      name: 'a',
      autoGenId: false,
      fields: [
        {
          type: 'string',
          name: 'name',
          primaryKey: true,
        },
        {
          type: 'belongsToMany',
          name: 'bs',
          target: 'b',
          through: 'asbs',
          sourceKey: 'name',
          foreignKey: 'aName',
          otherKey: 'bName',
          targetKey: 'name',
        },
      ],
    });

    const B = db.collection({
      name: 'b',
      autoGenId: false,
      fields: [
        {
          type: 'string',
          name: 'key',
          primaryKey: true,
        },
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
        {
          type: 'belongsToMany',
          name: 'as',
          target: 'a',
          through: 'asbs',
          sourceKey: 'name',
          foreignKey: 'bName',
          otherKey: 'aName',
          targetKey: 'name',
        },
      ],
    });

    await db.sync();
    const a = await A.repository.create({
      values: {
        name: 'a1',
      },
    });
    const b = await B.repository.create({
      values: {
        key: 'b1_key',
        name: 'b1',
      },
    });

    const a1bsRepository = await A.repository.relation<BelongsToManyRepository>('bs').of('a1');
    expect(await a1bsRepository.find()).toHaveLength(0);
    await a1bsRepository.toggle('b1');
    expect(await a1bsRepository.find()).toHaveLength(1);
  });
});

describe('belongs to many with target key', function () {
  let db: Database;
  let Tag: Collection;
  let Post: Collection;
  let Color: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();

    await db.clean({ drop: true });
    Post = db.collection({
      name: 'posts',
      filterTargetKey: 'title',
      autoGenId: false,
      fields: [
        { type: 'string', name: 'title', primaryKey: true },
        {
          type: 'belongsToMany',
          name: 'tags',
          sourceKey: 'title',
          foreignKey: 'postTitle',
          targetKey: 'name',
          otherKey: 'tagName',
        },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      filterTargetKey: 'name',
      autoGenId: false,
      fields: [
        { type: 'string', name: 'name', primaryKey: true },
        { type: 'string', name: 'status' },
      ],
    });

    await db.sync({ force: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('destroy by target key', async () => {
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

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.get('title') as string);

    await PostTagRepository.set([t1.get('name') as string, t2.get('name')]);

    await PostTagRepository.destroy();

    const [_, count] = await PostTagRepository.findAndCount();
    expect(count).toEqual(0);
  });

  test('firstOrCreate', async () => {
    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.get('title') as string);

    // 测试基本创建
    const tag1 = await PostTagRepository.firstOrCreate({
      filterKeys: ['name'],
      values: {
        name: 't1',
        status: 'active',
      },
    });

    expect(tag1.name).toEqual('t1');
    expect(tag1.status).toEqual('active');

    // 测试查找已存在记录
    const tag2 = await PostTagRepository.firstOrCreate({
      filterKeys: ['name'],
      values: {
        name: 't1',
        status: 'inactive',
      },
    });

    expect(tag2.id).toEqual(tag1.id);
    expect(tag2.status).toEqual('active');
  });

  test('updateOrCreate', async () => {
    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.get('title') as string);

    const tag1 = await PostTagRepository.updateOrCreate({
      filterKeys: ['name'],
      values: {
        name: 't1',
        status: 'active',
      },
    });

    expect(tag1.name).toEqual('t1');
    expect(tag1.status).toEqual('active');

    const tag2 = await PostTagRepository.updateOrCreate({
      filterKeys: ['name'],
      values: {
        name: 't1',
        status: 'inactive',
      },
    });

    expect(tag2.id).toEqual(tag1.id);
    expect(tag2.status).toEqual('inactive');
  });
});

describe('belongs to many', () => {
  let db: Database;
  let User;
  let Post;
  let Tag;
  let PostTag;
  let Color;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    PostTag = db.collection({
      name: 'posts_tags',
      fields: [{ type: 'string', name: 'tagged_at' }],
    });

    User = db.collection({
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
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'belongsToMany', name: 'tags', through: 'posts_tags' },
        { type: 'string', name: 'title' },
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        { type: 'belongsToMany', name: 'posts', through: 'posts_tags' },
        { type: 'string', name: 'name' },
        { type: 'string', name: 'status' },
        { type: 'hasMany', name: 'colors' },
      ],
    });

    Color = db.collection({
      name: 'colors',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'tag' },
      ],
    });

    await db.sync({ force: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should get database instance in repository', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const postTagsRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    expect(postTagsRepository.database).toBe(db);
  });

  it('should create associations with associations', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const postTagsRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await postTagsRepository.create({
      values: {
        name: 't1',
        colors: [
          {
            name: 'red',
          },
        ],
      },
    });

    const t1 = await postTagsRepository.findOne({
      filter: {
        name: 't1',
      },
      appends: ['colors'],
    });

    expect(t1.name).toEqual('t1');
    expect(t1.colors.length).toEqual(1);
    expect(t1.colors[0].name).toEqual('red');
  });

  test('create with through values', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.create({
      values: {
        name: 't1',
        posts_tags: {
          tagged_at: '123',
        },
      },
    });

    const t1 = await PostTagRepository.findOne();
    expect(t1.posts_tags.tagged_at).toEqual('123');
  });

  test('create', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    const t1 = await PostTagRepository.create({
      values: {
        name: 't1',
      },
    });

    expect(t1).toBeDefined();

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    await PostTagRepository.add(t2.id);

    const findResult = await PostTagRepository.find();
    expect(findResult.length).toEqual(2);

    const findFilterResult = await PostTagRepository.find({
      filter: { name: 't2' },
    });

    expect(findFilterResult.length).toEqual(1);
    expect(findFilterResult[0].name).toEqual('t2');
  });

  test('create with array', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    const results = await PostTagRepository.create({
      values: [
        {
          name: 't1',
        },
        {
          name: 't2',
        },
      ],
    });

    expect(results.length).toEqual(2);
  });

  test('find and count', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [{ name: 't1' }, { name: 't2' }],
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    let [findResult, count] = await PostTagRepository.findAndCount({
      fields: ['id'],
    });

    expect(count).toEqual(2);

    [findResult, count] = await PostTagRepository.findAndCount({
      filter: {
        name: 't1',
      },
    });

    expect(count).toEqual(1);
    expect(findResult[0].name).toEqual('t1');
  });

  test('find one', async () => {
    const p1 = await Post.repository.create({
      values: { title: 'p1', tags: [{ name: 't1' }, { name: 't2' }] },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    let t1 = await PostTagRepository.findOne({
      filter: {
        name: 't1',
      },
    });

    expect(t1.name).toEqual('t1');

    t1 = await PostTagRepository.findOne({
      filter: {
        name: 'tabcaa',
      },
    });
    expect(t1).toBeNull();
  });

  test('find with sort & appends', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [
          {
            name: 't1',
            colors: [
              {
                name: 'red',
              },
            ],
          },
          { name: 't2', colors: [{ name: 'green' }] },
        ],
      },
    });

    const PostTagsRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    const tags = await PostTagsRepository.find({
      appends: ['colors'],
      sort: ['name'],
      limit: 20,
      offset: 0,
    });

    // console.log(tags);
  });

  test('update raw attribute', async () => {
    const otherTag = await Tag.repository.create({
      values: { name: 'other_tag' },
    });

    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [{ name: 't1' }, { name: 't2' }],
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    // rename t1 to t3
    await PostTagRepository.update({
      filter: {
        name: 't1',
      },
      values: {
        name: 't3',
      },
    });

    const t1 = await PostTagRepository.findOne({
      filter: {
        name: 't1',
      },
    });

    expect(t1).toBeNull();

    const t3 = await PostTagRepository.findOne({
      filter: {
        name: 't3',
      },
    });

    expect(t3.name).toEqual('t3');

    await PostTagRepository.update({
      values: {
        name: 'updated',
      },
    });

    await otherTag.reload();
    expect(otherTag.name).toEqual('other_tag');
  });

  test('update through table attribute', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [
          {
            name: 't1',
            posts_tags: {
              tagged_at: '123',
            },
          },
          { name: 't2' },
        ],
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    let t1 = await PostTagRepository.findOne({
      filter: {
        name: 't1',
      },
    });

    expect(t1.posts_tags.tagged_at).toEqual('123');

    const p2 = await Post.repository.create({
      values: {
        title: 'p2',
        tags: [t1.id],
      },
    });

    const Post2TagRepository = new BelongsToManyRepository(Post, 'tags', p2.id);
    let p2Tag = await Post2TagRepository.findOne();
    expect(p2Tag.posts_tags.tagged_at).toBeNull();

    // 设置p1与t1关联的tagged_at
    await PostTagRepository.update({
      filter: {
        name: 't1',
      },
      values: {
        posts_tags: {
          tagged_at: '456',
        },
      },
    });

    t1 = await PostTagRepository.findOne({
      filter: {
        name: 't1',
      },
    });

    expect(t1.posts_tags.tagged_at).toEqual('456');

    p2Tag = await Post2TagRepository.findOne();
    // p2-tag1 still not change
    expect(p2Tag.posts_tags.tagged_at).toBeNull();
  });

  test('update association values', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [{ name: 't1' }, { name: 't2' }],
        user: u1.id,
      },
    });

    const tag = await Tag.repository.findOne();
    const tagPostsRepository = new BelongsToManyRepository(Tag, 'posts', tag.id);

    await tagPostsRepository.update({
      values: {
        user: {
          id: u1.get('id'),
          name: 'u0',
        },
      },
    });

    await u1.reload();
    expect(u1.get('name')).toEqual('u1');

    await tagPostsRepository.update({
      values: {
        user: {
          id: u1.get('id'),
          name: 'u0',
        },
      },
      updateAssociationValues: ['user'],
    });

    await u1.reload();
    expect(u1.get('name')).toEqual('u0');
  });

  test('add', async () => {
    const t1 = await Tag.repository.create({
      values: { name: 't1' },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    await PostTagRepository.add([[t1.id, { tagged_at: '123' }]]);

    const p1Tag = await PostTagRepository.findOne();
    expect(p1Tag.posts_tags.tagged_at).toEqual('123');
  });

  test('set', async () => {
    let t1 = await Tag.repository.create({
      values: { name: 't1' },
    });

    const t2 = await Tag.repository.create({
      values: { name: 't2' },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set([t1.id]);

    const p1Tags = await PostTagRepository.find();
    expect(p1Tags.length).toEqual(1);

    await PostTagRepository.set([[t1.id, { tagged_at: '999' }]]);

    t1 = await PostTagRepository.findOne({
      filter: {
        name: 't1',
      },
    });

    expect(t1.posts_tags.tagged_at).toEqual('999');
  });

  test('find by pk', async () => {
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

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set([t1.id, t2.id]);

    const findByPkResult = await PostTagRepository.findOne({
      filterByTk: t2.id,
    });

    expect(findByPkResult.name).toEqual('t2');
  });

  test('toggle', async () => {
    const t1 = await Tag.repository.create({
      values: { name: 't1' },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.toggle(t1.id);
    expect(await PostTagRepository.findOne()).not.toBeNull();

    await PostTagRepository.toggle(t1.id);
    expect(await PostTagRepository.findOne()).toBeNull();
  });

  test('remove', async () => {
    const t1 = await Tag.repository.create({
      values: { name: 't1' },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.add(t1.id);
    expect(await PostTagRepository.findOne()).not.toBeNull();

    await PostTagRepository.remove(t1.id);
    expect(await PostTagRepository.findOne()).toBeNull();
  });

  test('destroy all', async () => {
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

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set([t1.id, t2.id]);

    await PostTagRepository.destroy();

    const [_, count] = await PostTagRepository.findAndCount();
    expect(count).toEqual(0);
  });

  test('destroy by id and filter', async () => {
    const t1 = await Tag.repository.create({
      values: {
        name: 't1',
        status: 'published',
      },
    });

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
        status: 'draft',
      },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set([t1.id, t2.id]);

    let [_, count] = await PostTagRepository.findAndCount();
    expect(count).toEqual(2);

    await PostTagRepository.destroy({
      filterByTk: t1.get('id') as number,
      filter: {
        status: 'draft',
      },
    });

    [_, count] = await PostTagRepository.findAndCount();
    expect(count).toEqual(2);
  });

  test('destroy with id', async () => {
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

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set([t1.id, t2.id]);

    expect(await PostTagRepository.count()).toEqual(2);

    await PostTagRepository.destroy(t2.id);

    expect(await PostTagRepository.count()).toEqual(1);
  });

  test('transaction', async () => {
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

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const transaction = await Tag.model.sequelize.transaction();

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set({
      tk: [t1.id, t2.id],
      transaction,
    });

    await transaction.commit();
  });
});

describe('belongs to many', () => {
  let db: Database;
  let A;
  let B;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    A = db.collection({
      name: 'a',
      fields: [
        { type: 'string', name: 'code', unique: true },
        {
          type: 'belongsToMany',
          target: 'b',
          targetKey: 'code',
          sourceKey: 'code',
          foreignKey: 'a_code',
          otherKey: 'b_code',
        },
      ],
    });

    B = db.collection({
      name: 'b',
      fields: [{ type: 'string', name: 'code', unique: true }],
    });

    await db.sync({ force: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should get database instance in repository', async () => {
    const a = await A.create({
      values: {
        b: {},
      },
    });
  });
});
