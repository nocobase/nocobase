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

describe('m2m array api, string targetKey', () => {
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
            name: 'stringCode',
            type: 'string',
            unique: true,
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
            targetKey: 'stringCode',
          },
        ],
      },
    });
    // @ts-ignore
    await db.getRepository('collections').load();
    await db.sync();
    await db.getRepository('tags').create({
      values: [
        { stringCode: 'a', title: 'a' },
        { stringCode: 'b', title: 'b' },
        { stringCode: 'c', title: 'c' },
      ],
    });
    await db.getRepository('users').create({
      values: [
        { id: 1, username: 'a', tag_ids: ['a', 'b'] },
        { id: 2, username: 'b', tag_ids: ['b', 'c'] },
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
    expect(field).toBeDefined();
    expect(field.type).toBe('set');
    expect(field.options.dataType).toBe('array');
    expect(field.options.elementType).toBe('string');
    const fieldModel = db.getCollection('users').getField('tag_ids');
    if (db.sequelize.getDialect() === 'postgres') {
      expect(fieldModel.dataType).toEqual(DataTypes.ARRAY(DataTypes.STRING));
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
      expect(users).toMatchObject([
        {
          id: 1,
          username: 'a',
          tag_ids: ['a', 'b'],
        },
        {
          id: 2,
          username: 'b',
          tag_ids: ['b', 'c'],
        },
      ]);
      const users2 = await db.getRepository('users').find({
        appends: ['tags'],
      });
      expect(users2).toMatchObject([
        {
          id: 1,
          username: 'a',
          tags: [
            { stringCode: 'a', title: 'a' },
            { stringCode: 'b', title: 'b' },
          ],
        },
        {
          id: 2,
          username: 'b',
          tags: [
            { stringCode: 'b', title: 'b' },
            { stringCode: 'c', title: 'c' },
          ],
        },
      ]);
    });

    it('should get appends belongsToArray', async () => {
      const users = await db.getRepository('users').findOne({ filterByTk: 1 });
      expect(users).toMatchObject({
        id: 1,
        username: 'a',
        tag_ids: ['a', 'b'],
      });
      const users2 = await db.getRepository('users').findOne({
        filterByTk: 1,
        appends: ['tags'],
      });
      expect(users2).toMatchObject({
        id: 1,
        username: 'a',
        tags: [
          { stringCode: 'a', title: 'a' },
          { stringCode: 'b', title: 'b' },
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
          tags: [{ stringCode: 'a' }, { stringCode: 'c' }],
        },
      });
      expect(user.tag_ids).toMatchObject(['a', 'c']);
      const user2 = await db.getRepository('users').create({
        values: {
          id: 4,
          username: 'd',
          tags: ['a', 'c'],
        },
      });
      expect(user2.tag_ids).toMatchObject(['a', 'c']);
      const user3 = await db.getRepository('users').create({
        values: {
          id: 5,
          username: 'e',
          tags: { stringCode: 'a' },
        },
      });
      expect(user3.tag_ids).toMatchObject(['a']);
    });

    it('should create target when creating belongsToArray', async () => {
      const user = await db.getRepository('users').create({
        values: {
          id: 5,
          username: 'e',
          tags: [{ stringCode: 'd', title: 'd' }],
        },
      });
      expect(user.tag_ids).toBeDefined();
      expect(user.tag_ids.length).toBe(1);
      const tagCode = user.tag_ids[0];
      const tag = await db.getRepository('tags').findOne({
        filter: {
          stringCode: tagCode,
        },
      });
      expect(tag).not.toBeNull();
      expect(tag.title).toBe('d');
    });

    it('should update with belongsToArray', async () => {
      let user = await db.getRepository('users').create({
        values: {
          id: 6,
          username: 'f',
          tags: ['a', 'c'],
        },
      });
      user = await db.getRepository('users').update({
        filterByTk: 6,
        values: {
          tags: ['b', 'c'],
        },
      });
      expect(user[0].tag_ids).toMatchObject(['b', 'c']);
      user = await db.getRepository('users').update({
        filterByTk: 6,
        values: {
          tags: [{ stringCode: 'a' }, { stringCode: 'c' }],
        },
      });
      expect(user[0].tag_ids).toMatchObject(['a', 'c']);
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
          tags: [{ stringCode: 'e', title: 'e' }],
        },
      });
      user = user[0];
      expect(user.tag_ids).toBeDefined();
      expect(user.tag_ids.length).toBe(1);
      const tagCode = user.tag_ids[0];
      const tag = await db.getRepository('tags').findOne({
        filter: {
          stringCode: tagCode,
        },
      });
      expect(tag).toBeDefined();
      expect(tag.title).toBe('e');
    });

    it('should list belongsToArray using relation', async () => {
      const repo = db.getRepository('users.tags', 1) as BelongsToArrayRepository;
      const tags = await repo.find();
      expect(tags).toMatchObject([
        { stringCode: 'a', title: 'a' },
        { stringCode: 'b', title: 'b' },
      ]);
    });

    it('should get belongsToArray using relation', async () => {
      const repo = db.getRepository('users.tags', 1) as BelongsToArrayRepository;
      const tags = await repo.findOne({
        filterByTk: 'a',
      });
      expect(tags).toMatchObject({ stringCode: 'a', title: 'a' });
    });
  });
});
