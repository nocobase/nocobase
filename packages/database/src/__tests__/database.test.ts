import { mockDatabase } from './index';
import path from 'path';

describe('database', () => {
  test('import', async () => {
    const db = mockDatabase();
    await db.import({
      directory: path.resolve(__dirname, './fixtures/collections'),
    });

    expect(db.getCollection('posts')).toBeDefined();
    expect(db.getCollection('users')).toBeDefined();
    expect(db.getCollection('tags')).toBeDefined();

    const tagCollection = db.getCollection('tags');

    // extend field
    expect(tagCollection.fields.has('color')).toBeTruthy();
    expect(tagCollection.fields.has('color2')).toBeTruthy();
    expect(tagCollection.fields.has('name')).toBeTruthy();

    // delay extend
    expect(db.getCollection('images')).toBeUndefined();

    db.collection({
      name: 'images',
      fields: [{ type: 'string', name: 'name' }],
    });

    const imageCollection = db.getCollection('images');

    expect(imageCollection).toBeDefined();
    expect(imageCollection.fields.has('name')).toBeTruthy();
    expect(imageCollection.fields.has('url')).toBeTruthy();
    expect(imageCollection.fields.has('url2')).toBeTruthy();
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

  test('global model event', async () => {
    const db = mockDatabase();
    const listener = jest.fn();
    const listener2 = jest.fn();

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    await db.sync();

    db.on('afterCreate', listener);
    db.on('posts.afterCreate', listener2);

    await Post.repository.create({
      values: {
        title: 'test',
      },
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  test('collection multiple model event', async () => {
    const db = mockDatabase();
    const listener = jest.fn();
    const listener2 = jest.fn();

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    await db.sync();

    db.on('posts.afterCreate', listener);
    db.on('posts.afterCreate', listener2);

    await Post.repository.create({
      values: {
        title: 'test',
      },
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
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
