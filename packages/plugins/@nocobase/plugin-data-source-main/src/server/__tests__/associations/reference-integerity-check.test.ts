/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { BelongsToManyRepository } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

describe('reference integrity check', () => {
  let db: Database;
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      database: {
        tablePrefix: '',
      },
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should delete cascade on belongs to many relation', async () => {
    const posts = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsToMany', name: 'tags', onDelete: 'CASCADE' },
      ],
    });

    const tags = db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'posts',
          onDelete: 'CASCADE',
        },
      ],
    });

    await db.sync();

    const post = await posts.repository.create({
      values: {
        title: 'post',
        tags: [{ name: 't1' }, { name: 't2' }],
      },
    });

    // @ts-ignore
    const throughModel = posts.model.associations.tags.through.model;

    expect(await throughModel.count()).toEqual(2);

    await post.destroy();

    expect(await throughModel.count()).toEqual(0);

    expect(db.referenceMap.getReferences('posts').length > 0).toBeTruthy();
    expect(db.referenceMap.getReferences('tags').length > 0).toBeTruthy();

    tags.removeField('posts');
    tags.removeField('tags');

    expect(db.referenceMap.getReferences('posts').length == 0).toBeTruthy();
    expect(db.referenceMap.getReferences('tags').length == 0).toBeTruthy();
  });

  it('should clean reference after collection destroy', async () => {
    const users = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasOne',
          name: 'profile',
          onDelete: 'CASCADE',
        },
      ],
    });

    const profiles = db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'integer',
          name: 'age',
        },
        {
          type: 'belongsTo',
          name: 'user',
          onDelete: 'CASCADE',
        },
      ],
    });

    await db.sync();

    expect(db.referenceMap.getReferences('users').length).toEqual(1);

    await users.repository.create({
      values: {
        name: 'foo',
        profile: {
          age: 18,
        },
      },
    });

    db.removeCollection('profiles');

    expect(db.referenceMap.getReferences('users').length).toEqual(0);

    await users.repository.destroy({
      filter: {
        name: 'foo',
      },
    });
  });

  it('should restrict when destroy nested relation via relationship repository', async () => {
    const types = db.collection({
      name: 'types',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'authors', onDelete: 'CASCADE' },
      ],
    });

    const authors = db.collection({
      name: 'authors',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts', onDelete: 'RESTRICT' },
      ],
    });

    const posts = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    await db.sync();

    const type = await types.repository.create({
      values: {
        title: 'novel',
        authors: [
          { name: 'alice', posts: [{ title: 'a' }] },
          { name: 'bob', posts: [{ title: 'b' }] },
        ],
      },
    });

    await expect(
      db.getRepository<BelongsToManyRepository>('types.authors', type.id).destroy({
        filter: { name: 'alice' },
      }),
    ).rejects.toThrowError(/RESTRICT/);
  });
});
