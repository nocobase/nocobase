/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database, Repository } from '@nocobase/database';
import { vi } from 'vitest';

describe('repository', () => {
  test('value to filter', async () => {
    const value = {
      tags: [
        {
          categories: [{ name: 'c1' }, { name: 'c2' }],
        },
        {
          categories: [{ name: 'c3' }, { name: 'c4' }],
        },
      ],
    };

    const filter = Repository.valuesToFilter(value, ['tags.categories.name']);
    expect(filter.$and).toEqual([
      {
        'tags.categories.name': ['c1', 'c2', 'c3', 'c4'],
      },
    ]);
  });
});

describe('find by targetKey', function () {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('can filter by target key', async () => {
    const User = db.collection({
      name: 'users',
      filterTargetKey: 'name',
      autoGenId: false,
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: {
        name: 'user1',
      },
    });

    await User.repository.create({
      values: {
        name: 'user2',
      },
    });

    const user2 = await User.repository.findOne({
      filterByTk: 'user2',
    });

    expect(user2.get('name')).toEqual('user2');
  });
});

describe('repository.find', () => {
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
        { type: 'hasMany', name: 'posts' },
      ],
    });
    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'user' },
        { type: 'hasMany', name: 'comments' },
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

    Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'post' },
      ],
    });
    await db.sync();

    const tags = await Tag.repository.create({
      values: [{ name: 't1' }, { name: 't2' }],
    });

    await User.repository.createMany({
      updateAssociationValues: ['posts.comments', 'posts.tags'],
      records: [
        {
          name: 'user1',
          posts: [
            {
              name: 'post11',
              comments: [{ name: 'comment111' }, { name: 'comment112' }, { name: 'comment113' }],
              tags: [{ id: tags[0].get('id') }],
            },
            {
              name: 'post12',
              comments: [{ name: 'comment121' }, { name: 'comment122' }, { name: 'comment123' }],
              tags: [{ id: tags[1].get('id') }, { id: tags[0].get('id') }],
            },
            {
              name: 'post13',
              comments: [{ name: 'comment131' }, { name: 'comment132' }, { name: 'comment133' }],
              tags: [{ id: tags[0].get('id') }],
            },
            {
              name: 'post14',
              comments: [{ name: 'comment141' }, { name: 'comment142' }, { name: 'comment143' }],
              tags: [{ id: tags[1].get('id') }],
            },
          ],
        },
        {
          name: 'user2',
          posts: [
            {
              name: 'post21',
              comments: [{ name: 'comment211' }, { name: 'comment212' }, { name: 'comment213' }],
              tags: [{ id: tags[0].get('id') }, { id: tags[1].get('id') }],
            },
            {
              name: 'post22',
              comments: [{ name: 'comment221' }, { name: 'comment222' }, { name: 'comment223' }],
            },
            {
              name: 'post23',
              comments: [{ name: 'comment231' }, { name: 'comment232' }, { name: 'comment233' }],
            },
            { name: 'post24' },
          ],
        },
        {
          name: 'user3',
          posts: [
            {
              name: 'post31',
              comments: [{ name: 'comment311' }, { name: 'comment312' }, { name: 'comment313' }],
            },
            { name: 'post32' },
            {
              name: 'post33',
              comments: [{ name: 'comment331' }, { name: 'comment332' }, { name: 'comment333' }],
            },
            { name: 'post34' },
          ],
        },
      ],
    });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should find with filter', async () => {
    const users = await User.repository.find({
      filter: {
        name: 'user1',
      },
    });

    expect(users.length).toBe(1);
  });

  it('should find with limit', async () => {
    const limitedUsers = await User.repository.find({
      limit: 1,
    });
    expect(limitedUsers.length).toBe(1);

    // limit is string
    const twoUsers = await User.repository.find({
      limit: '2' as any,
    });
    expect(twoUsers.length).toBe(2);
  });

  it('should find with where', async () => {
    const users = await User.repository.find({
      where: {
        name: 'user1',
      },
    });

    expect(users.length).toBe(1);
  });

  it('should find with filter and where', async () => {
    const users = await User.repository.find({
      filter: {
        name: 'user1',
      },
      where: {
        name: 'user2',
      },
    });

    expect(users.length).toBe(0);
  });

  it('should appends with belongs to association', async () => {
    const posts = await Post.repository.find({
      appends: ['user'],
    });

    posts.forEach((post) => {
      expect(post.get('user')).toBeDefined();
    });
  });

  test('find pk with filter', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'status' },
      ],
    });

    await db.sync();

    const t1 = await Test.repository.create({
      values: {
        name: 't1',
        status: 'draft',
      },
    });

    const result = await Test.repository.findOne({
      filterByTk: <number>t1.get('id'),
      filter: {
        status: 'published',
      },
    });

    expect(result).toBeNull();
  });

  it('find item', async () => {
    const data = await User.repository.find({
      filter: {
        'posts.comments.id': null,
      },
    });
  });
});

