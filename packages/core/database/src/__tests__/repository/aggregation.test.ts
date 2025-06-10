/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  BelongsToManyRepository,
  Collection,
  Database,
  HasManyRepository,
  createMockDatabase,
} from '@nocobase/database';

describe('association aggregation', () => {
  let db: Database;

  let User: Collection;
  let Post: Collection;
  let Tag: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts' },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'string',
          name: 'category',
        },
        {
          type: 'integer',
          name: 'readCount',
        },
        {
          type: 'belongsTo',
          name: 'user',
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
          type: 'integer',
          name: 'score',
        },
      ],
    });

    await db.sync();
  });

  describe('belongs to many', () => {
    beforeEach(async () => {
      await User.repository.create({
        values: [
          {
            name: 'u1',
            age: 1,
            tags: [
              { name: 't1', score: 1 },
              { name: 't2', score: 2 },
            ],
          },
          {
            name: 'u2',
            age: 2,
            tags: [
              { name: 't3', score: 3 },
              { name: 't4', score: 4 },
              { name: 't5', score: 4 },
            ],
          },
        ],
      });
    });

    it('should sum field', async () => {
      const user1 = await User.repository.findOne({
        filter: {
          name: 'u1',
        },
      });

      const TagRepository = await db.getRepository<BelongsToManyRepository>('users.tags', user1.get('id'));

      const sumResult = await TagRepository.aggregate({
        field: 'score',
        method: 'sum',
      });

      expect(sumResult).toEqual(3);
    });

    it('should sum with filter', async () => {
      const user1 = await User.repository.findOne({
        filter: {
          name: 'u2',
        },
      });

      const TagRepository = await db.getRepository<BelongsToManyRepository>('users.tags', user1.get('id'));

      const sumResult = await TagRepository.aggregate({
        field: 'score',
        method: 'sum',
        filter: {
          score: 4,
        },
      });

      expect(sumResult).toEqual(8);
    });

    it('should sum with distinct', async () => {
      const user1 = await User.repository.findOne({
        filter: {
          name: 'u2',
        },
      });

      const TagRepository = await db.getRepository<BelongsToManyRepository>('users.tags', user1.get('id'));

      const sumResult = await TagRepository.aggregate({
        field: 'score',
        method: 'sum',
        distinct: true,
        filter: {
          score: 4,
        },
      });

      expect(sumResult).toEqual(4);
    });
    it('should sum with association filter', async () => {
      const sumResult = await User.repository.aggregate({
        field: 'age',
        method: 'sum',
        filter: {
          'tags.score': 4,
        },
      });

      expect(sumResult).toEqual(2);
    });
  });

  describe('has many', () => {
    beforeEach(async () => {
      await User.repository.create({
        values: [
          {
            name: 'u1',
            age: 1,
            posts: [
              { title: 'p1', category: 'c1', readCount: 1 },
              { title: 'p2', category: 'c2', readCount: 2 },
            ],
          },
          {
            name: 'u2',
            age: 2,
            posts: [
              { title: 'p3', category: 'c3', readCount: 3 },
              { title: 'p4', category: 'c4', readCount: 4 },
            ],
          },
        ],
      });
    });

    it('should sum field', async () => {
      const user1 = await User.repository.findOne({
        filter: {
          name: 'u1',
        },
      });

      const PostRepository = await db.getRepository<HasManyRepository>('users.posts', user1.get('id'));
      const sumResult = await PostRepository.aggregate({
        field: 'readCount',
        method: 'sum',
      });

      expect(sumResult).toEqual(3);
    });

    it('should sum with filter', async () => {
      const user1 = await User.repository.findOne({
        filter: {
          name: 'u1',
        },
      });

      const PostRepository = await db.getRepository<HasManyRepository>('users.posts', user1.get('id'));
      const sumResult = await PostRepository.aggregate({
        field: 'readCount',
        method: 'sum',
      });

      expect(sumResult).toEqual(3);
    });
  });
});

describe('Aggregation', () => {
  let db: Database;

  let User: Collection;
  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'integer',
          name: 'age',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        { name: 'u1', age: 1 },
        { name: 'u2', age: 2 },
        { name: 'u3', age: 3 },
        { name: 'u4', age: 4 },
        { name: 'u5', age: 5 },
        { name: 'u5', age: 5 },
      ],
    });
  });

  describe('sum', () => {
    it('should sum field', async () => {
      const sumResult = await User.repository.aggregate({
        method: 'sum',
        field: 'age',
      });

      expect(sumResult).toEqual(20);
    });

    it('should sum with distinct', async () => {
      const sumResult = await User.repository.aggregate({
        method: 'sum',
        field: 'age',
        distinct: true,
      });

      expect(sumResult).toEqual(15);
    });

    it('should sum with filter', async () => {
      const sumResult = await User.repository.aggregate({
        method: 'sum',
        field: 'age',
        filter: {
          name: 'u5',
        },
      });

      expect(sumResult).toEqual(10);
    });
  });
});
