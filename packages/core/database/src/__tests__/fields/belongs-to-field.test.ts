/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import { IdentifierError } from '../../errors/identifier-error';

describe('belongs to field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should load with no action', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name', unique: true }],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user', onDelete: 'NO ACTION' },
      ],
    });

    await db.sync();

    const u1 = await User.repository.create({ values: { name: 'u1' } });
    const p1 = await Post.repository.create({ values: { title: 'p1', user: u1.id } });

    // delete u1
    await User.repository.destroy({ filterByTk: u1.id });

    // list posts with user
    const post = await Post.repository.findOne({
      appends: ['user'],
    });

    expect(post.user).toBeNull();
  });

  it('should throw error when associated with item that null with target key', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name', unique: true }],
    });

    const Profile = db.collection({
      name: 'profiles',
      autoGenId: true,
      timestamps: false,
      fields: [
        {
          type: 'belongsTo',
          name: 'user',
          target: 'users',
          foreignKey: 'userName',
          targetKey: 'name',
        },
      ],
    });

    await db.sync();

    await expect(
      Profile.repository.create({
        updateAssociationValues: ['user'],
        values: {
          user: {},
        },
      }),
    ).rejects.toThrow('The target key name is not set in users');
  });
  it('should check association keys type', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'bigInt', name: 'description' },
      ],
    });

    let error;
    try {
      const Post = db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'string', name: 'userName' },
          {
            type: 'belongsTo',
            name: 'user',
            foreignKey: 'userName',
            targetKey: 'description', // wrong type
          },
        ],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toBe(
      'Foreign key "userName" type "STRING" does not match target key "description" type "BIGINT" in belongs to relation "user" of collection "posts"',
    );
  });

  it('association undefined', async () => {
    const Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'belongsTo', name: 'post' }],
    });
    expect(Comment.model.associations['post']).toBeUndefined();
  });

  it('association defined', async () => {
    const Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    expect(Comment.model.associations.post).toBeUndefined();

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    const association = Comment.model.associations.post;

    expect(Comment.model.associations.post).toBeDefined();
    expect(association.foreignKey).toBe('postId');
    // @ts-ignore
    expect(association.targetKey).toBe('id');
    expect(Comment.model.rawAttributes.postId).toBeDefined();
    await db.sync();
    const comment = await Comment.model.create<any>();
    await comment.createPost({
      title: 'title222',
    });
    const post1 = await comment.getPost();
    expect(post1.toJSON()).toMatchObject({
      title: 'title222',
    });
    const post = await Post.model.create<any>({
      title: 'title111',
    });
    await comment.setPost(post);
    const post2 = await comment.getPost();
    expect(post2.toJSON()).toMatchObject({
      title: 'title111',
    });
  });

  it('custom targetKey and foreignKey', async () => {
    db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'key' }],
    });

    const Comment = db.collection({
      name: 'comments',
      fields: [
        {
          type: 'belongsTo',
          name: 'post',
          targetKey: 'key',
          foreignKey: 'postKey',
        },
      ],
    });

    const association = Comment.model.associations.post;
    expect(association).toBeDefined();
    expect(association.foreignKey).toBe('postKey');

    // @ts-ignore
    expect(association.targetKey).toBe('key');
    expect(Comment.model.rawAttributes['postKey']).toBeDefined();
  });

  it('should throw error when foreignKey is too long', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'key', unique: true }],
    });

    const longForeignKey = 'a'.repeat(128);

    let error;

    try {
      db.collection({
        name: 'comments1',
        fields: [
          {
            type: 'belongsTo',
            name: 'post',
            targetKey: 'key',
            foreignKey: longForeignKey,
          },
        ],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(IdentifierError);
  });

  it('custom name and target', async () => {
    const Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        {
          type: 'belongsTo',
          name: 'article',
          target: 'posts',
          targetKey: 'key',
          foreignKey: 'postKey',
        },
      ],
    });
    expect(Comment.model.associations.article).toBeUndefined();
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'key', unique: true }],
    });
    const association = Comment.model.associations.article;
    expect(Comment.model.associations.article).toBeDefined();
    expect(association.foreignKey).toBe('postKey');
    // @ts-ignore
    expect(association.targetKey).toBe('key');
    expect(Comment.model.rawAttributes.postKey).toBeDefined();
    await db.sync();
    const comment = await Comment.model.create<any>();
    await comment.createArticle({
      key: 'title222',
    });
    const post1 = await comment.getArticle();
    expect(post1.toJSON()).toMatchObject({
      key: 'title222',
    });
    const post = await Post.model.create<any>({
      key: 'title111',
    });
    await comment.setArticle(post);
    const post2 = await comment.getArticle();
    expect(post2.toJSON()).toMatchObject({
      key: 'title111',
    });
  });

  it('schema delete', async () => {
    const Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'belongsTo', name: 'post' }],
    });
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'hasMany', name: 'comments' }],
    });
    // await db.sync();
    Comment.removeField('post');
    expect(Comment.model.associations.post).toBeUndefined();
    expect(Comment.model.rawAttributes.postId).toBeDefined();
    Post.removeField('comments');
    expect(Comment.model.rawAttributes.postId).toBeUndefined();
  });

  it('has inverse field', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'hasMany', name: 'comments' }],
    });

    const Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'belongsTo', name: 'post' }],
    });

    const belongsToField = Comment.fields.get('post');
    expect(belongsToField).toBeDefined();
    const association = Post.model.associations;
    expect(association['comments']).toBeDefined();
  });

  describe('foreign constraints', () => {
    it('should set null on delete', async () => {
      const Product = db.collection({
        name: 'products',
        fields: [{ type: 'string', name: 'name' }],
      });

      const Order = db.collection({
        name: 'order',
        fields: [{ type: 'belongsTo', name: 'product', onDelete: 'SET NULL' }],
      });

      await db.sync();

      const p = await Product.repository.create({ values: { name: 'p1' } });
      const o = await Order.repository.create({ values: { product: p.id } });

      expect(o.productId).toBe(p.id);

      await Product.repository.destroy({
        filterByTk: p.id,
      });

      const newO = await o.reload();

      expect(newO.productId).toBeNull();
    });

    it('should delete reference map item when field unbind', async () => {
      const Product = db.collection({
        name: 'products',
        fields: [{ type: 'string', name: 'name' }],
      });

      const Order = db.collection({
        name: 'order',
        fields: [{ type: 'belongsTo', name: 'product', onDelete: 'CASCADE' }],
      });

      await db.sync();

      Order.removeField('product');

      expect(db.referenceMap.getReferences(Product.name)).toHaveLength(0);
    });

    it('should delete cascade', async () => {
      const Product = db.collection({
        name: 'products',
        fields: [{ type: 'string', name: 'name' }],
      });

      const Order = db.collection({
        name: 'order',
        fields: [{ type: 'belongsTo', name: 'product', onDelete: 'CASCADE' }],
      });

      await db.sync();
      const p = await Product.repository.create({ values: { name: 'p1' } });
      await Order.repository.create({ values: { product: p.id } });
      await Order.repository.create({ values: { product: p.id } });

      expect(await Order.repository.count({ filter: { productId: p.id } })).toBe(2);

      await Product.repository.destroy({
        filterByTk: p.id,
      });

      expect(await Order.repository.count({ filter: { productId: p.id } })).toBe(0);
    });

    it('should delete restrict', async () => {
      const Product = db.collection({
        name: 'products',
        fields: [{ type: 'string', name: 'name' }],
      });

      const Order = db.collection({
        name: 'order',
        fields: [{ type: 'belongsTo', name: 'product', onDelete: 'RESTRICT' }],
      });

      await db.sync();

      const p = await Product.repository.create({ values: { name: 'p1' } });
      const o = await Order.repository.create({ values: { product: p.id } });

      expect(o.productId).toBe(p.id);

      let error = null;

      try {
        await Product.repository.destroy({
          filterByTk: p.id,
        });
      } catch (e) {
        error = e;
      }

      expect(error).not.toBeNull();
    });
  });
});
