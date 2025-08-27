/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Database, HasOneRepository, createMockDatabase } from '@nocobase/database';

describe('has one repository', () => {
  let db: Database;

  let User: Collection;
  let Profile: Collection;

  let A1: Collection;
  let A2: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    User = db.collection({
      name: 'users',
      fields: [
        { type: 'hasOne', name: 'profile' },
        { type: 'string', name: 'name' },
      ],
    });

    Profile = db.collection({
      name: 'profiles',
      fields: [
        { type: 'string', name: 'avatar' },
        {
          type: 'hasMany',
          name: 'a1',
        },
        {
          type: 'hasMany',
          name: 'a2',
        },
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

    await db.sync();
  });

  it('should emit event after update', async () => {
    const user = await User.repository.create({
      updateAssociationValues: ['profile'],
      values: {
        name: 'u1',
        profile: {
          avatar: 'avatar',
        },
      },
    });

    const fn = vi.fn();
    db.on('profiles.afterUpdateWithAssociations', () => {
      fn();
    });

    const UserProfileRepository = new HasOneRepository(User, 'profile', user['id']);

    await UserProfileRepository.update({
      values: {
        avatar: 'new-avatar',
      },
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  test('find with appends', async () => {
    const user = await User.repository.create({
      updateAssociationValues: ['profile'],
      values: {
        name: 'u1',
        profile: {
          avatar: 'avatar',
          a1: [
            {
              name: 'a11',
            },
            {
              name: 'a12',
            },
            {
              name: 'a13',
            },
          ],
          a2: [
            {
              name: 'a21',
            },
            {
              name: 'a22',
            },
            {
              name: 'a23',
            },
          ],
        },
      },
    });

    const UserProfileRepository = new HasOneRepository(User, 'profile', user['id']);

    const profile = await UserProfileRepository.find({
      appends: ['a1', 'a2'],
    });

    const data = profile.toJSON();

    expect(data['a1']).toBeDefined();
    expect(data['a2']).toBeDefined();
  });

  test('find', async () => {
    const user = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserProfileRepository = new HasOneRepository(User, 'profile', user['id']);

    let userProfile = await UserProfileRepository.create({
      values: {
        avatar: 'test_avatar',
      },
    });

    expect(userProfile).toBeDefined();

    userProfile = await UserProfileRepository.find();
    expect(userProfile['avatar']).toEqual('test_avatar');
    userProfile = await UserProfileRepository.find({
      fields: ['id'],
    });
    expect(userProfile['id']).toBeDefined();
    expect(userProfile['avatar']).toBeUndefined();

    await UserProfileRepository.remove();
    expect(await UserProfileRepository.find()).toBeNull();

    const newProfile = await Profile.repository.create({
      values: { avatar: 'new_avatar' },
    });

    await UserProfileRepository.set(newProfile['id']);
    userProfile = await UserProfileRepository.find();
    expect(userProfile['id']).toEqual(newProfile['id']);

    await UserProfileRepository.update({
      values: {
        avatar: 'new_updated_avatar',
      },
    });

    expect((await UserProfileRepository.find())['avatar']).toEqual('new_updated_avatar');
    await UserProfileRepository.destroy();
    expect(await UserProfileRepository.find()).toBeNull();
  });
});
