/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import { DataTypes } from 'sequelize';
import { BelongsToArrayRepository } from '@nocobase/database';

describe('m2m array api, bigInt targetKey', () => {
  let app: MockServer;
  let db: MockDatabase;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-m2m-array', 'data-source-manager', 'field-sort', 'data-source-main', 'error-handler'],
    });
    db = app.db;
    await db.getRepository('collections').create({
      values: {
        name: 'tags',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
    });
    await db.getRepository('collections').create({
      values: {
        name: 'users',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          {
            name: 'username',
            type: 'string',
          },
          {
            name: 'tags',
            type: 'belongsToArray',
            foreignKey: 'tag_ids',
            target: 'tags',
            targetKey: 'id',
          },
        ],
      },
    });
    // @ts-ignore
    await db.getRepository('collections').load();
    await db.sync();
    await db.getRepository('tags').create({
      values: [{ title: 'a' }, { title: 'b' }, { title: 'c' }],
    });
    await db.getRepository('users').create({
      values: [
        { id: 1, username: 'a', tag_ids: [1, 2] },
        { id: 2, username: 'b', tag_ids: [2, 3] },
      ],
    });
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('should create foreign key array', async () => {
    const field = await db.getRepository('fields').findOne({
      filter: {
        collectionName: 'users',
        name: 'tag_ids',
      },
    });
    expect(field).toBeTruthy();
    expect(field.type).toBe('set');
    expect(field.options.dataType).toBe('array');
    expect(field.options.elementType).toBe('bigInt');
    const fieldModel = db.getCollection('users').getField('tag_ids');
    if (db.sequelize.getDialect() === 'postgres') {
      expect(fieldModel.dataType).toEqual(DataTypes.ARRAY(DataTypes.BIGINT));
    } else {
      expect(fieldModel.dataType).toEqual(DataTypes.JSON);
    }
  });

  it('should destroy relation field when destorying foreign key array', async () => {
    await db.getRepository('fields').destroy({
      filter: {
        collectionName: 'users',
        name: 'tag_ids',
      },
    });
    const relationField = await db.getRepository('fields').findOne({
      filter: {
        collectionName: 'users',
        name: 'tags',
      },
    });
    expect(relationField).toBeNull();
  });

  describe('api', () => {
    it('should list appends belongsToArray', async () => {
      const users = await db.getRepository('users').find();
      if (db.sequelize.getDialect() === 'postgres') {
        expect(users).toMatchObject([
          {
            id: 1,
            username: 'a',
            tag_ids: ['1', '2'],
          },
          {
            id: 2,
            username: 'b',
            tag_ids: ['2', '3'],
          },
        ]);
      } else {
        expect(users).toMatchObject([
          {
            id: 1,
            username: 'a',
            tag_ids: [1, 2],
          },
          {
            id: 2,
            username: 'b',
            tag_ids: [2, 3],
          },
        ]);
      }
      const users2 = await db.getRepository('users').find({
        appends: ['tags'],
      });
      expect(users2).toMatchObject([
        {
          id: 1,
          username: 'a',
          tags: [
            { id: 1, title: 'a' },
            { id: 2, title: 'b' },
          ],
        },
        {
          id: 2,
          username: 'b',
          tags: [
            { id: 2, title: 'b' },
            { id: 3, title: 'c' },
          ],
        },
      ]);
    });

    it('should get appends belongsToArray', async () => {
      const users = await db.getRepository('users').findOne({ filterByTk: 1 });
      if (db.sequelize.getDialect() === 'postgres') {
        expect(users).toMatchObject({
          id: 1,
          username: 'a',
          tag_ids: ['1', '2'],
        });
      } else {
        expect(users).toMatchObject({
          id: 1,
          username: 'a',
          tag_ids: [1, 2],
        });
      }
      const users2 = await db.getRepository('users').findOne({
        filterByTk: 1,
        appends: ['tags'],
      });
      expect(users2).toMatchObject({
        id: 1,
        username: 'a',
        tags: [
          { id: 1, title: 'a' },
          { id: 2, title: 'b' },
        ],
      });
    });

    it('should filter with the fields of belongsToArray', async () => {
      const search = db.getRepository('users').find({
        filter: {
          'tags.title': {
            $includes: ['a'],
          },
        },
      });
      const res1 = await search;
      expect(res1.length).toBe(1);
      const search2 = db.getRepository('users').find({
        filter: {
          'tags.title': {
            $includes: ['b'],
          },
        },
      });
      const res2 = await search2;
      expect(res2.length).toBe(2);
    });

    it('should create with belongsToArray', async () => {
      const user = await db.getRepository('users').create({
        values: {
          id: 3,
          username: 'c',
          tags: [{ id: 1 }, { id: 3 }],
        },
      });
      expect(user.tag_ids).toMatchObject([1, 3]);
      const user2 = await db.getRepository('users').create({
        values: {
          id: 4,
          username: 'd',
          tags: [1, 3],
        },
      });
      expect(user2.tag_ids).toMatchObject([1, 3]);
      const user3 = await db.getRepository('users').create({
        values: {
          id: 5,
          username: 'e',
          tags: { id: 1 },
        },
      });
      expect(user3.tag_ids).toMatchObject([1]);
    });

    it('should create target when creating belongsToArray', async () => {
      const user = await db.getRepository('users').create({
        values: {
          id: 5,
          username: 'e',
          tags: [{ title: 'd' }],
        },
      });
      expect(user.tag_ids).toBeDefined();
      expect(user.tag_ids.length).toBe(1);
      const tagId = user.tag_ids[0];
      const tag = await db.getRepository('tags').findOne({
        filterByTk: tagId,
      });
      expect(tag).not.toBeNull();
      expect(tag.title).toBe('d');
    });

    it('should update with belongsToArray', async () => {
      let user = await db.getRepository('users').create({
        values: {
          id: 6,
          username: 'f',
          tags: [1, 3],
        },
      });
      user = await db.getRepository('users').update({
        filterByTk: 6,
        values: {
          tags: [2, 3],
        },
      });
      expect(user[0].tag_ids).toMatchObject([2, 3]);
      user = await db.getRepository('users').update({
        filterByTk: 6,
        values: {
          tags: [{ id: 1 }, { id: 3 }],
        },
      });
      expect(user[0].tag_ids).toMatchObject([1, 3]);
      user = await db.getRepository('users').update({
        filterByTk: 6,
        values: {
          tags: null,
        },
      });
      expect(user[0].tag_ids).toMatchObject([]);
    });

    it('should create target when updating belongsToArray', async () => {
      let user = await db.getRepository('users').create({
        values: {
          id: 7,
          username: 'g',
        },
      });
      expect(user.tag_ids).toBeFalsy();
      user = await db.getRepository('users').update({
        filterByTk: 7,
        values: {
          tags: [{ title: 'e' }],
        },
      });
      user = user[0];
      expect(user.tag_ids).toBeDefined();
      expect(user.tag_ids.length).toBe(1);
      const tagId = user.tag_ids[0];
      const tag = await db.getRepository('tags').findOne({
        filterByTk: tagId,
      });
      expect(tag).toBeDefined();
      expect(tag.title).toBe('e');
    });

    it('should list belongsToArray using relation', async () => {
      const repo = db.getRepository('users.tags', 1) as BelongsToArrayRepository;
      const tags = await repo.find();
      expect(tags).toMatchObject([
        { id: 1, title: 'a' },
        { id: 2, title: 'b' },
      ]);
    });

    it('should get belongsToArray using relation', async () => {
      const repo = db.getRepository('users.tags', 1) as BelongsToArrayRepository;
      const tags = await repo.findOne({
        filterByTk: 1,
      });
      expect(tags).toMatchObject({ id: 1, title: 'a' });
    });
  });
});
