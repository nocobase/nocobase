/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, HasManyRepository } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from './index';

describe('primary key test', function () {
  let db: Database;
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should throw error when create field in collection that already has primary key', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const response = await app
      .agent()
      .resource('collections.fields', 'posts')
      .create({
        values: {
          name: 'name',
          type: 'string',
          primaryKey: true,
        },
        context: {},
      });

    expect(response.statusCode).not.toBe(200);
    const errorMessage = response.body.errors[0].message;
    expect(errorMessage).toContain('already has primary key');
  });

  it('should throw error when update field in collection that already has primary key', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
            primaryKey: true,
          },
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    let err;
    try {
      await db.getRepository<HasManyRepository>('collections.fields', 'posts').update({
        filterByTk: 'title',
        values: {
          primaryKey: true,
        },
        context: {},
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
  });

  it.skipIf(process.env['DB_DIALECT'] === 'sqlite')('should add new primary key', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
            primaryKey: true,
          },
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const response1 = await app
      .agent()
      .resource('collections.fields', 'posts')
      .update({
        filterByTk: 'id',
        values: {
          primaryKey: false,
        },
      });

    expect(response1.statusCode).toBe(200);

    const model = db.getCollection('posts').model;
    expect(model.rawAttributes['id'].primaryKey).toBe(false);

    const response2 = await app
      .agent()
      .resource('collections.fields', 'posts')
      .create({
        values: {
          primaryKey: true,
          name: 'title',
          type: 'string',
        },
      });

    expect(response2.statusCode).toBe(200);

    expect(model.rawAttributes['title'].primaryKey).toBe(true);
    expect(model.rawAttributes['id'].primaryKey).toBe(false);
  });

  it.skipIf(process.env['DB_DIALECT'] === 'sqlite')('should update new primary key', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
            primaryKey: true,
          },
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const response1 = await app
      .agent()
      .resource('collections.fields', 'posts')
      .update({
        filterByTk: 'id',
        values: {
          primaryKey: false,
        },
      });

    expect(response1.statusCode).toBe(200);

    const model = db.getCollection('posts').model;
    expect(model.rawAttributes['id'].primaryKey).toBe(false);

    const response2 = await app
      .agent()
      .resource('collections.fields', 'posts')
      .create({
        values: {
          name: 'title',
          type: 'string',
        },
      });

    expect(response2.statusCode).toBe(200);

    const response3 = await app
      .agent()
      .resource('collections.fields', 'posts')
      .update({
        filterByTk: 'title',
        values: {
          primaryKey: true,
        },
      });

    expect(response3.statusCode).toBe(200);

    expect(model.rawAttributes['title'].primaryKey).toBe(true);

    const tableInfo = await db.sequelize
      .getQueryInterface()
      .describeTable(db.getCollection('posts').getTableNameWithSchema());

    expect(tableInfo.title.primaryKey).toBe(true);
  });
});
