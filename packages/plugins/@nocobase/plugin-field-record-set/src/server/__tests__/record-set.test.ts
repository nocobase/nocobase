/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, mockDatabase } from '@nocobase/test';
import { RecordSetField } from '../record-set-field';
import { DataTypes } from 'sequelize';
import { RecordSetRepository } from '@nocobase/database';

describe('record-set', () => {
  let db: MockDatabase;

  beforeAll(async () => {
    db = mockDatabase();
    db.registerFieldTypes({
      recordSet: RecordSetField,
    });
    db.collection({
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
    });
    db.collection({
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
          name: 'tag_ids',
          type: 'recordSet',
          target: 'tags',
          targetKey: 'id',
        },
      ],
    });
    await db.sync();
    await db.getRepository('tags').create({
      values: [
        { id: 1, title: 'a' },
        { id: 2, title: 'b' },
        { id: 3, title: 'c' },
      ],
    });
    await db.getRepository('users').create({
      values: [
        { id: 1, username: 'a', tag_ids: [1, 2] },
        { id: 2, username: 'b', tag_ids: [2, 3] },
      ],
    });
  });

  afterAll(async () => {
    await db.clean({ drop: true });
    await db.close();
  });

  it('should get data type', () => {
    const field = db.getCollection('users').getField('tag_ids');
    const dialect = db.sequelize.getDialect();
    if (dialect === 'postgres') {
      expect(field.dataType).toEqual(DataTypes.ARRAY(DataTypes.BIGINT));
    } else {
      expect(field.dataType).toEqual(DataTypes.JSON);
    }
  });

  it('should list appends recordSet', async () => {
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
      appends: ['tag_ids'],
    });
    expect(users2).toMatchObject([
      {
        id: 1,
        username: 'a',
        tag_ids: [
          { id: 1, title: 'a' },
          { id: 2, title: 'b' },
        ],
      },
      {
        id: 2,
        username: 'b',
        tag_ids: [
          { id: 2, title: 'b' },
          { id: 3, title: 'c' },
        ],
      },
    ]);
  });

  it('should get appends recordSet', async () => {
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
      appends: ['tag_ids'],
    });
    expect(users2).toMatchObject({
      id: 1,
      username: 'a',
      tag_ids: [
        { id: 1, title: 'a' },
        { id: 2, title: 'b' },
      ],
    });
  });

  it('should filter with the fields of recordSet', async () => {
    if (db.sequelize.getDialect() !== 'postgres') {
      return;
    }
    const users = await db.getRepository('users').find({
      filter: {
        'tag_ids.title': {
          $includes: ['a'],
        },
      },
    });
    expect(users.length).toBe(1);
    const users2 = await db.getRepository('users').find({
      filter: {
        'tag_ids.title': {
          $includes: ['b'],
        },
      },
    });
    expect(users2.length).toBe(2);
  });

  it('should create with recordSet', async () => {
    const user = await db.getRepository('users').create({
      values: {
        id: 3,
        username: 'c',
        tag_ids: [{ id: 1 }, { id: 3 }],
      },
    });
    if (db.sequelize.getDialect() === 'postgres') {
      expect(user.tag_ids).toMatchObject(['1', '3']);
    } else {
      expect(user.tag_ids).toMatchObject([1, 3]);
    }
    const user2 = await db.getRepository('users').create({
      values: {
        id: 4,
        username: 'd',
        tag_ids: [1, 3],
      },
    });
    if (db.sequelize.getDialect() === 'postgres') {
      expect(user2.tag_ids).toMatchObject(['1', '3']);
    } else {
      expect(user2.tag_ids).toMatchObject([1, 3]);
    }
  });

  it('should update with recordSet', async () => {
    let user = await db.getRepository('users').create({
      values: {
        id: 5,
        username: 'e',
        tag_ids: [1, 3],
      },
    });
    user = await db.getRepository('users').update({
      filterByTk: 5,
      values: {
        tag_ids: [2, 3],
      },
    });
    expect(user[0].tag_ids).toMatchObject([2, 3]);
    user = await db.getRepository('users').update({
      filterByTk: 5,
      values: {
        tag_ids: [{ id: 1 }, { id: 3 }],
      },
    });
    expect(user[0].tag_ids).toMatchObject([1, 3]);
    user = await db.getRepository('users').update({
      filterByTk: 5,
      values: {
        tag_ids: null,
      },
    });
    expect(user[0].tag_ids).toMatchObject([]);
  });

  it('should list recordSet using relation', async () => {
    const repo = db.getRepository('users.tag_ids', 1) as RecordSetRepository;
    const tags = await repo.find();
    expect(tags).toMatchObject([
      { id: 1, title: 'a' },
      { id: 2, title: 'b' },
    ]);
  });

  it('should get recordSet using relation', async () => {
    const repo = db.getRepository('users.tag_ids', 1) as RecordSetRepository;
    const tags = await repo.findOne({
      filterByTk: 1,
    });
    expect(tags).toMatchObject({ id: 1, title: 'a' });
  });
});
