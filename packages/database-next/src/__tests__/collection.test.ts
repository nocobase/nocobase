import { generatePrefixByPath, mockDatabase } from './index';
import { Collection } from '../collection';
import { Database } from '../database';

test('new collection', async () => {
  const db = mockDatabase();
  const collection = new Collection(
    {
      name: 'test',
    },
    { database: db },
  );

  expect(collection.name).toEqual('test');
});

test('collection create field', async () => {
  const db = mockDatabase();
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

test('create unknown type field', () => {
  const db = mockDatabase();
  const collection = new Collection(
    {
      name: 'user',
    },
    { database: db },
  );

  expect(() => {
    collection.addField('age', {
      type: 'unknown_type',
    });
  }).toThrow(new Error('unsupported field type unknown_type'));
});

test('collection set fields', () => {
  const db = mockDatabase();
  const collection = new Collection(
    {
      name: 'user',
    },
    { database: db },
  );

  collection.setFields([{ type: 'string', name: 'firstName' }]);
  expect(collection.hasField('firstName')).toBeTruthy();
});

describe('collection sync', () => {
  let db: Database;

  beforeEach(() => {
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
    const tableFields = await (<any>(
      collection.model
    )).queryInterface.describeTable(`${generatePrefixByPath()}_users`);

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
    const tableFields = await (<any>model).queryInterface.describeTable(
      `${generatePrefixByPath()}_posts`,
    );

    expect(tableFields['user_id']).toBeUndefined();
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
    const tableFields = await (<any>model).queryInterface.describeTable(
      `${generatePrefixByPath()}_posts_tags`,
    );
    expect(tableFields['postId']).toBeDefined();
    expect(tableFields['tagId']).toBeDefined();
  });
});

test('collection with association', async () => {
  const db = mockDatabase();
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
    field: [
      { type: 'string', name: 'content' },
      { type: 'string', name: 'comment_as' },
      { type: 'belongsTo', name: 'post' },
    ],
  });

  expect(User.model.associations['posts']).toBeDefined();
  expect(Post.model.associations['comments']).toBeDefined();

  expect(
    User.model.associations['posts'].target.associations['comments'],
  ).toBeDefined();

  await db.close();
});
