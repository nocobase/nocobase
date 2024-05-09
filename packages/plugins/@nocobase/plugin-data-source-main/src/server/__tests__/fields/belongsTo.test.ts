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
import { createApp } from '..';
import { CollectionRepository } from '../../index';

describe('belongsTo', () => {
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

  it('should check belongs to association keys', async () => {
    const Post = await Collection.repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'bigInt',
            name: 'postId',
          },
        ],
      },
      context: {},
    });

    const Tag = await Collection.repository.create({
      values: {
        name: 'tags',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    let error;
    try {
      await Field.repository.create({
        values: {
          collectionName: 'posts',
          type: 'belongsTo',
          name: 'tags',
          targetKey: 'name',
          foreignKey: 'postId',
        },
        context: {},
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain(
      'Foreign key "postId" type "BIGINT" does not match target key "name" type "STRING"',
    );
  });
  it('should load belongsTo field', async () => {
    await Collection.repository.create({
      values: {
        name: 'orders',
        fields: [
          {
            type: 'integer',
            name: 'amount',
          },
          {
            type: 'belongsTo',
            name: 'users',
            targetKey: 'uid',
            foreignKey: 'userId',
          },
        ],
      },
    });

    await Collection.repository.create({
      values: {
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'string',
            name: 'uid',
          },
        ],
      },
    });

    let error;

    try {
      await db.getRepository<CollectionRepository>('collections').load();
    } catch (e) {
      error = e;
    }

    expect(error).toBeUndefined();
  });

  it('should create belongs to field with uuid target key', async () => {
    await Collection.repository.create({
      values: {
        name: 'posts',
        autoGenId: false,
        fields: [
          {
            type: 'uuid',
            primaryKey: true,
            name: 'uuid',
          },
        ],
      },
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'comments',
        autoGenId: false,
        fields: [
          {
            type: 'uuid',
            primaryKey: true,
            name: 'uuid',
          },
        ],
      },
      context: {},
    });

    // create a belongsTo field with uuid target key
    await Field.repository.create({
      values: {
        collectionName: 'comments',
        type: 'belongsTo',
        name: 'post',
        onDelete: 'SET NULL',
        target: 'posts',
        targetKey: 'uuid',
        foreignKey: 'postUuid',
        interface: 'm2o',
      },
      context: {},
    });

    await app.runCommand('restart');

    db = app.db;

    const Comments = db.getCollection('comments');
    const foreignKeyField = Comments.getField('postUuid');
    expect(foreignKeyField).toBeTruthy();

    expect(Comments.model.associations['post']).toBeTruthy();

    await db.getRepository('posts').create({
      values: {
        comments: [{}],
      },
    });
  });
});
