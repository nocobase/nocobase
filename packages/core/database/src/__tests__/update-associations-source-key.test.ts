/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Database, createMockDatabase } from '@nocobase/database';

describe('update associations', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    User = db.collection({
      name: 'users',
      autoGenId: true,
      timestamps: false,
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'posts',
          target: 'posts',
          foreignKey: 'userName',
          sourceKey: 'name',
          targetKey: 'title',
        },
      ],
    });

    Post = db.collection({
      name: 'posts',
      autoGenId: true,
      timestamps: false,
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user', target: 'users', foreignKey: 'userName', targetKey: 'name' },
      ],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create user with posts', async () => {
    await Post.repository.create({
      values: {
        title: 'post2',
        user: {
          name: 'user1',
        },
      },
    });

    expect(await User.repository.count()).toBe(1);
  });

  it('should create user with posts', async () => {
    await User.repository.create({
      values: {
        name: 'user1',
        posts: [
          {
            title: 'post1',
          },
        ],
      },
    });
    await User.repository.create({
      values: {
        name: 'user2',
        posts: [
          {
            title: 'post1',
          },
        ],
      },
    });

    expect(await Post.repository.count()).toBe(2);
  });
});

describe('update associations', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    User = db.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
      fields: [
        { type: 'string', name: 'name', primaryKey: true },
        {
          type: 'hasMany',
          name: 'posts',
          target: 'posts',
          foreignKey: 'userName',
          sourceKey: 'name',
          targetKey: 'title',
        },
      ],
    });

    Post = db.collection({
      name: 'posts',
      autoGenId: false,
      timestamps: false,
      fields: [
        { type: 'string', name: 'title', primaryKey: true },
        { type: 'belongsTo', name: 'user', target: 'users', foreignKey: 'userName', targetKey: 'name' },
      ],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create user with posts', async () => {
    await Post.repository.create({
      values: {
        title: 'post1',
      },
    });
    await Post.repository.create({
      values: {
        title: 'post2',
      },
    });
    await User.repository.create({
      values: {
        name: 'user1',
        posts: [
          {
            title: 'post1',
          },
        ],
      },
    });
    await User.repository.create({
      values: {
        name: 'user2',
        posts: [
          {
            title: 'post2',
          },
        ],
      },
    });

    expect(await Post.repository.count()).toBe(2);
  });
});

describe('update associations', () => {
  let db: Database;
  let Table: Collection;
  let Field: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    Table = db.collection({
      name: 'table',
      autoGenId: false,
      timestamps: false,
      fields: [
        { type: 'string', name: 'key', primaryKey: true },
        { type: 'string', name: 'name', unique: true },
        {
          type: 'hasMany',
          name: 'fields',
          target: 'field',
          foreignKey: 'table_name',
          sourceKey: 'name',
          targetKey: 'name',
        },
      ],
    });

    Field = db.collection({
      name: 'field',
      autoGenId: false,
      timestamps: false,
      fields: [
        { type: 'string', name: 'key', primaryKey: true },
        { type: 'string', name: 'name', unique: true },
      ],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create table with fields', async () => {
    await Field.repository.create({
      values: {
        key: 'f1',
        name: 'n1',
      },
    });
    await Field.repository.create({
      values: {
        key: 'f2',
        name: 'n2',
      },
    });
    await Table.repository.create({
      values: {
        key: 'tk1',
        name: 'tn1',
        fields: [
          {
            key: 'f1',
            name: 'n1',
          },
        ],
      },
    });
    const field = await Field.repository.findById('f1');
    expect(await Table.repository.count()).toBe(1);
    expect(field.table_name).toBe('tn1');
  });
});
