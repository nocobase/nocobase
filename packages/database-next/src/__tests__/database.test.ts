import { Database } from '../database';
import { mockDatabase } from './index';
import { HasMany } from 'sequelize';

describe('define collection', () => {
  test('hasMany with inverse belongsTo relation', async () => {
    const db = mockDatabase();
    const UserCollection = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    const PostCollection = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    expect(UserCollection.model.associations.posts).toBeDefined();
    expect(PostCollection.model.associations.user).toBeDefined();
  });

  test('belongsTo with inverse hasMany relation', async () => {
    const db = mockDatabase();
    const UserCollection = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    const PostCollection = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });

    expect(PostCollection.model.associations.user).toBeDefined();
    expect(UserCollection.model.associations.posts).toBeDefined();
  });

  test('get collection', async () => {
    const db = mockDatabase();
    expect(db.getCollection('test')).toBeUndefined();
    expect(db.hasCollection('test')).toBeFalsy();
    db.collection({
      name: 'test',
    });

    expect(db.getCollection('test')).toBeDefined();
    expect(db.hasCollection('test')).toBeTruthy();
  });

  test('collection beforeBulkCreate event', async () => {
    const db = mockDatabase();
    const listener = jest.fn();

    db.on('posts.beforeBulkUpdate', listener);

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    await db.sync();

    await Post.repository.create({
      values: {
        title: 'old',
      },
    });

    await Post.model.update(
      {
        title: 'new',
      },
      {
        where: {
          title: 'old',
        },
      },
    );
    expect(listener).toHaveBeenCalled();
  });

  test('collection afterCreate model event', async () => {
    const db = mockDatabase();
    const postAfterCreateListener = jest.fn();

    db.on('posts.afterCreate', postAfterCreateListener);

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    await db.sync();

    await Post.repository.create({
      values: {
        title: 'test',
      },
    });

    await Post.repository.find();

    expect(postAfterCreateListener).toHaveBeenCalled();
  });

  test('collection event', async () => {
    const db = mockDatabase();
    const listener = jest.fn();
    db.on('beforeDefineCollection', listener);

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    expect(listener).toHaveBeenCalled();
  });
});
