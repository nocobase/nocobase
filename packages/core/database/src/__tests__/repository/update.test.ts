/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Database, createMockDatabase } from '@nocobase/database';

describe('update', () => {
  let db: Database;
  let Post: Collection;
  let Tag: Collection;
  let PostTag: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();

    await db.clean({ drop: true });
    PostTag = db.collection({
      name: 'post_tag',
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
          autoIncrement: true,
        },
        {
          type: 'belongsTo',
          name: 'post',
          target: 'posts',
          foreignKey: 'post_id',
        },
        {
          type: 'belongsTo',
          name: 'tag',
          target: 'tags',
          foreignKey: 'tag_id',
        },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'belongsToMany',
          name: 'tags',
          through: 'post_tag',
          foreignKey: 'post_id',
          otherKey: 'tag_id',
        },
        {
          type: 'hasMany',
          name: 'posts_tags',
          foreignKey: 'post_id',
          target: 'post_tag',
        },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'posts',
          through: 'post_tag',
          foreignKey: 'tag_id',
          otherKey: 'post_id',
        },
      ],
    });

    await db.sync();
  });

  it('should update collection that without primary key', async () => {
    const collection = db.collection({
      name: 'without_pk',
      autoGenId: false,
      timestamps: false,
      fields: [{ type: 'string', name: 'nameWithUnderscore' }],
    });

    await collection.sync();

    await collection.repository.create({
      values: {
        nameWithUnderscore: 'item1',
      },
    });

    await collection.repository.update({
      values: {
        nameWithUnderscore: 'item2',
      },
      filter: {
        nameWithUnderscore: 'item1',
      },
    });

    const item = await collection.repository.findOne({
      filter: {
        nameWithUnderscore: 'item2',
      },
    });

    expect(item).toBeDefined();
  });

  it('should throw error when update data conflicted', async () => {
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
    const post1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [t1.get('id')],
      },
    });

    const postTag = await PostTag.repository.findOne();

    let error;
    try {
      await Post.repository.update({
        filterByTk: post1.get('id'),
        values: {
          posts_tags: [
            {
              id: postTag.get('id'),
              tag: t1.get('id'),
              post: post1.get('id'),
            },
          ],
          tags: [t2.get('id')],
        },
      });
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();

    let error2;
    try {
      await Post.repository.update({
        filterByTk: post1.get('id'),
        values: {
          tags: [t2.get('id')],
          posts_tags: [
            {
              id: postTag.get('id'),
              tag: t1.get('id'),
              post: post1.get('id'),
            },
          ],
        },
      });
    } catch (err) {
      error2 = err;
    }
    expect(error2).toBeDefined();

    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts', target: 'posts', foreignKey: 'user_id' },
      ],
    });

    await db.sync();
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
        posts: [post1.get('id')],
      },
    });

    let error3;

    try {
      await User.repository.update({
        filterByTk: u1.get('id'),
        values: {
          posts: [
            {
              id: post1.get('id'),
              tags: [t2.get('id')],
              posts_tags: [
                {
                  id: postTag.get('id'),
                  tag: t1.get('id'),
                  post: post1.get('id'),
                },
              ],
            },
          ],
        },
      });
    } catch (err) {
      error3 = err;
    }

    expect(error3).toBeDefined();
  });

  it('should update tags to null', async () => {
    await db.getRepository('posts').create({
      values: {
        title: 'p1',
        tags: [{ name: 't1' }],
      },
    });

    const [p1] = await db.getRepository('posts').update({
      values: {
        tags: null,
      },
      filter: {
        title: 'p1',
      },
    });

    expect(p1.toJSON()['tags']).toEqual([]);
  });

  it('should not update items when filter is empty', async () => {
    await db.getRepository('posts').create({
      values: [
        {
          title: 'p1',
        },
        {
          title: 'p2',
        },
      ],
    });

    let err;

    try {
      await db.getRepository('posts').update({
        values: {
          title: 'p3',
        },
        filter: {},
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.message).toContain('must provide filter or filterByTk for update call');
  });

  it('should not update items when filter is not a valid filter object', async () => {
    await db.getRepository('posts').create({
      values: [
        {
          title: 'p1',
        },
        {
          title: 'p2',
        },
      ],
    });

    let err;

    try {
      await db.getRepository('posts').update({
        values: {
          title: 'p3',
        },
        filter: {
          $and: [],
          $or: [],
        },
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.message).toContain('must provide filter or filterByTk for update call');
  });

  it('should not update items without filter or filterByPk', async () => {
    await db.getRepository('posts').create({
      values: {
        title: 'p1',
      },
    });

    let error;

    try {
      await db.getRepository('posts').update({
        values: {
          title: 'p3',
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeUndefined();

    const p1 = await db.getRepository('posts').findOne();
    expect(p1.toJSON()['title']).toEqual('p1');

    await db.getRepository('posts').update({
      values: {
        title: 'p3',
      },
      filterByTk: p1.get('id') as number,
    });

    await p1.reload();
    expect(p1.toJSON()['title']).toEqual('p3');
  });
});
