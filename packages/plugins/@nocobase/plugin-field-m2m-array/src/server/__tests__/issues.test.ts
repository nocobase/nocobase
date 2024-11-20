/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';

describe('issues', () => {
  let app: MockServer;
  let db: MockDatabase;
  let agent;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-m2m-array', 'data-source-manager', 'data-source-main', 'error-handler', 'field-sort'],
    });
    db = app.db;
    agent = app.agent();
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  test('get relation collection with m2m array field', async () => {
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
    await db.getRepository('collections').create({
      values: {
        name: 'projects',
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
          {
            name: 'users',
            type: 'hasMany',
            foreignKey: 'project_id',
            target: 'users',
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
      values: { id: 1, username: 'a', tag_ids: [1, 2] },
    });
    await db.getRepository('projects').create({
      values: { id: 1, title: 'p1', users: [1] },
    });
    const res = await agent.resource('projects.users', 1).list({
      appends: ['tags'],
    });
    expect(res.status).toBe(200);
  });
});
