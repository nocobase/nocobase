/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';

describe('collections repository', () => {
  let db: Database;
  let app: Application;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;

    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should remove association field after collection destroy', async () => {
    await Collection.repository.create({
      context: {},
      values: {
        name: 'posts',
        fields: [{ type: 'hasMany', name: 'comments', target: 'comments' }],
      },
    });

    await Collection.repository.create({
      context: {},
      values: {
        name: 'comments',
        fields: [{ type: 'string', name: 'content' }],
      },
    });

    await db.getRepository('collections').destroy({
      filter: {
        name: 'comments',
      },
    });

    const fields = await db.getRepository('fields').find();

    expect(fields.length).toEqual(0);
  });
});
