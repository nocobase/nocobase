/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '../index';

describe('action test', () => {
  let db: Database;
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should validate update action filter params', async () => {
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

    await db.getRepository('posts').create({
      values: [
        {
          title: 'p1',
        },
        {
          title: 'p2',
        },
      ],
    });

    const resp = await app
      .agent()
      .resource('posts')
      .update({
        filter: {},
        values: {
          title: 'p3',
        },
      });

    expect(resp.status).toBe(500);

    expect(
      await db.getRepository('posts').count({
        filter: {
          title: 'p3',
        },
      }),
    ).toEqual(0);
  });

  it('should validate destroy action filter params', async () => {
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

    await db.getRepository('posts').create({
      values: [
        {
          title: 'p1',
        },
        {
          title: 'p2',
        },
      ],
    });

    const resp = await app.agent().resource('posts').destroy({
      filter: {},
    });

    expect(resp.status).toBe(500);

    expect(await db.getRepository('posts').count({})).toEqual(2);
  });
});
