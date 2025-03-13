/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from '../collection';
import { Database } from '../database';
import { mockDatabase } from './index';
import { IdentifierError } from '../errors/identifier-error';

const pgOnly = () => (process.env.DB_DIALECT == 'postgres' ? it : it.skip);
describe('collection', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should remove sequelize model prototype methods after field remove', async () => {
    db.collection({
      name: 'tags',
    });

    const UserCollection = db.collection({
      name: 'users',
      fields: [{ type: 'belongsToMany', name: 'tags' }],
    });

    console.log(Object.getOwnPropertyNames(UserCollection.model.prototype));

    await UserCollection.removeField('tags');

    console.log(Object.getOwnPropertyNames(UserCollection.model.prototype));
    // @ts-ignore
    expect(UserCollection.model.prototype.getTags).toBeUndefined();
  });

  it('should not throw error when create empty collection in sqlite and mysql', async () => {
    if (!db.inDialect('sqlite', 'mysql', 'mariadb')) {
      return;
    }

    db.collection({
      name: 'empty',
      timestamps: false,
      autoGenId: false,
      fields: [],
    });

    let error;

    try {
      await db.sync({
        force: false,
        alter: {
          drop: false,
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeUndefined();
  });

  pgOnly()('can create empty collection', async () => {
    db.collection({
      name: 'empty',
      timestamps: false,
      autoGenId: false,
      fields: [],
    });

    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });

    expect(db.getCollection('empty')).toBeInstanceOf(Collection);
  });

  test('removeFromDb', async () => {
    const collection = db.collection({
      name: 'test',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });
    await db.sync();

    const field = collection.getField('name');
    const r1 = await field.existsInDb();
    expect(r1).toBe(true);
    await collection.removeFieldFromDb('name');
    const r2 = await field.existsInDb();
    expect(r2).toBe(false);

    const r3 = await collection.existsInDb();
    expect(r3).toBe(true);
    await collection.removeFromDb();
    const r4 = await collection.existsInDb();
    expect(r4).toBe(false);
  });

  test('remove from db with cascade', async () => {
    const testCollection = db.collection({
      name: 'test',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await db.sync();

    const viewName = `test_view`;
    const viewSQL = `create view ${viewName} as select * from ${testCollection.getTableNameWithSchemaAsString()}`;
    await db.sequelize.query(viewSQL);

    await expect(
      testCollection.removeFromDb({
        cascade: true,
      }),
    ).resolves.toBeTruthy();
  });

  test('collection disable authGenId', async () => {
    const Test = db.collection({
      name: 'test',
      autoGenId: false,
      fields: [{ type: 'string', name: 'uid', primaryKey: true }],
    });

    const model = Test.model;

    await db.sync();
    expect(model.rawAttributes['id']).toBeUndefined();
  });

  test('new collection', async () => {
    const collection = new Collection(
      {
        name: 'test',
      },
      { database: db },
    );

    expect(collection.name).toEqual('test');
  });

  test('collection create field', async () => {
    const collection = new Collection(
      {
        name: 'user',
      },
      { database: db },
    );

    collection.addField('age', {
      type: 'integer',
    });

    const ageField = collection.getField('age');
    expect(ageField).toBeDefined();
    expect(collection.hasField('age')).toBeTruthy();
    expect(collection.hasField('test')).toBeFalsy();

    collection.removeField('age');
    expect(collection.hasField('age')).toBeFalsy();
  });

  test('collection set fields', () => {
    const collection = new Collection(
      {
        name: 'user',
      },
      { database: db },
    );

    collection.setFields([{ type: 'string', name: 'firstName' }]);
    expect(collection.hasField('firstName')).toBeTruthy();
  });

  test('update collection field', async () => {
    const collection = new Collection(
      {
        name: 'posts',
        fields: [{ type: 'string', name: 'title' }],
      },
      {
        database: db,
      },
    );
    expect(collection.hasField('title')).toBeTruthy();

    collection.updateField('title', {
      type: 'string',
      name: 'content',
    });

    expect(collection.hasField('title')).toBeFalsy();
    expect(collection.hasField('content')).toBeTruthy();
  });

  test('collection with association', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'string', name: 'content' },
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'hasMany',
          name: 'comments',
        },
      ],
    });

    const Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'string', name: 'comment_as' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    expect(User.model.associations['posts']).toBeDefined();
    expect(Post.model.associations['comments']).toBeDefined();

    expect(User.model.associations['posts'].target.associations['comments']).toBeDefined();
  });
});

