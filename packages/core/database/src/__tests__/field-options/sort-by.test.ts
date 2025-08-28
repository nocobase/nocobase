/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BelongsToManyRepository, Database, createMockDatabase } from '@nocobase/database';

describe('associated field order', () => {
  let db: Database;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'posts',
          sortBy: 'title',
        },
        {
          type: 'hasMany',
          name: 'records',
          sortBy: 'count',
        },
      ],
    });

    db.collection({
      name: 'records',
      fields: [
        {
          type: 'integer',
          name: 'count',
          hidden: true,
        },
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
          sortBy: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'images',
          through: 'posts_images',
          sortBy: ['-posts_images.sort'],
        },
      ],
    });

    db.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsToMany',
          name: 'posts',
        },
      ],
    });

    db.collection({
      name: 'posts_images',
      fields: [{ type: 'integer', name: 'sort' }],
    });

    db.collection({
      name: 'images',
      fields: [
        {
          type: 'belongsToMany',
          name: 'posts',
          through: 'posts_images',
        },
        {
          type: 'string',
          name: 'url',
        },
      ],
    });

    await db.sync();
  });

  it('should sort hasMany association', async () => {
    await db.getRepository('users').create({
      updateAssociationValues: ['posts'],
      values: {
        name: 'u1',
        posts: [{ title: 'c' }, { title: 'b' }, { title: 'a' }],
      },
    });

    const u1 = await db.getRepository('users').findOne({
      appends: ['posts'],
    });

    const u1Json = u1.toJSON();

    const u1Posts = u1Json['posts'];
    expect(u1Posts.map((p) => p['title'])).toEqual(['a', 'b', 'c']);
  });

  it('should sort belongsToMany association', async () => {
    await db.getRepository('posts').create({
      updateAssociationValues: ['tags'],
      values: {
        title: 'p1',
        tags: [{ name: 'c' }, { name: 'b' }, { name: 'a' }],
      },
    });

    const p1 = await db.getRepository('posts').findOne({
      appends: ['tags'],
    });

    const p1JSON = p1.toJSON();

    const p1Tags = p1JSON['tags'];
    expect(p1Tags.map((p) => p['name'])).toEqual(['a', 'b', 'c']);
  });

  it('should sort nested associations', async () => {
    await db.getRepository('users').create({
      updateAssociationValues: ['posts', 'posts.tags'],
      values: {
        name: 'u1',
        posts: [{ title: 'c', tags: [{ name: 'c' }, { name: 'b' }, { name: 'a' }] }, { title: 'b' }, { title: 'a' }],
      },
    });

    const u1 = await db.getRepository('users').findOne({
      appends: ['posts.tags', 'posts.title'],
    });

    const u1Json = u1.toJSON();

    const u1Posts = u1Json['posts'];
    expect(u1Posts.map((p) => p['title'])).toEqual(['a', 'b', 'c']);

    const postCTags = u1Posts[2]['tags'];
    expect(postCTags.map((p) => p['name'])).toEqual(['a', 'b', 'c']);
  });

  it('should sortBy hidden field', async () => {
    await db.getRepository('users').create({
      updateAssociationValues: ['records'],
      values: {
        name: 'u1',
        records: [
          { count: 3, name: 'c' },
          { count: 2, name: 'b' },
          { count: 1, name: 'a' },
        ],
      },
    });

    const u1 = await db.getRepository('users').findOne({
      appends: ['records'],
    });

    const u1Json = u1.toJSON();

    const u1Records = u1Json['records'];
    expect(u1Records[0].count).toBeUndefined();
    expect(u1Records.map((p) => p['name'])).toEqual(['a', 'b', 'c']);
  });

  it('should sortBy through table field', async () => {
    const p1 = await db.getRepository('posts').create({
      values: {
        name: 'u1',
      },
    });

    const t1 = await db.getRepository('images').create({
      values: {
        url: 't1',
      },
    });

    const t2 = await db.getRepository('images').create({
      values: {
        url: 't2',
      },
    });

    const postImageRepository = db.getRepository<BelongsToManyRepository>('posts.images', p1.get('id') as string);

    await postImageRepository.add([[t2.get('id') as string, { sort: 2 }]]);
    await postImageRepository.add([[t1.get('id') as string, { sort: 1 }]]);

    const p1Result = await db.getRepository('posts').findOne({
      appends: ['images'],
    });

    const p1JSON = p1Result.toJSON();

    const p1Images = p1JSON['images'];
    expect(p1Images.map((i) => i['url'])).toEqual(['t2', 't1']);
  });
});
