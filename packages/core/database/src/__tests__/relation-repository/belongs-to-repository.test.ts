/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BelongsToRepository, Collection, createMockDatabase, Database } from '@nocobase/database';

describe('belongs to repository', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'status' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  test('firstOrCreate', async () => {
    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostUserRepository = new BelongsToRepository(Post, 'user', p1.id);

    // 测试基本创建
    const user1 = await PostUserRepository.firstOrCreate({
      filterKeys: ['name'],
      values: {
        name: 'u1',
        status: 'active',
      },
    });

    expect(user1.name).toEqual('u1');
    expect(user1.status).toEqual('active');

    // 验证关联是否建立
    await p1.reload();
    expect(p1.userId).toEqual(user1.id);

    // 测试查找已存在记录
    const user2 = await PostUserRepository.firstOrCreate({
      filterKeys: ['name'],
      values: {
        name: 'u1',
        status: 'inactive',
      },
    });

    expect(user2.id).toEqual(user1.id);
    expect(user2.status).toEqual('active');

    // 测试多个 filterKeys
    const user3 = await PostUserRepository.firstOrCreate({
      filterKeys: ['name', 'status'],
      values: {
        name: 'u1',
        status: 'draft',
      },
    });

    expect(user3.id).not.toEqual(user1.id);
    expect(user3.status).toEqual('draft');
  });

  test('updateOrCreate', async () => {
    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostUserRepository = new BelongsToRepository(Post, 'user', p1.id);

    // 测试基本创建
    const user1 = await PostUserRepository.updateOrCreate({
      filterKeys: ['name'],
      values: {
        name: 'u1',
        status: 'active',
      },
    });

    expect(user1.name).toEqual('u1');
    expect(user1.status).toEqual('active');

    // 验证关联是否建立
    await p1.reload();
    expect(p1.userId).toEqual(user1.id);

    // 测试更新已存在记录
    const user2 = await PostUserRepository.updateOrCreate({
      filterKeys: ['name'],
      values: {
        name: 'u1',
        status: 'inactive',
      },
    });

    expect(user2.id).toEqual(user1.id);
    expect(user2.status).toEqual('inactive');

    // 测试多个 filterKeys 的创建
    const user3 = await PostUserRepository.updateOrCreate({
      filterKeys: ['name', 'status'],
      values: {
        name: 'u1',
        status: 'draft',
      },
    });

    expect(user3.id).not.toEqual(user1.id);
    expect(user3.status).toEqual('draft');

    // 验证关联是否更新
    await p1.reload();
    expect(p1.userId).toEqual(user3.id);
  });

  test('should find belongsTo target by source filterTargetKey', async () => {
    const Account = db.collection({
      name: 'accounts',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'articles' },
      ],
    });

    const Article = db.collection({
      name: 'articles',
      filterTargetKey: 'slug',
      fields: [
        { type: 'string', name: 'slug', unique: true },
        {
          type: 'belongsTo',
          name: 'account',
        },
      ],
    });

    await db.sync();

    await Account.repository.create({
      values: {
        name: 'u1',
        articles: [
          {
            slug: 'a-1',
          },
        ],
      },
    });

    const ArticleAccountRepository = db.getRepository<BelongsToRepository>('articles.account', 'a-1');
    const account = await ArticleAccountRepository.findOne();

    expect(account).not.toBeNull();
    expect(account.get('name')).toBe('u1');
  });
});
