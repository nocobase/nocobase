import { mockServer } from './index';
import { registerActions } from '@nocobase/actions';

describe('get action', () => {
  let app;
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

  test('get resource', async () => {
    await Post.repository.create({
      values: {
        title: 'p0',
      },
    });

    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const response = await app
      .agent()
      .resource('posts')
      .get({
        resourceIndex: p1.get('id'),
      });

    const body = response.body;
    expect(body['id']).toEqual(p1.get('id'));
  });

  test('get has many resource', async () => {
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
      .resource('posts.comments')
      .get({
        resourceIndex: c1.get('id'),
        associatedIndex: p1.get('id'),
      });

    expect(response.body['id']).toEqual(c1.get('id'));
  });

  test('get has one resource', async () => {
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
      .resource('posts.profile')
      .get({
        associatedIndex: p1.get('id'),
      });

    expect(response.body['id']).toEqual(postProfile.get('id'));
  });
});
