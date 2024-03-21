import { mockServer } from './index';
import { registerActions } from '@nocobase/actions';

describe('create action', () => {
  let app;
  let Post;
  let Comment;
  let Tag;

  beforeEach(async () => {
    app = mockServer();
    await app.db.clean({ drop: true });
    registerActions(app);

    Post = app.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'hasMany', name: 'comments' },
        { type: 'belongsToMany', name: 'tags' },
        { type: 'string', name: 'status', defaultValue: 'draft' },
      ],
    });

    Comment = app.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    Tag = app.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'posts' },
      ],
    });
    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('create resource', async () => {
    expect(await Post.repository.findOne()).toBeNull();
    const response = await app
      .agent()
      .resource('posts')
      .create({
        values: {
          title: 't1',
        },
      });

    expect(response.statusCode).toEqual(200);
    const post = await Post.repository.findOne();
    expect(post).not.toBeNull();
    expect(post['title']).toEqual('t1');
  });

  test('create has many nested resource', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    expect(await Comment.repository.findOne()).toBeNull();

    const response = await app
      .agent()
      .resource('posts.comments', p1.get('id'))
      .create({
        values: {
          content: 'hello',
        },
      });

    const comment = await Comment.repository.findOne();
    expect(comment).not.toBeNull();
    expect(comment.get('postId')).toEqual(p1.get('id'));
    expect(comment.get('content')).toEqual('hello');
  });

  test('create belongs to many nested resource', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    expect(await Tag.repository.findOne()).toBeNull();
    const response = await app
      .agent()
      .resource('posts.tags', p1.get('id'))
      .create({
        values: {
          name: 'hello',
        },
      });

    const tag = await Tag.repository.findOne();

    expect(tag).not.toBeNull();
    expect(await tag.hasPost(p1)).toBeTruthy();
    expect(tag.get('name')).toEqual('hello');
  });

  test('create with empty values', async () => {
    const response = await app.agent().resource('posts').create({});
    expect(response.statusCode).toEqual(200);
    const p1 = await Post.repository.findOne();

    const response2 = await app.agent().resource('posts.comments', p1.get('id')).create({});
    expect(response2.statusCode).toEqual(200);
  });
});
