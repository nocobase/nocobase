/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database, HasOneRepository } from '@nocobase/database';

describe('has one repository', () => {
  let db: Database;
  let User: Collection;
  let Profile: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'profile' },
      ],
    });

    Profile = db.collection({
      name: 'profiles',
      fields: [
        { type: 'string', name: 'avatar' },
        { type: 'string', name: 'status' },
        { type: 'belongsTo', name: 'user' },
      ],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  test('firstOrCreate', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserProfileRepository = new HasOneRepository(User, 'profile', u1.id);

    // 测试基本创建
    const profile1 = await UserProfileRepository.firstOrCreate({
      filterKeys: ['avatar'],
      values: {
        avatar: 'avatar1.jpg',
        status: 'active',
      },
    });

    expect(profile1.avatar).toEqual('avatar1.jpg');
    expect(profile1.status).toEqual('active');
    expect(profile1.userId).toEqual(u1.id);

    // 测试查找已存在记录
    const profile2 = await UserProfileRepository.firstOrCreate({
      filterKeys: ['avatar'],
      values: {
        avatar: 'avatar1.jpg',
        status: 'inactive',
      },
    });

    expect(profile2.id).toEqual(profile1.id);
    expect(profile2.status).toEqual('active');

    // 测试多个 filterKeys
    const profile3 = await UserProfileRepository.firstOrCreate({
      filterKeys: ['avatar', 'status'],
      values: {
        avatar: 'avatar1.jpg',
        status: 'draft',
      },
    });

    expect(profile3.id).not.toEqual(profile1.id);
    expect(profile3.status).toEqual('draft');
  });

  test('updateOrCreate', async () => {
    const u1 = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserProfileRepository = new HasOneRepository(User, 'profile', u1.id);

    // 测试基本创建
    const profile1 = await UserProfileRepository.updateOrCreate({
      filterKeys: ['avatar'],
      values: {
        avatar: 'avatar1.jpg',
        status: 'active',
      },
    });

    expect(profile1.avatar).toEqual('avatar1.jpg');
    expect(profile1.status).toEqual('active');
    expect(profile1.userId).toEqual(u1.id);

    // 测试更新已存在记录
    const profile2 = await UserProfileRepository.updateOrCreate({
      filterKeys: ['avatar'],
      values: {
        avatar: 'avatar1.jpg',
        status: 'inactive',
      },
    });

    expect(profile2.id).toEqual(profile1.id);
    expect(profile2.status).toEqual('inactive');

    // 测试多个 filterKeys 的创建
    const profile3 = await UserProfileRepository.updateOrCreate({
      filterKeys: ['avatar', 'status'],
      values: {
        avatar: 'avatar1.jpg',
        status: 'draft',
      },
    });

    expect(profile3.id).not.toEqual(profile1.id);
    expect(profile3.status).toEqual('draft');
  });
});
