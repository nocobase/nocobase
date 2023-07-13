import { registerActions } from '@nocobase/actions';
import { MockServer, mockServer } from './';

describe('get action', () => {
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
        filterByTk: p1.get('id'),
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
      .resource('posts.comments', p1.get('id'))
      .get({
        filterByTk: c1.get('id'),
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

    const response = await app.agent().resource('posts.profile', p1.get('id')).get();

    expect(response.body['id']).toEqual(postProfile.get('id'));
  });

  it('should return null when source model not found', async () => {
    const response = await app.agent().resource('posts.profile', 999).get();
    expect(response.status).toEqual(200);
  });
});
