import { mockServer, MockServer } from '@nocobase/test';
import { registerActions } from '..';

describe('create', () => {
  let api: MockServer;

  beforeEach(async () => {
    api = mockServer({
      dataWrapping: false,
    });
    registerActions(api);
  });

  afterEach(async () => {
    return api.destroy();
  });

  it('create', async () => {
    api.database.table({
      name: 'tests',
      fields: [
        { type: 'string', name: 'name' },
      ],
    });
    await api.database.sync();
    const response = await api.resource('tests').create({
      values: { name: 'n1' },
    });
    expect(response.body.name).toBe('n1');
  });

  it('associations', async () => {
    api.database.table({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
      ],
    });
    api.database.table({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    await api.database.sync();
    const [Post, Comment] = api.database.getModels(['posts', 'comments']);
    const response = await api.resource('posts').create({
      values: {
        title: 't1',
        comments: [
          { content: 'c1' },
          { content: 'c2' },
        ]
      },
    });
    expect(await Post.count()).toBe(1);
    expect(await Comment.count()).toBe(2);
    await api.resource('posts.comments').create({
      associatedKey: response.body.id,
      values: { content: 'c1' },
    });
    expect(await Comment.count()).toBe(3);
  });
});
