import { MockServer, mockServer } from './index';
import { registerActions } from '@nocobase/actions';

describe('update action', () => {
  let app: MockServer;
  let Post;
  let Comment;
  let Tag;
  let PostTag;
  let Profile;

  beforeEach(async () => {
    app = mockServer();
    registerActions(app);

    PostTag = app.collection({
      name: 'posts_tags',
      fields: [{ type: 'string', name: 'tagged_at' }],
    });

    Post = app.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'hasMany', name: 'comments' },
        { type: 'hasOne', name: 'profile' },
        { type: 'belongsToMany', name: 'tags', through: 'posts_tags' },
        { type: 'string', name: 'status', defaultValue: 'draft' },
      ],
    });

    Profile = app.collection({
      name: 'profiles',
      fields: [
        { type: 'string', name: 'post_profile' },
        { type: 'belongsTo', name: 'post' },
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
        { type: 'belongsToMany', name: 'posts', through: 'posts_tags' },
      ],
    });

    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('update resource', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const response = await app
      .agent()
      .resource('posts')
      .update({
        filterByTk: p1.get('id'),
        values: {
          title: 'p0',
        },
      });

    await p1.reload();
    expect(p1.get('title')).toEqual('p0');
  });

  test('update has many resource', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        comments: [
          {
            content: 'c1',
          },
        ],
      },
    });

    const c1 = await Comment.repository.findOne();

    const response = await app
      .agent()
      .resource('posts.comments', p1.get('id'))
      .update({
        filterByTk: c1.get('id'),
        values: {
          content: 'c0',
        },
      });
    expect(response.statusCode).toEqual(200);

    await c1.reload();
    expect(c1.get('content')).toEqual('c0');
  });

  test('update belongs to many through value', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [
          {
            name: 't1',
            posts_tags: {
              tagged_at: '123',
            },
          },
        ],
      },
    });

    const p1t1 = (await p1.getTags())[0];

    const response = await app
      .agent()
      .resource('posts.tags', p1t1.get('id'))
      .update({
        filterByTk: p1.get('id'),
        values: {
          posts_tags: {
            tagged_at: 'test',
          },
        },
      });

    await p1t1.reload();
    expect(p1t1.posts_tags.tagged_at).toEqual('test');
  });

  test('update has one', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        profile: {
          post_profile: 'test',
        },
      },
    });

    const postProfile = await Profile.repository.findOne();

    const response = await app
      .agent()
      .resource('posts.profile', p1.get('id'))
      .update({
        values: {
          post_profile: 'test0',
        },
      });

    await postProfile.reload();
    expect(postProfile.get('post_profile')).toEqual('test0');
  });
});
