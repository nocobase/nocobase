import { initDatabase, agent } from './index';

describe('update', () => {
  let db;

  beforeEach(async () => {
    db = await initDatabase();
  });

  afterAll(() => db.close());

  describe('common', () => {
    it('basic', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      const response = await agent
        .put(`/posts/${post.id}`).send({
          title: 'title11112222'
        });
      expect(response.body.title).toBe('title11112222');
    });

    it('update json field by replacing', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create({ meta: { a: 1, b: 'c', c: { d: false } } });
      const updated = await agent
        .put(`/posts/${post.id}`).send({
          meta: {}
        });
      expect(updated.body.meta).toEqual({});
    });

    it.skip('update json field by path based update', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create({ meta: { a: 1, b: 'c', c: { d: false } } });
      const updated = await agent
        .put(`/posts/${post.id}?options[json]=merge`).send({
          meta: {
            b: 'b',
            c: { d: true }
          }
        });
      // console.log(updated.body);
    });

    // TODO(question): json 字段的覆盖/合并策略
    it.skip('update with fields overwrite default values', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      const response = await agent
        .put(`/posts:update1/${post.id}`).send({
          meta: { a: 1 },
        });
      expect(response.body.meta).toEqual({ a: 1 });

      const result = await agent
        .get(`/posts/${post.id}`);

      expect(result.body.meta).toEqual({ a: 1 });
    });

    // TODO(bug): action 的默认值处理时机不对
    it.skip('update with different fields to default values', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create({
        meta: { location: 'Beijing' }
      });
      const response = await agent
        .put(`/posts:update1/${post.id}`).send({
          meta: { a: 1 },
        });
      expect(response.body.meta).toEqual({ location: 'Beijing', a: 1 });
    });

    it('update with options.fields.expect in action', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      const response = await agent
        .put(`/posts:update1/${post.id}`).send({
          title: 'title11112222',
        });
      expect(response.body.title).toBe(null);
      expect(response.body.meta).toEqual({
        location: 'Kunming'
      });

      const result = await agent
        .get(`/posts/${post.id}`);

      expect(result.body.title).toBe(null);
      expect(result.body.meta).toEqual({
        location: 'Kunming'
      });
    });

    it('update with options.fields.only in action', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      const response = await agent
        .put(`/posts:update2/${post.id}`).send({
          title: 'title11112222',
          meta: { a: 1 }
        });
      expect(response.body.title).toBe('title11112222');
      expect(response.body.meta).toBe(null);

      const result = await agent
        .get(`/posts/${post.id}`);

      expect(result.body.title).toBe('title11112222');
      expect(result.body.meta).toBe(null);
    });
  });

  it('hasOne', async () => {
    const User = db.getModel('users');
    const user = await User.create();
    await user.updateAssociations({
      profile: { email: 'email1122' }
    });
    const response = await agent
      .put(`/users/${user.id}/profile`).send({
        email: 'email1111',
      });
    expect(response.body.email).toEqual('email1111');
  });

  it('hasOne without exist target', async () => {
    const User = db.getModel('users');
    const user = await User.create();
    const response = await agent
      .put(`/users/${user.id}/profile`).send({
        email: 'email1122',
      });
    expect(response.body).toEqual({});
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
      .put(`/posts/${post.id}/comments/${comment.id}`).send({ content: 'content111222333' });
    expect(response.body.post_id).toBe(post.id);
    expect(response.body.content).toBe('content111222333');
  });

  it('belongsTo1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      user: { name: 'name121234' },
    });
    const response = await agent
      .post(`/posts/${post.id}/user:update`).send({ name: 'name1212345' });
    expect(response.body.name).toEqual('name1212345');
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
