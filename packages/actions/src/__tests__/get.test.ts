import { initDatabase, agent } from './index';

describe('get', () => {
  let db;

  beforeEach(async () => {
    db = await initDatabase();
  });

  afterAll(() => db.close());

  it('common1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create({
      title: 'title11112222'
    });
    const response = await agent
      .get(`/posts/${post.id}`);
    expect(response.body.title).toBe('title11112222');
  });

  it('hasOne1', async () => {
    const User = db.getModel('users');
    const user = await User.create();
    const response = await agent
      .get(`/users/${user.id}/profile?fields=email`);
    expect(response.body).toEqual({});
  });

  it('hasOne2', async () => {
    const User = db.getModel('users');
    const user = await User.create();
    await user.updateAssociations({
      profile: {
        email: 'email1',
      },
    });
    const response = await agent
      .get(`/users/${user.id}/profile?fields=email`);
    expect(response.body).toEqual({ email: 'email1' });
  });

  it('hasMany1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      comments: [
        { content: 'content111222' },
      ],
    });
    const [comment] = await post.getComments();
    const response = await agent
      .get(`/posts/${post.id}/comments/${comment.id}`);
    expect(response.body.post_id).toBe(post.id);
    expect(response.body.content).toBe('content111222');
  });

  it('belongsTo1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    const response = await agent
      .get(`/posts/${post.id}/user?fields=name`);
    expect(response.body).toEqual({});
  });

  it('belongsTo2', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      user: { name: 'name121234' },
    });
    const response = await agent
      .get(`/posts/${post.id}/user?fields=name`);
    expect(response.body).toEqual({ name: 'name121234' });
  });

  it('belongsToMany', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      tags: [
        { name: 'tag112233' },
      ],
    });
    const [tag] = await post.getTags();
    const response = await agent
      .get(`/posts/${post.id}/tags/${tag.id}?fields=name,posts.id`);
    expect(response.body.posts[0].id).toBe(post.id);
    expect(response.body.name).toBe('tag112233');
  });
});
