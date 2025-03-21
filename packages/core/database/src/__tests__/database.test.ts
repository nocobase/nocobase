/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayFieldRepository, createMockDatabase, Database, Model } from '@nocobase/database';
import path from 'path';
import { vi } from 'vitest';

describe('database', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('close state', async () => {
    if (db.isSqliteMemory()) {
      return;
    }
    expect(db.closed()).toBeFalsy();
    await db.close();
    expect(db.closed()).toBeTruthy();
    await db.reconnect();
    expect(db.closed()).toBeFalsy();
  });

  test('reconnect', async () => {
    await db.sequelize.authenticate();
    await db.close();
    await db.reconnect();
    await db.sequelize.authenticate();
  });

  test('get repository', async () => {
    db.collection({
      name: 'tests',
      fields: [{ type: 'hasMany', name: 'relations' }],
    });

    db.collection({
      name: 'relations',
    });

    expect(db.getRepository('tests')).toEqual(db.getCollection('tests').repository);
    expect(db.getRepository('tests.relations', '1')).toEqual(
      db.getCollection('tests').repository.relation('relations').of('1'),
    );
  });

  it('should get array field repository', async () => {
    db.collection({
      name: 'tests',
      fields: [{ type: 'set', name: 'set-field' }],
    });

    expect(db.getRepository('tests.set-field', '1')).toBeInstanceOf(ArrayFieldRepository);
  });

  test('import', async () => {
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
    expect(db.getCollection('test')).toBeUndefined();
    expect(db.hasCollection('test')).toBeFalsy();
    db.collection({
      name: 'test',
    });

    expect(db.getCollection('test')).toBeDefined();
    expect(db.hasCollection('test')).toBeTruthy();
  });

  test('collection beforeBulkCreate event', async () => {
    const listener = vi.fn();

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
    const listener = vi.fn();
    const listener2 = vi.fn();

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
    const listener = vi.fn();
    const listener2 = vi.fn();

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
    const postAfterCreateListener = vi.fn();

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
    const listener = vi.fn();
    db.on('beforeDefineCollection', listener);

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    expect(listener).toHaveBeenCalled();
  });

  test('off collection event', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    const postAfterCreateListener = vi.fn();

    db.on('posts.afterCreate', postAfterCreateListener);

    await db.sync();

    db.off('posts.afterCreate', postAfterCreateListener);

    await Post.repository.create({
      values: {
        title: 'test',
      },
    });

    expect(postAfterCreateListener).toHaveBeenCalledTimes(0);
  });

  test('off global event', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    const postAfterCreateListener = vi.fn();

    db.on('posts.afterCreate', postAfterCreateListener);
    db.on('afterCreate', postAfterCreateListener);

    await db.sync();

    db.off('afterCreate', postAfterCreateListener);

    await Post.repository.create({
      values: {
        title: 'test',
      },
    });

    expect(postAfterCreateListener).toHaveBeenCalledTimes(1);
  });

  test('custom model', async () => {
    class CustomModel extends Model {
      customMethod() {
        this.setDataValue('abc', 'abc');
      }
    }

    db.registerModels({
      CustomModel,
    });

    const Test = db.collection({
      name: 'tests',
      model: 'CustomModel',
    });

    await Test.sync();
    expect(Test.model.prototype).toBeInstanceOf(CustomModel);

    const test = await Test.model.create<any>();
    expect(test).toBeInstanceOf(CustomModel);
    test.customMethod();
    expect(test.get('abc')).toBe('abc');
  });

  test('getFieldByPath', () => {
    db.collection({
      name: 'users',
      fields: [{ type: 'hasMany', name: 'p', target: 'posts' }],
    });
    db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'title' }],
    });
    db.collection({
      name: 'posts',
      fields: [
        { type: 'hasMany', name: 'c', target: 'comments' },
        { type: 'belongsToMany', name: 't', target: 'tags' },
      ],
    });
    db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'title' }],
    });
    const f1 = db.getFieldByPath('users.p.t');
    const f2 = db.getFieldByPath('users.p.c');
    const f3 = db.getFieldByPath('users.p');
    expect(f1.name).toBe('t');
    expect(f2.name).toBe('c');
    expect(f3.name).toBe('p');
    expect(db.getFieldByPath('users.d')).toBeNull;
    expect(db.getFieldByPath('users.d.e')).toBeNull;
    expect(db.getFieldByPath('users.p.f')).toBeNull;
    expect(db.getFieldByPath('users.p.c.j')).toBeNull;
  });
});
