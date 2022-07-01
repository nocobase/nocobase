import { Collection } from '../collection';
import { Database } from '../database';
import { mockDatabase } from './index';

describe('collection', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  test.skip('indexes', async () => {
    await db.clean({ drop: true });
    const collection = db.collection({
      name: 'test',
      fields: [
        {
          type: 'string',
          name: 'name',
          index: true,
        },
      ],
    });
    collection.removeField('name');
    await db.sync();
  });

  test('removeFromDb', async () => {
    await db.clean({ drop: true });
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
    await field.removeFromDb();
    const r2 = await field.existsInDb();
    expect(r2).toBe(false);

    const r3 = await collection.existsInDb();
    expect(r3).toBe(true);
    await collection.removeFromDb();
    const r4 = await collection.existsInDb();
    expect(r4).toBe(false);
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

    expect(tableFields).toHaveProperty('firstName');
    expect(tableFields).toHaveProperty('lastName');
    expect(tableFields).toHaveProperty('age');
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
    const tableFields = await (<any>model).queryInterface.describeTable(`${db.getTablePrefix()}postsTags`);
    expect(tableFields['postId']).toBeDefined();
    expect(tableFields['tagId']).toBeDefined();
  });
});
