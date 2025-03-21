/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, FilterParser, createMockDatabase } from '@nocobase/database';
import { Op } from 'sequelize';

describe('filter by related', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'hasMany',
          name: 'comments',
        },
      ],
    });

    db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        {
          type: 'belongsTo',
          name: 'post',
        },
      ],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  test('filter item by string', async () => {
    const UserCollection = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    const filterParser = new FilterParser(
      {
        name: 'hello',
      },
      {
        collection: UserCollection,
      },
    );

    const filterParams = filterParser.toSequelizeParams();

    expect(filterParams).toMatchObject({
      where: {
        name: 'hello',
      },
    });
  });

  test('hasMany', async () => {
    const filter = {
      'posts.title.$iLike': '%hello%',
    };

    const filterParser = new FilterParser(filter, {
      collection: db.getCollection('users'),
    });

    const filterParams = filterParser.toSequelizeParams();

    expect(filterParams.where['$posts.title$'][Op.iLike]).toEqual('%hello%');
    expect(filterParams.include[0]['association']).toEqual('posts');
  });

  test('belongsTo', async () => {
    const filter = {
      'posts.comments.content.$iLike': '%hello%',
    };

    const filterParser = new FilterParser(filter, {
      collection: db.getCollection('users'),
    });

    const filterParams = filterParser.toSequelizeParams();

    expect(filterParams.where['$posts.comments.content$'][Op.iLike]).toEqual('%hello%');
    expect(filterParams.include[0]['association']).toEqual('posts');
    expect(filterParams.include[0]['include'][0]['association']).toEqual('comments');
  });
});
