/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database } from '@nocobase/database';

describe('empty operator', () => {
  let db: Database;

  let User: Collection;
  let Profile: Collection;
  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase({});
    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasOne',
          name: 'profile',
        },
      ],
    });

    Profile = db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'string',
          name: 'address',
        },
      ],
    });

    await db.sync({
      force: true,
    });
  });

  test('string field empty', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

    const u2 = await User.repository.create({
      values: {
        name: '',
      },
    });

    const result = await User.repository.find({
      filter: {
        'name.$empty': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('id')).toEqual(u2.get('id'));
  });

  test('string empty with or operator ', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

    const u2 = await User.repository.create({
      values: {
        name: '',
      },
    });

    const u3 = await User.repository.create({
      values: {
        name: 'u3',
      },
    });

    const result = await User.repository.find({
      filter: {
        $or: [{ 'name.$empty': true }, { name: 'u1' }],
      },
    });

    expect(result.length).toEqual(2);
  });

  test('string not empty', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

    const u2 = await User.repository.create({
      values: {
        name: '',
      },
    });

    const result = await User.repository.find({
      filter: {
        'name.$notEmpty': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('id')).toEqual(u1.get('id'));
  });

  test('string not empty with association', async () => {
    const u1 = await User.repository.create({
      updateAssociationValues: ['profile'],
      values: {
        name: 'u1',
        profile: {
          address: 'a1',
        },
      },
    });

    const u2 = await User.repository.create({
      updateAssociationValues: ['profile'],
      values: {
        name: 'u2',
        profile: {
          address: '',
        },
      },
    });

    const result = await User.repository.find({
      filter: {
        'profile.address.$notEmpty': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('id')).toEqual(u1.get('id'));
  });
});
