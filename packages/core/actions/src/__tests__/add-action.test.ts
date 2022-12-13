import { mockServer, MockServer } from './index';
import { registerActions } from '@nocobase/actions';

describe('add action', () => {
  let app: MockServer;
  let Post;
  let Comment;
  let Tag;
  let PostTag;

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
        { type: 'set', name: 'set_field' },
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

  test('add values to set field', async () => {
    const p1 = await Post.repository.create({});
    const response = await app
      .agent()
      .resource('posts.set_field', p1.get('id'))
      .add({
        values: ['a', 'b'],
      });

    expect(response.statusCode).toEqual(200);

    const listResponse = await app.agent().resource('posts.set_field', p1.get('id')).list({
      paginate: false,
    });

    expect(listResponse.status).toEqual(200);
    expect(listResponse.body).toEqual(['a', 'b']);

    await app
      .agent()
      .resource('posts.set_field', p1.get('id'))
      .remove({
        values: ['b'],
      });

    const listResponse1 = await app.agent().resource('posts.set_field', p1.get('id')).list({
      paginate: false,
    });

    expect(listResponse1.body).toEqual(['a']);

    await app
      .agent()
      .resource('posts.set_field', p1.get('id'))
      .set({
        values: ['b', 'c', 'd'],
      });

    const listResponse2 = await app.agent().resource('posts.set_field', p1.get('id')).list({
      paginate: false,
    });

    expect(listResponse2.body).toEqual(['b', 'c', 'd']);
  });

  test('add belongs to many', async () => {
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
      .add({
        values: [t1.get('id'), t2.get('id')],
      });

    expect(response.status).toEqual(200);
    expect(await p1.countTags()).toEqual(2);

    // add with through values
    await app
      .agent()
      .resource('posts.tags', p1.get('id'))
      .add({
        values: [
          [
            t3.get('id'),
            {
              tagged_at: '123',
            },
          ],
        ],
      });

    const tags = await p1.getTags();
    expect(tags.length).toEqual(3);
    const tag = tags.find((t) => t.id == t3.get('id'));
    expect(tag.posts_tags.tagged_at).toEqual('123');
  });
});
