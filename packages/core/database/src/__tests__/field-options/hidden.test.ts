/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Model, createMockDatabase } from '@nocobase/database';

describe('hidden field options', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('case 1', async () => {
    db.collection({
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'password',
          hidden: true,
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('tests');
    let instance = await repo.create({
      values: {
        name: 'abc',
        password: '123',
      },
    });
    expect(instance.get('password')).toBe('123');
    expect(instance.toJSON().password).toBeUndefined();
    instance = await repo.findOne({
      filter: {
        name: 'abc',
      },
    });
    expect(instance.get('password')).toBe('123');
    expect(instance.toJSON().password).toBeUndefined();
  });

  it('case 2', async () => {
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
          target: 'users',
          hidden: true,
        },
      ],
    });
    db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'password',
          hidden: true,
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('posts');
    await repo.create({
      values: {
        title: 'post1',
        user: {
          name: 'abc',
          password: '123',
        },
      },
    });
    const instance = await repo.findOne({
      filter: {
        title: 'post1',
      },
      appends: ['user'],
    });
    expect(instance.get('user')).toBeInstanceOf(Model);
    expect(instance.toJSON().user).toBeUndefined();
  });

  it('case 3', async () => {
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
          target: 'users',
        },
      ],
    });
    db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'password',
          hidden: true,
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('posts');
    await repo.create({
      values: {
        title: 'post1',
        user: {
          name: 'abc',
          password: '123',
        },
      },
    });
    const instance = await repo.findOne({
      filter: {
        title: 'post1',
      },
      appends: ['user'],
    });
    expect(instance.get('user')).toBeInstanceOf(Model);
    expect(instance.toJSON().user).toBeDefined();
    expect(instance.toJSON().user.password).toBeUndefined();
  });

  it('case 6', async () => {
    db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'hasOne',
          name: 'user',
          target: 'users',
        },
      ],
    });
    db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'password',
          hidden: true,
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('posts');
    await repo.create({
      values: {
        title: 'post1',
        user: {
          name: 'abc',
          password: '123',
        },
      },
    });
    const instance = await repo.findOne({
      filter: {
        title: 'post1',
      },
      appends: ['user'],
    });
    expect(instance.get('user')).toBeInstanceOf(Model);
    expect(instance.toJSON().user).toBeDefined();
    expect(instance.toJSON().user.password).toBeUndefined();
  });

  it('case 4', async () => {
    db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'belongsToMany',
          name: 'users',
          target: 'users',
        },
      ],
    });
    db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'password',
          hidden: true,
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('posts');
    await repo.create({
      values: {
        title: 'post1',
        users: [
          {
            name: 'abc',
            password: '123',
          },
        ],
      },
    });
    const instance = await repo.findOne({
      filter: {
        title: 'post1',
      },
      appends: ['users'],
    });
    expect(instance.get('users')[0]).toBeInstanceOf(Model);
    expect(instance.toJSON().users[0].password).toBeUndefined();
  });

  it('case 5', async () => {
    db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'hasMany',
          name: 'users',
          target: 'users',
        },
      ],
    });
    db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'password',
          hidden: true,
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('posts');
    await repo.create({
      values: {
        title: 'post1',
        users: [
          {
            name: 'abc',
            password: '123',
          },
        ],
      },
    });
    const instance = await repo.findOne({
      filter: {
        title: 'post1',
      },
      appends: ['users'],
    });
    expect(instance.get('users')[0]).toBeInstanceOf(Model);
    expect(instance.toJSON().users[0].password).toBeUndefined();
  });
});