describe('repository create with belongs to many', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should save value at through table', async () => {
    const Product = db.collection({
      name: 'products',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'price' },
      ],
    });

    const OrderProduct = db.collection({
      name: 'orders_products',
      fields: [{ type: 'integer', name: 'quantity' }],
    });

    const Order = db.collection({
      name: 'orders',
      fields: [
        {
          type: 'belongsToMany',
          name: 'products',
          through: 'orders_products',
        },
      ],
    });

    await db.sync();

    await Product.repository.create({
      values: [
        {
          name: 'product1',
          price: 100,
        },
        {
          name: 'product2',
          price: 200,
        },
      ],
    });

    const p1 = await Product.repository.findOne({
      filter: { name: 'product1' },
    });

    await Order.repository.create({
      updateAssociationValues: ['products', 'products.orders_products'],
      values: {
        products: [
          {
            id: p1.get('id'),
            orders_products: {
              quantity: 20,
            },
          },
        ],
      },
    });

    const through = await OrderProduct.repository.findOne();
    expect(through.get('quantity')).toBe(20);
  });
});

describe('repository.create', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

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
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('create', async () => {
    const user = await User.repository.create({
      updateAssociationValues: ['posts', 'posts.comments'],
      values: {
        name: 'user1',
        posts: [
          {
            name: 'post11',
            comments: [{ name: 'comment111' }, { name: 'comment112' }, { name: 'comment113' }],
          },
        ],
      },
    });
    const post = await Post.model.findOne();
    expect(post).toMatchObject({
      name: 'post11',
      userId: user.get('id'),
    });
    const comments = await Comment.model.findAll();
    expect(comments.map((m) => m.get('postId'))).toEqual([post.get('id'), post.get('id'), post.get('id')]);
  });

  it('can create with array of values', async () => {
    const users = await User.repository.create({
      values: [
        {
          name: 'u1',
        },
        {
          name: 'u2',
        },
      ],
    });

    expect(users.length).toEqual(2);
  });
});

