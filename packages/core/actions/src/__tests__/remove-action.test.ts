import { mockServer } from './index';
import { registerActions } from '@nocobase/actions';

describe('remove action', () => {
  let app;
  let Post;
  let Comment;
  let Tag;
  let PostTag;
  let Profile;

  beforeEach(async () => {
    app = mockServer();
    registerActions(app);

    await app.db.clean({ drop: true });

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

  test('remove belongs to many', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const t1 = await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    const t3 = await Tag.repository.create({
      values: {
        name: 't3',
      },
    });

    await p1.setTags([t1, t2]);

    expect(await p1.countTags()).toEqual(2);

    const response = await app
      .agent()
      .resource('posts.tags', p1.get('id'))
      .remove({
        values: [t1.get('id')],
      });

    expect(response.status).toEqual(200);
    expect(await p1.countTags()).toEqual(1);
  });

  test('remove has one', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        profile: {
          post_profile: 'test',
        },
      },
    });

    const postProfile = await Profile.repository.findOne();
    expect(await postProfile.getPost()).not.toBeNull();

    const response = await app.agent().resource('posts.profile', p1.get('id')).remove();

    await postProfile.reload();
    expect(await postProfile.getPost()).toBeNull();
  });
});
