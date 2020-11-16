import { initDatabase, agent } from './index';

describe('update', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
  });
  
  afterAll(() => db.close());

  it('common1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    const response = await agent
      .put(`/posts/${post.id}`).send({
        title: 'title11112222'
      });
    expect(response.body.title).toBe('title11112222');
  });

  it('hasOne1', async () => {
    const User = db.getModel('users');
    const user = await User.create();
    const response = await agent
      .put(`/users/${user.id}/profile`).send({
        email: 'email1122',
      });
    expect(response.body.email).toEqual('email1122');
  });

  it('hasMany1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      comments: [
        {content: 'content111222'},
      ],
    });
    const [comment] = await post.getComments();
    const response = await agent
      .put(`/posts/${post.id}/comments/${comment.id}`).send({content: 'content111222333'});
    expect(response.body.post_id).toBe(post.id);
    expect(response.body.content).toBe('content111222333');
  });

  it('belongsTo1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      user: {name: 'name121234'},
    });
    const response = await agent
      .post(`/posts/${post.id}/user:update`).send({name: 'name1212345'});
    expect(response.body.name).toEqual('name1212345');
  });

  it('belongsToMany', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      tags: [
        {name: 'tag112233'},
      ],
    });
    const [tag] = await post.getTags();
    let response = await agent
      .post(`/posts/${post.id}/tags:update/${tag.id}`).send({
        name: 'tag11223344',
        posts_tags: {
          test: 'test1',
        },
      });
    const [tag1] = await post.getTags();
    expect(tag1.posts_tags.test).toBe('test1');
    expect(response.body.name).toBe('tag11223344');
    response = await agent
      .post(`/posts/${post.id}/tags:update/${tag.id}`).send({
        posts_tags: {
          test: 'test112233',
        },
      });
    const [tag2] = await post.getTags();
    expect(tag2.posts_tags.test).toBe('test112233');
  });
});
