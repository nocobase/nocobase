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

  it('case 1', async () => {
    await Collection.repository.create({
      context: {},
      values: {
        name: 'foos',
        autoGenId: false,
        fields: [
          {
            type: 'uid',
            name: 'fkey',
            primaryKey: true,
          },
        ],
      },
    });
    await Collection.repository.create({
      context: {},
      values: {
        name: 'bars',
        autoGenId: false,
        fields: [
          {
            type: 'uid',
            name: 'bkey',
            primaryKey: true,
          },
        ],
      },
    });
    const repo = db.getRepository('collections.fields', 'foos');

    const field1 = await repo.create({
      values: {
        type: 'belongsToMany',
        target: 'bars',
      },
      context: {},
    });

    expect(field1.toJSON()).toMatchObject({
      type: 'belongsToMany',
      collectionName: 'foos',
      target: 'bars',
      targetKey: 'bkey',
      sourceKey: 'fkey',
    });

    const field2 = await repo.create({
      values: {
        type: 'belongsTo',
        target: 'bars',
      },
      context: {},
    });

    expect(field2.toJSON()).toMatchObject({
      type: 'belongsTo',
      collectionName: 'foos',
      target: 'bars',
      targetKey: 'bkey',
    });

    const field3 = await repo.create({
      values: {
        type: 'hasMany',
        target: 'bars',
        constraints: false,
      },
      context: {},
    });
    expect(field3.toJSON()).toMatchObject({
      type: 'hasMany',
      collectionName: 'foos',
      target: 'bars',
      targetKey: 'bkey',
      sourceKey: 'fkey',
    });

    const field4 = await repo.create({
      values: {
        type: 'hasOne',
        target: 'bars',
        constraints: false,
      },
      context: {},
    });
    expect(field4.toJSON()).toMatchObject({
      type: 'hasOne',
      collectionName: 'foos',
      target: 'bars',
      sourceKey: 'fkey',
    });

    await db.sync();
  });
});
