import { Database } from '../../database';
import { mockDatabase } from '../';
import { IdentifierError } from '../../errors/identifier-error';

describe('has many field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create has many association', async () => {
    const syncOptions = {
      force: false,
      alter: {
        drop: false,
      },
    };
    const A = db.collection({
      name: 'a',
      autoGenId: false,
      timestamps: false,
      fields: [
        {
          type: 'string',
          name: 'field1',
          primaryKey: true,
          defaultValue: null,
        },
        {
          type: 'string',
          name: 'name',
          unique: true,
          defaultValue: null,
        },
      ],
    });

    await db.sync(syncOptions);

    const B = db.collection({
      name: 'b',
      autoGenId: false,
      timestamps: false,
      fields: [
        {
          type: 'string',
          name: 'key1',
          primaryKey: true,
          unique: false,
          defaultValue: null,
        },
        {
          type: 'string',
          name: 'field2',
        },
      ],
    });

    await db.sync(syncOptions);

    A.setField('fields', {
      type: 'hasMany',
      target: 'b',
      sourceKey: 'name',
      foreignKey: 'ttt_name',
    });

    await db.sync(syncOptions);
  });

  it('should throw error when associated with item that null with source key', async () => {
    const User = db.collection({
      name: 'users',
      autoGenId: true,
      timestamps: false,
      fields: [
        { type: 'string', name: 'name', unique: true },
        {
          type: 'hasMany',
          name: 'profiles',
          target: 'profiles',
          foreignKey: 'userName',
          sourceKey: 'name',
        },
      ],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'string',
          name: 'address',
        },
      ],
    });

    await db.sync();

    await expect(
      User.repository.create({
        values: {
          profiles: [
            {
              address: 'address1',
            },
          ],
        },
      }),
    ).rejects.toThrow('The source key name is not set in users');
  });

  it('should check association keys type', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'bigInt', name: 'title' }],
    });

    let error;
    try {
      const User = db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'hasMany',
            name: 'posts',
            foreignKey: 'title', // wrong type
            sourceKey: 'name',
          },
        ],
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
  });

  it('association undefined', async () => {
    const collection = db.collection({
      name: 'posts',
      fields: [{ type: 'hasMany', name: 'comments' }],
    });
    await db.sync();
    expect(collection.model.associations['comments']).toBeUndefined();
  });

  it('association defined', async () => {
    const { model } = db.collection({
      name: 'posts',
      fields: [{ type: 'hasMany', name: 'comments' }],
    });
    expect(model.associations['comments']).toBeUndefined();
    const comments = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'content' }],
    });
    const association = model.associations.comments;
    expect(association).toBeDefined();
    expect(association.foreignKey).toBe('postId');
    // @ts-ignore
    expect(association.sourceKey).toBe('id');
    expect(comments.model.rawAttributes['postId']).toBeDefined();
    await db.sync();
    const post = await model.create<any>();
    await post.createComment({
      content: 'content111',
    });
    const postComments = await post.getComments();
    expect(postComments.map((comment) => comment.content)).toEqual(['content111']);
  });

  it('custom sourceKey', async () => {
    const collection = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'key', unique: true },
        {
          type: 'hasMany',
          name: 'comments',
          sourceKey: 'key',
          // foreignKey: 'postKey',
        },
      ],
    });
    const comments = db.collection({
      name: 'comments',
      fields: [],
    });
    const association = collection.model.associations.comments;
    expect(association).toBeDefined();
    expect(association.foreignKey).toBe('postKey');
    // @ts-ignore
    expect(association.sourceKey).toBe('key');
    expect(comments.model.rawAttributes['postKey']).toBeDefined();
    await db.sync();
  });

  it('custom sourceKey and foreignKey', async () => {
    const collection = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'key', unique: true },
        {
          type: 'hasMany',
          name: 'comments',
          sourceKey: 'key',
          foreignKey: 'postKey',
        },
      ],
    });
    const comments = db.collection({
      name: 'comments',
      fields: [],
    });
    const association = collection.model.associations.comments;
    expect(association).toBeDefined();
    expect(association.foreignKey).toBe('postKey');
    // @ts-ignore
    expect(association.sourceKey).toBe('key');
    expect(comments.model.rawAttributes['postKey']).toBeDefined();
    await db.sync();
  });

  it('custom name and target', async () => {
    const collection = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'key', unique: true },
        {
          type: 'hasMany',
          name: 'reviews',
          target: 'comments',
          sourceKey: 'key',
          foreignKey: 'postKey',
        },
      ],
    });
    db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'content' }],
    });
    const association = collection.model.associations.reviews;
    expect(association).toBeDefined();
    expect(association.foreignKey).toBe('postKey');
    // @ts-ignore
    expect(association.sourceKey).toBe('key');
    await db.sync();
    const post = await collection.model.create<any>({
      key: 'key1',
    });
    await post.createReview({
      content: 'content111',
    });
    const postComments = await post.getReviews();
    expect(postComments.map((comment) => comment.content)).toEqual(['content111']);
  });

  it('schema delete', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'hasMany', name: 'comments' }],
    });
    const Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'belongsTo', name: 'post' }],
    });
    await db.sync();
    Post.removeField('comments');
    expect(Post.model.associations.comments).toBeUndefined();
    expect(Comment.model.rawAttributes.postId).toBeDefined();
    Comment.removeField('post');
    expect(Comment.model.rawAttributes.postId).toBeUndefined();
  });

  it('should throw error when foreignKey is too long', async () => {
    const longForeignKey = 'a'.repeat(64);

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'hasMany', name: 'comments', foreignKey: longForeignKey }],
    });

    let error;
    try {
      const Comment = db.collection({
        name: 'comments',
        fields: [{ type: 'belongsTo', name: 'post' }],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(IdentifierError);
  });

  describe('foreign key constraint', function () {
    it('should cascade delete', async () => {
      const Post = db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'hasMany', name: 'comments', onDelete: 'CASCADE' },
        ],
      });

      const Comment = db.collection({
        name: 'comments',
        fields: [
          { type: 'string', name: 'content' },
          { type: 'belongsTo', name: 'post', onDelete: 'CASCADE' },
        ],
      });

      await db.sync();

      const post = await Post.repository.create({
        values: {
          title: 'post1',
        },
      });

      const comment = await Comment.repository.create({
        values: {
          content: 'comment1',
          postId: post.id,
        },
      });

      await Post.repository.destroy({
        filterByTk: post.id,
      });

      expect(await Comment.repository.count()).toEqual(0);
    });

    it('should throw error when foreign key constraint is violated', async function () {
      const Post = db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'hasMany', name: 'comments', onDelete: 'RESTRICT' },
        ],
      });

      const Comment = db.collection({
        name: 'comments',
        fields: [{ type: 'string', name: 'content' }],
      });

      await db.sync();

      const post = await Post.repository.create({
        values: {
          title: 'post1',
        },
      });

      const comment = await Comment.repository.create({
        values: {
          content: 'comment1',
          postId: post.id,
        },
      });

      let error;

      try {
        await Post.repository.destroy({
          filterByTk: post.id,
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });
  });
});
