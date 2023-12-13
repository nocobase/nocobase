import { mockServer } from './index';
import { registerActions } from '@nocobase/actions';

describe('toggle action', () => {
  let app;
  let Post;
  let Comment;
  let Tag;
  let PostTag;

  beforeEach(async () => {
    app = mockServer();
    await app.db.clean({ drop: true });
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

  test('toggle belongs to many', async () => {
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

    expect(await p1.countTags()).toEqual(0);

    const response = await app
      .agent()
      .resource('posts.tags', p1.get('id'))
      .toggle({
        values: [t1.get('id'), t2.get('id')],
      });
    expect(response.statusCode).toEqual(200);

    expect(await p1.countTags()).toEqual(2);

    await app
      .agent()
      .resource('posts.tags', p1.get('id'))
      .toggle({
        values: [t2.get('id')],
      });

    expect(await p1.countTags()).toEqual(1);
  });
});
