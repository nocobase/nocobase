import { Database } from '../../database';
import { mockDatabase } from '../';
import { IdentifierError } from '../../errors/identifier-error';

describe('belongs to field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
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
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'key', unique: true }],
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
      const Comment = db.collection({
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
});
