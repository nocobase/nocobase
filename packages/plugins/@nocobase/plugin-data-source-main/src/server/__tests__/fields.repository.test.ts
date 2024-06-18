/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Collection as DBCollection, StringFieldOptions } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';

describe('recreate field', () => {
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

  it('should recreate field', async () => {
    await Collection.repository.create({
      values: {
        name: 'a1',
      },
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'a2',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'a',
        type: 'string',
        collectionName: 'a1',
      },
      context: {},
    });

    await db.getRepository('a1').create({
      values: {
        a: 'a',
      },
    });

    await Field.repository.destroy({
      filter: {
        name: 'a',
        collectionName: 'a1',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        name: 'a',
        type: 'hasOne',
        collectionName: 'a1',
        target: 'a2',
        foreignKey: 'a_id',
      },
      context: {},
    });

    const a1Model = db.getRepository('a1').model;
    const results = await a1Model.findAll({
      include: [
        {
          association: 'a',
        },
      ],
    });

    expect(Object.getOwnPropertyNames(db.getCollection('a1').model.prototype)).toContain('getA');

    await Field.repository.destroy({
      filter: {
        name: 'a',
        collectionName: 'a1',
      },
    });

    expect(Object.getOwnPropertyNames(db.getCollection('a1').model.prototype)).not.toContain('getA');
    expect(Object.getOwnPropertyNames(db.getCollection('a1').model.prototype)).not.toContain('a');
  });
});

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
    await Collection.repository.create({
      values: {
        name: 'tests',
      },
    });
    await Collection.repository.create({
      values: {
        name: 'foos',
      },
    });
    await Collection.repository.create({
      values: {
        name: 'bars',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should throw error when field name already exists', async () => {
    await Field.repository.create({
      values: {
        name: 'name',
        type: 'string',
        collectionName: 'tests',
      },
    });
    let error;

    try {
      await Field.repository.create({
        values: {
          name: 'name',
          type: 'string',
          collectionName: 'tests',
        },
        context: {},
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('FieldNameExistsError');
    expect(error.value).toBe('name');
    expect(error.collectionName).toBe('tests');
  });

  it('should generate the name and key randomly', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'string',
        collectionName: 'tests',
      },
    });
    expect(field.toJSON()).toMatchObject({
      type: 'string',
      collectionName: 'tests',
    });
    expect(field.get('name')).toBeDefined();
    expect(field.get('key')).toBeDefined();
  });

  it('should not generate the name randomly', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'string',
        name: 'name',
        collectionName: 'tests',
      },
    });
    expect(field.toJSON()).toMatchObject({
      type: 'string',
      name: 'name',
      collectionName: 'tests',
    });
  });

  it('dynamic parameters', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'string',
        name: 'name',
        collectionName: 'tests',
        unique: true,
        defaultValue: 'abc',
      } as StringFieldOptions,
    });

    expect(field.toJSON()).toMatchObject({
      type: 'string',
      name: 'name',
      collectionName: 'tests',
      unique: true,
      defaultValue: 'abc',
    });
  });
});
