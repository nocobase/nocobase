/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe('underscored options', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({
      underscored: true,
    });

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should set two field with same type', async () => {
    const collection = db.collection({
      name: 'test',
      fields: [
        {
          type: 'string',
          name: 'test_field',
        },
        {
          type: 'string',
          name: 'testField',
        },
      ],
    });

    await db.sync();
  });

  it('should not set two field with difference type but same field name', async () => {
    const collection = db.collection({
      name: 'test',
      fields: [
        {
          type: 'string',
          name: 'test_field',
        },
      ],
    });

    expect(() => {
      collection.addField('testField', { type: 'integer' });
    }).toThrowError();

    expect(() => {
      collection.addField('test123', { type: 'integer', field: 'test_field' });
    }).toThrowError();
  });

  it('should create index', async () => {
    const collectionA = db.collection({
      name: 'testCollection',
      fields: [
        {
          type: 'string',
          name: 'aField',
        },
        {
          type: 'string',
          name: 'bField',
        },
      ],
      indexes: [
        {
          type: 'UNIQUE',
          fields: ['aField', 'bField'],
        },
      ],
    });

    await db.sync();
  });

  it('should use underscored option', async () => {
    const collectionA = db.collection({
      name: 'testCollection',
      underscored: true,
      fields: [
        {
          type: 'string',
          name: 'testField',
        },
      ],
    });

    await db.sync();

    const tableName = collectionA.model.tableName;

    expect(tableName.includes('test_collection')).toBeTruthy();

    const repository = db.getRepository('testCollection');

    await repository.create({
      values: {
        testField: 'test',
      },
    });

    const record = await repository.findOne({});

    expect(record.get('testField')).toBe('test');
  });

  it('should use database options', async () => {
    const collectionA = db.collection({
      name: 'testCollection',
      fields: [
        {
          type: 'string',
          name: 'testField',
        },
      ],
    });

    await db.sync();

    const tableName = collectionA.model.tableName;

    expect(tableName.includes('test_collection')).toBeTruthy();
  });

  test('through table', async () => {
    db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
          through: 'collectionCategory',
          target: 'tags',
          sourceKey: 'name',
          foreignKey: 'postsName',
          targetKey: 'name',
          otherKey: 'tagsName',
        },
      ],
    });

    db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'posts',
          target: 'posts',
          through: 'collectionCategory',
          sourceKey: 'name',
          foreignKey: 'tagsName',
          targetKey: 'name',
          otherKey: 'postsName',
        },
      ],
    });

    await db.sync();

    const through = db.getCollection('collectionCategory');

    expect(through.model.tableName.includes('collection_category')).toBeTruthy();
  });

  test('db collectionExists', async () => {
    const collectionA = db.collection({
      name: 'testCollection',
      underscored: true,
      fields: [
        {
          type: 'string',
          name: 'testField',
        },
      ],
    });

    expect(await db.collectionExistsInDb('testCollection')).toBeFalsy();

    await db.sync();

    expect(await db.collectionExistsInDb('testCollection')).toBeTruthy();
  });

  it('should throw error when table names conflict', async () => {
    db.collection({
      name: 'b1_z',
    });

    expect(() => {
      db.collection({
        name: 'b1Z',
      });
    }).toThrowError();
  });
});

describe.each([
  { underscored: true, columnName: 'test_field' },
  { underscored: false, columnName: 'testField' },
])('index field options with underscored=$underscored', ({ underscored, columnName }) => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({ underscored });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await db.close();
  });

  it('should preserve index options and normalize the field name', async () => {
    const collection = db.collection({
      name: 'prefixIndexTests',
      fields: [{ type: 'string', name: 'testField', length: 1024 }],
      indexes: [
        {
          name: 'idx_prefix_index_tests_field',
          fields: [{ name: 'testField', length: 191 }],
        },
      ],
    });

    await db.sync();

    const indexes = await db.sequelize.getQueryInterface().showIndex(collection.getTableNameWithSchema());
    const index = indexes.find((item) => item.name === 'idx_prefix_index_tests_field');
    const configuredIndex = collection.model.options.indexes?.find(
      (item) => item.name === 'idx_prefix_index_tests_field',
    );

    expect(index?.fields.map((field) => field.attribute)).toEqual([columnName]);
    expect(configuredIndex?.fields).toEqual([{ name: columnName, length: 191 }]);
  });
});