describe('collection sync', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('sync fields', async () => {
    const collection = new Collection(
      {
        name: 'users',
      },
      { database: db },
    );

    collection.setFields([
      { type: 'string', name: 'firstName' },
      { type: 'string', name: 'lastName' },
      { type: 'integer', name: 'age' },
    ]);

    await collection.sync();
    const tableFields = await (<any>collection.model).queryInterface.describeTable(`${db.getTablePrefix()}users`);

    if (db.options.underscored) {
      expect(tableFields).toHaveProperty('first_name');
      expect(tableFields).toHaveProperty('last_name');
      expect(tableFields).toHaveProperty('age');
    } else {
      expect(tableFields).toHaveProperty('firstName');
      expect(tableFields).toHaveProperty('lastName');
      expect(tableFields).toHaveProperty('age');
    }
  });

  test('sync with association not exists', async () => {
    const collection = new Collection(
      {
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'belongsTo', name: 'users' },
        ],
      },
      { database: db },
    );

    await collection.sync();

    const model = collection.model;

    const tableFields = await (<any>model).queryInterface.describeTable(`${db.getTablePrefix()}posts`);

    expect(tableFields['userId']).toBeUndefined();
  });

  test('sync with association', async () => {
    new Collection(
      {
        name: 'tags',
        fields: [{ type: 'string', name: 'name' }],
      },
      { database: db },
    );

    const collection = new Collection(
      {
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'belongsToMany', name: 'tags' },
        ],
      },
      {
        database: db,
      },
    );

    const model = collection.model;
    await collection.sync();

    if (db.options.underscored) {
      const tableFields = await (<any>model).queryInterface.describeTable(`${db.getTablePrefix()}posts_tags`);
      expect(tableFields['post_id']).toBeDefined();
      expect(tableFields['tag_id']).toBeDefined();
    } else {
      const tableFields = await (<any>model).queryInterface.describeTable(`${db.getTablePrefix()}postsTags`);
      expect(tableFields['postId']).toBeDefined();
      expect(tableFields['tagId']).toBeDefined();
    }
  });

  test('limit table name length', async () => {
    const longName =
      'this_is_a_very_long_table_name_that_should_be_truncated_this_is_a_very_long_table_name_that_should_be_truncated';

    let error;

    try {
      const collection = new Collection(
        {
          name: longName,
          fields: [{ type: 'string', name: 'test' }],
        },
        {
          database: db,
        },
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(IdentifierError);
  });

  it('should throw error when collection has same table name and same schema', async () => {
    const c1 = db.collection({
      name: 'test',
      tableName: 'test',
      schema: 'public',
    });

    let err;

    try {
      const c2 = db.collection({
        name: 'test2',
        tableName: 'test',
        schema: 'public',
      });
    } catch (e) {
      err = e;
    }

    expect(err.message).toContain('have same tableName');
  });

  it('should allow same table name in difference schema', async () => {
    const c1 = db.collection({
      name: 'test',
      tableName: 'test',
      schema: 'public',
    });

    let err;

    try {
      const c2 = db.collection({
        name: 'test2',
        tableName: 'test',
        schema: 'other_schema',
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeFalsy();
  });

  test('limit field name length', async () => {
    const longFieldName =
      'this_is_a_very_long_field_name_that_should_be_truncated_this_is_a_very_long_field_name_that_should_be_truncated';

    let error;

    try {
      const collection = new Collection(
        {
          name: 'test',
          fields: [{ type: 'string', name: longFieldName }],
        },
        {
          database: db,
        },
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(IdentifierError);
  });

  test('paranoid', async () => {
    const postCollection = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
      paranoid: true,
    });

    await db.sync();

    const p1 = await postCollection.repository.create({ values: { title: 't1' } });
    await p1.destroy();

    const p2 = await postCollection.repository.findOne({ filterByTk: p1.id });
    expect(p2).toBeNull();

    const p3 = await postCollection.repository.findOne({ filterByTk: p1.id, paranoid: false });
    expect(p3).not.toBeNull();
  });
});
