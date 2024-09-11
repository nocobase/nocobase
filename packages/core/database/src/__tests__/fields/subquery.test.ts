/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, mockDatabase } from '@nocobase/database';

describe('subquery', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      timezone: '+08:00',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should query subquery field value', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ name: 'subquery1', type: 'subquery', sql: `SELECT 1+1` }],
    });

    await db.sync();

    await Test.repository.create({});

    const instance = await Test.repository.findOne();

    expect(instance.get('subquery1')).toEqual(2);
  });

  it('should query subquery field with fields', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        { name: 'subquery1', type: 'subquery', sql: `SELECT 1+1` },
        { name: 'subquery2', type: 'subquery', sql: `SELECT 2+2` },
      ],
    });

    await db.sync();

    await Test.repository.create({
      values: [
        {
          name: 'test1',
        },
        {
          name: 'test2',
        },
      ],
    });

    const res = await Test.repository.find({
      fields: ['name', 'subquery2'],
    });

    expect(res[0].get('subquery2')).toEqual(4);
    expect(res[0].get('subquery1')).toBeUndefined();

    // sort
    const sortRes = await Test.repository.find({
      sort: ['subquery1'],
    });

    expect(sortRes[0].get('name')).toEqual('test1');

    // filter
    const res2 = await Test.repository.find({
      filter: {
        subquery1: 2,
      },
    });

    expect(res2.length).toEqual(2);
  });

  it('should get hasMany relation count', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [
        { name: 'title', type: 'string' },
        { name: 'userId', type: 'integer' },
      ],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        {
          name: 'posts',
          type: 'hasMany',
          target: 'posts',
          foreignKey: 'userId',
        },
        {
          name: 'postsCount',
          type: 'subquery',
          sql: `SELECT COUNT(*) FROM posts WHERE ${db.sequelize
            .getQueryInterface()
            .quoteIdentifiers(`posts.${Post.model.rawAttributes['userId'].field}`)} = users.id`,
        },
      ],
    });
    await db.sync();

    const user = await User.repository.create({
      values: {
        name: 'user1',
        posts: [{ title: 'post1' }, { title: 'post2' }],
      },
    });

    const u1 = await User.repository.findOne({});

    expect(u1.get('postsCount')).toEqual(2);
  });

  it.skip('should query subquery field in relation associations', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        {
          name: 'profile',
          type: 'hasOne',
          target: 'profiles',
          foreignKey: 'userId',
        },
      ],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        { name: 'address', type: 'string' },
        { name: 'subquery1', type: 'subquery', sql: `SELECT 1+1` },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: {
        name: 'user1',
        profile: {
          address: 'address1',
        },
      },
    });

    let u1 = await User.repository.findOne({
      appends: ['profile'],
    });

    u1 = u1.toJSON();

    expect(u1['profile']['address']).toEqual('address1');
    expect(u1['profile']['subquery1']).toEqual(2);
  });
});
