/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database } from '@nocobase/database';

describe('destroy with targetKey', function () {
  let db: Database;
  let User: Collection;
  let u1;
  let u2;
  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    User = db.collection({
      name: 'users',
      autoGenId: false,
      fields: [
        { type: 'string', name: 'name', primaryKey: true },
        { type: 'string', name: 'status' },
      ],
    });

    await db.sync({
      force: true,
    });

    u1 = await User.repository.create({
      values: {
        name: 'u1',
        status: 'published',
      },
    });

    u2 = await User.repository.create({
      values: {
        name: 'u2',
        status: 'draft',
      },
    });
  });

  it('should destroy all', async () => {
    expect(await User.repository.count()).toEqual(2);
    await User.repository.destroy({ truncate: true });
    expect(await User.repository.count()).toEqual(0);
  });

  it('should destroy by target key', async () => {
    await User.repository.destroy({
      filterByTk: 'u2',
    });

    expect(await User.repository.count()).toEqual(1);
  });

  it('should destroy by target key and filter', async () => {
    await User.repository.destroy({
      filterByTk: 'u1',
      filter: {
        status: 'draft',
      },
    });

    expect(await User.repository.count()).toEqual(2);

    await User.repository.destroy({
      filterByTk: 'u2',
      filter: {
        status: 'draft',
      },
    });
    expect(await User.repository.count()).toEqual(1);
  });
});

describe('destroy', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({
      drop: true,
    });

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
        { type: 'string', name: 'title' },
        { type: 'string', name: 'status' },
        { type: 'belongsTo', name: 'user' },
      ],
    });
    await db.sync();
  });

  test('destroy records from no pk tables that filterTargetKey configured', async () => {
    const Test = db.collection({
      name: 'test',
      timestamps: false,
      autoGenId: false,
      filterTargetKey: 'test',
      fields: [
        {
          type: 'string',
          name: 'test',
        },
      ],
    });

    await db.sync();

    const t1 = await Test.repository.create({
      values: {
        test: 't1',
      },
    });

    await Test.repository.create({
      values: {
        test: 't2',
      },
    });

    await Test.repository.destroy({
      filterByTk: 't2',
    });

    expect(await Test.repository.count()).toEqual(1);
    expect((await Test.repository.findOne()).get('test')).toEqual('t1');
  });

  test('destroy records from tables without primary keys', async () => {
    const Test = db.collection({
      name: 'test',
      timestamps: false,
      autoGenId: false,
      fields: [
        {
          type: 'string',
          name: 'test',
        },
      ],
    });

    await db.sync();

    const t1 = await Test.repository.create({
      values: {
        test: 't1',
      },
    });

    await Test.repository.create({
      values: {
        test: 't2',
      },
    });

    const destroy = async () => {
      await Test.repository.destroy({
        filterByTk: 111,
      });
    };

    await expect(destroy()).rejects.toThrowError('filterByTk is not supported for collection that has no primary key');

    await Test.repository.destroy({
      filter: {
        test: 't2',
      },
    });

    expect(await Test.repository.count()).toEqual(1);
    expect((await Test.repository.findOne()).get('test')).toEqual('t1');
  });

  test('destroy record has no primary key', async () => {
    Post.addField('tags', {
      type: 'belongsToMany',
    });

    const tags = db.collection({
      name: 'tags',
      fields: [
        { type: 'belongsToMany', name: 'posts' },
        { type: 'string', name: 'name' },
      ],
    });

    await db.sync();

    const post = await Post.repository.create({
      updateAssociationValues: ['tags'],
      values: {
        title: 'p1',
        tags: [{ name: 't1' }],
      },
    });

    const throughCollection = db.getCollection(tags.getField('posts').options.through);

    expect(await throughCollection.repository.count()).toEqual(1);

    await throughCollection.repository.destroy({
      filter: {
        postId: post.get('id'),
      },
    });

    expect(await throughCollection.repository.count()).toEqual(0);
  });

  test('destroy with filter and filterByPk', async () => {
    const p1 = await Post.repository.create({
      values: {
        name: 'u1',
        status: 'published',
      },
    });

    await Post.repository.destroy({
      filterByTk: p1.get('id') as number,
      filter: {
        status: 'draft',
      },
    });

    expect(await Post.repository.count()).toEqual(1);
  });

  test('destroy all', async () => {
    await User.repository.create({
      values: {
        name: 'u1',
        posts: [{ title: 'u1p1' }],
      },
    });

    await User.repository.destroy();
    expect(await User.repository.count()).toEqual(1);

    await Post.repository.destroy({ truncate: true });
    expect(await Post.repository.count()).toEqual(0);
  });

  test('destroy with filter', async () => {
    await User.repository.createMany({
      records: [
        {
          name: 'u1',
        },
        {
          name: 'u3',
        },
        {
          name: 'u2',
        },
      ],
    });

    await User.repository.destroy({
      filter: {
        name: 'u1',
      },
    });

    expect(
      await User.repository.findOne({
        filter: {
          name: 'u1',
        },
      }),
    ).toBeNull();
    expect(await User.repository.count()).toEqual(2);
  });

  test('destroy with filterByPK', async () => {
    await User.repository.createMany({
      records: [
        {
          name: 'u1',
        },
        {
          name: 'u3',
        },
        {
          name: 'u2',
        },
      ],
    });

    const u2 = await User.repository.findOne({
      filter: {
        name: 'u2',
      },
    });

    await User.repository.destroy(u2['id']);
    expect(await User.repository.count()).toEqual(2);
  });

  it('should not destroy data when filter is empty', async () => {
    await User.repository.createMany({
      records: [
        {
          name: 'u1',
        },
        {
          name: 'u3',
        },
        {
          name: 'u2',
        },
      ],
    });

    let err;

    try {
      await User.repository.destroy({
        filter: {},
      });
    } catch (e) {
      err = e;
    }

    expect(await User.repository.count()).toBe(3);
  });

  it('should not destroy data when filter is not valid', async () => {
    await User.repository.createMany({
      records: [
        {
          name: 'u1',
        },
        {
          name: 'u3',
        },
        {
          name: 'u2',
        },
      ],
    });

    let err;

    try {
      await User.repository.destroy({
        filter: {
          $and: [],
          $or: [],
        },
      });
    } catch (e) {
      err = e;
    }

    expect(await User.repository.count()).toBe(3);
  });
});
