import { mockDatabase } from './index';
import { Collection } from '../collection';

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
