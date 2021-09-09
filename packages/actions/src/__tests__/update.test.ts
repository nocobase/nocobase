import { mockServer, MockServer } from '@nocobase/test';
import { registerActions } from '..';

describe('update', () => {
  let api: MockServer;

  beforeEach(async () => {
    api = mockServer({
      dataWrapping: false,
    });
    registerActions(api);
    api.database.table({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    api.database.table({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
      ],
    });
    await api.database.sync();
  });

  afterEach(async () => {
    return api.destroy();
  });

  it('update', async () => {
    const Post = api.database.getModel('posts');
    const post = await Post.create();
    await api.resource('posts').update({
      resourceKey: post.id,
      values: {
        title: 't1',
      },
    });
    const post2 = await Post.findByPk(post.id);
    expect(post2.toJSON()).toMatchObject({
      title: 't1',
    });
  });

  it('update associations', async () => {
    const [Post, Comment] = api.database.getModels(['posts', 'comments']);
    const post = await Post.create();
    const comment = await Comment.create();
    await post.updateAssociations({
      comments: [comment]
    });
    await api.resource('posts.comments').update({
      resourceKey: comment.id,
      associatedKey: post.id,
      values: {
        content: 'c2',
      },
    });
    const comment2 = await Comment.findByPk(comment.id);
    expect(comment2.toJSON()).toMatchObject({
      content: 'c2',
    });
  });
});
