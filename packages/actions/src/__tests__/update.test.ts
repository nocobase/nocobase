import { mockServer, MockServer } from '@nocobase/test';
import { registerActions } from '..';

describe('update', () => {
  let api: MockServer;

  beforeEach(async () => {
    api = mockServer({
      dataWrapping: false,
    });
    registerActions(api);
    api.db.table({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    api.db.table({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
      ],
    });
    await api.db.sync();
  });

  afterEach(async () => {
    return api.destroy();
  });

  it('update', async () => {
    const Post = api.db.getModel('posts');
    const post = await Post.create();
    await api.agent().resource('posts').update({
      resourceIndex: post.id,
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
    const [Post, Comment] = api.db.getModels(['posts', 'comments']);
    const post = await Post.create();
    const comment = await Comment.create();
    await post.updateAssociations({
      comments: [comment]
    });
    await api.agent().resource('posts.comments').update({
      resourceIndex: comment.id,
      associatedIndex: post.id,
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
