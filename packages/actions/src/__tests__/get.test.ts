import { mockServer, MockServer } from '@nocobase/test';
import { registerActions } from '..';

describe('get', () => {
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

  it('get', async () => {
    const Post = api.db.getModel('posts');
    const post = await Post.create({ title: 't1' });
    const response = await api.agent().resource('posts').get({
      resourceIndex: post.id,
      fields: ['id', 'title']
    });
    expect(post.toJSON()).toMatchObject(response.body);
  });

  it('get associations', async () => {
    const [Post, Comment] = api.db.getModels(['posts', 'comments']);
    const post = await Post.create();
    const comment = await Comment.create({ content: 'c2' });
    await post.updateAssociations({
      comments: [comment]
    });
    const response = await api.agent().resource('posts.comments').get({
      resourceIndex: comment.id,
      associatedIndex: post.id,
      fields: ['id', 'post_id', 'content']
    });
    const comment2 = await Comment.findByPk(comment.id);
    expect(comment2.toJSON()).toMatchObject(response.body);
  });
});