describe('repository.update', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

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
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'comments' },
        { type: 'belongsTo', name: 'user' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('update with filterByTk and with associations', async () => {
    const user = await User.model.create<any>({
      name: 'user1',
    });
    await User.repository.update({
      updateAssociationValues: ['posts'],
      filterByTk: user.id,
      values: {
        name: 'user11',
        posts: [{ name: 'post1' }],
      },
    });

    const updated = await User.model.findByPk(user.id);
    expect(updated).toMatchObject({
      name: 'user11',
    });

    const post = await Post.model.findOne({
      where: {
        name: 'post1',
      },
    });

    expect(post).toMatchObject({
      name: 'post1',
      userId: user.id,
    });

    await User.repository.update({
      updateAssociationValues: ['posts'],
      filterByTk: user.id,
      values: {
        posts: [{ name: 'post2' }, { name: 'post3' }],
      },
    });

    const updated2 = await User.repository.findOne({
      filterByTk: user.id,
      appends: ['posts'],
    });

    expect(updated2.posts.length).toBe(2);
  });

  it('update with filterByTk', async () => {
    const user = await User.model.create<any>({
      name: 'user1',
    });

    const user2 = await User.model.create<any>({
      name: 'user2',
    });

    const hook = vi.fn();
    db.on('users.afterUpdate', hook);

    await User.repository.update({
      filterByTk: user.id,
      values: {
        name: 'user11',
      },
    });

    expect(hook).toBeCalledTimes(1);

    const updated = await User.model.findByPk(user.id);

    expect(updated.get('name')).toEqual('user11');

    const u2 = await User.model.findByPk(user2.id);
    expect(u2.get('name')).toEqual('user2');
  });

  it('update with filter one by one when individualHooks is not set', async () => {
    const u1 = await User.repository.create({ values: { name: 'u1' } });

    const p1 = await Post.repository.create({ values: { name: 'p1', userId: u1.id } });
    const p2 = await Post.repository.create({ values: { name: 'p2', userId: u1.id } });
    const p3 = await Post.repository.create({ values: { name: 'p3' } });

    const hook = vi.fn();
    db.on('posts.afterUpdate', hook);

    await Post.repository.update({
      filter: {
        userId: u1.id,
      },
      values: {
        name: 'pp',
      },
    });

    const postsAfterUpdated = await Post.repository.find({ order: [['id', 'ASC']] });
    expect(postsAfterUpdated[0].name).toBe('pp');
    expect(postsAfterUpdated[1].name).toBe('pp');
    expect(postsAfterUpdated[2].name).toBe('p3');

    expect(hook).toBeCalledTimes(2);
  });

  it('update in batch when individualHooks is false', async () => {
    const u1 = await User.repository.create({ values: { name: 'u1' } });

    const p1 = await Post.repository.create({ values: { name: 'p1', userId: u1.id } });
    const p2 = await Post.repository.create({ values: { name: 'p2', userId: u1.id } });
    const p3 = await Post.repository.create({ values: { name: 'p3' } });

    const hook = vi.fn();
    db.on('posts.afterUpdate', hook);

    await Post.repository.update({
      filter: {
        userId: u1.id,
      },
      values: {
        name: 'pp',
      },
      individualHooks: false,
    });

    const postsAfterUpdated = await Post.repository.find({ order: [['id', 'ASC']] });
    expect(postsAfterUpdated[0].name).toBe('pp');
    expect(postsAfterUpdated[1].name).toBe('pp');
    expect(postsAfterUpdated[2].name).toBe('p3');

    expect(hook).toBeCalledTimes(0);
  });

  it('update in batch with belongsTo field as foreignKey', async () => {
    const u1 = await User.repository.create({ values: { name: 'u1' } });
    const u2 = await User.repository.create({ values: { name: 'u2' } });
    const p1 = await Post.repository.create({ values: { name: 'p1', userId: u1.id } });
    const p2 = await Post.repository.create({ values: { name: 'p2', userId: u1.id } });

    const r1 = await Post.repository.update({
      filter: {
        name: p1.name,
      },
      values: {
        user: u2.id,
      },
      individualHooks: false,
    });

    expect(r1).toEqual(1);

    const p1Updated = await Post.repository.findOne({
      filterByTk: p1.id,
    });
    expect(p1Updated.userId).toBe(u2.id);

    const r2 = await Post.repository.update({
      filter: {
        id: p2.id,
      },
      values: {
        user: null,
      },
      individualHooks: false,
    });

    expect(r2).toEqual(1);

    const p2Updated = await Post.repository.findOne({
      filterByTk: p2.id,
    });
    expect(p2Updated.userId).toBe(null);

    const r3 = await Post.repository.update({
      filter: {
        id: p1.id,
      },
      values: {
        user: { id: u1.id },
      },
      individualHooks: false,
    });

    expect(r3).toEqual(1);

    const p1Updated2 = await Post.repository.findOne({
      filterByTk: p1.id,
    });
    expect(p1Updated2.userId).toBe(u1.id);
  });

  it('update in batch filtered by belongsTo field as deep association field', async () => {
    const u1 = await User.repository.create({ values: { name: 'u1' } });
    const u2 = await User.repository.create({ values: { name: 'u2' } });
    const p1 = await Post.repository.create({ values: { name: 'p1', userId: u1.id } });
    const p2 = await Post.repository.create({ values: { name: 'p2', userId: u1.id } });
    const p3 = await Post.repository.create({ values: { name: 'p3', userId: u2.id } });

    const r1 = await Post.repository.update({
      filter: {
        user: {
          id: {
            $eq: u1.id,
          },
        },
      },
      values: {
        name: 'p1_1',
      },
      individualHooks: false,
    });

    expect(r1).toEqual(2);

    const updated = await Post.repository.find({
      filter: {
        id: [p1.id, p2.id],
      },
    });
    expect(updated.map((item) => item.name)).toEqual(['p1_1', 'p1_1']);
  });
});

describe('repository.destroy', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

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
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should destroy with filterByTk and empty filter', async () => {
    const user = await User.repository.create({ values: { name: 'user1' } });

    await User.repository.destroy({
      filterByTk: user.id,
      filter: {},
    });

    const user1 = await User.repository.findOne({
      filterByTk: user.id,
    });

    expect(user1).toBeNull();
  });

  it('destroy1', async () => {
    const user = await User.model.create<any>();
    await User.repository.destroy(user.id);
    const user1 = await User.model.findByPk(user.id);
    expect(user1).toBeNull();
  });

  it('destroy2', async () => {
    const user = await User.model.create<any>();
    await User.repository.destroy({
      filter: {
        id: user.id,
      },
    });
    const user1 = await User.model.findByPk(user.id);
    expect(user1).toBeNull();
  });
});

describe('repository.relatedQuery', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

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
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'user' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('create', async () => {
    const user = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

    const userPostRepository = await User.repository.relation('posts').of(<number>user.get('id'));

    const post = await userPostRepository.create({
      values: { name: 'post1' },
    });

    expect(post).toMatchObject({
      name: 'post1',
      userId: user.get('id'),
    });

    const post2 = await userPostRepository.create({
      values: { name: 'post2' },
    });

    expect(post2).toMatchObject({
      name: 'post2',
      userId: user.get('id'),
    });
  });
});
