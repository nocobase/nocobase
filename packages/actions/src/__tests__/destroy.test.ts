import { mockServer, MockServer } from '@nocobase/test';
import { registerActions } from '..';

describe('destroy', () => {
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
      fields: [{ type: 'string', name: 'content' }],
    });
    await api.db.sync();
  });

  afterEach(async () => {
    return api.destroy();
  });

  it('destroy', async () => {
    const Post = api.db.getModel('posts');
    const post = await Post.create();
    expect(
      await Post.count({
        where: { id: post.id },
      }),
    ).toBe(1);
    await api.resource('posts').destroy({
      resourceKey: post.id,
    });
    expect(
      await Post.count({
        where: { id: post.id },
      }),
    ).toBe(0);
  });

  it('destroy associations', async () => {
    const [Post, Comment] = api.db.getModels(['posts', 'comments']);
    const post = await Post.create();
    const comment = await Comment.create();
    await post.updateAssociations({
      comments: [comment],
    });
    await api.resource('posts.comments').destroy({
      resourceKey: comment.id,
      associatedKey: post.id,
    });
    const comment2 = await Comment.findByPk(comment.id);
    expect(comment2).toBeNull();
  });
});
