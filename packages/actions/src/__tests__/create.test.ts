import { initDatabase, agent } from './index';

describe('create', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
  });
  
  afterAll(() => db.close());

  describe('single', () => {
    it('create with hasMany items', async () => {
      const response = await agent
        .post('/posts')
        .send({
          title: 'title1',
          comments: [
            { content: 'content1' },
            { content: 'content2' },
          ]
        });
      expect(response.body.title).toBe('title1');

      const createdPost = await agent.get(`/posts/${response.body.id}?fields=comments`);
      expect(createdPost.body.comments.length).toBe(2);
    });

    it('create with defaultValues by custom action', async () => {
      const response = await agent
        .post('/posts:create1')
        .send({
          title: 'title1',
        });
      expect(response.body.meta).toEqual({ location: 'Kunming' });
    });

    it('create with options.fields.except by custom action', async () => {
      const response = await agent
        .post('/posts:create1')
        .send({
          title: 'title1',
          sort: 100,
          user: { name: 'aaa', profile: { email: 'email' } },
          comments: [
            { content: 'comment1', status: 'published' },
            { content: 'comment2', status: 'draft' },
          ]
        });
      expect(response.body.sort).toBe(null);
      expect(response.body.user_id).toBe(1);
      
      const postWithUser = await agent
        .get(`/posts/${response.body.id}?fields=user`);
      expect(postWithUser.body.user.id).toBe(1);
      
      const user = await agent
        .get(`/users/${postWithUser.body.user.id}?fields=profile`);
      expect(user.body.profile).toBe(null);

      const postWithComments = await agent
        .get(`/posts/${response.body.id}?fields=comments`);
      const comments = postWithComments.body.comments.map(({ content, status }) => ({ content, status }));
      expect(comments).toEqual([
        { content: 'comment1', status: null },
        { content: 'comment2', status: null },
      ]);
    });

    it('create with options.fields.only by custom action', async () => {
      const response = await agent
        .post('/posts:create2')
        .send({
          title: 'title1',
          meta: { a: 1 }
        });
      expect(response.body.title).toBe('title1');
      expect(response.body.meta).toBe(null);

      const result = await agent
        .get(`/posts/${response.body.id}`);

      expect(result.body.title).toBe('title1');
      expect(result.body.meta).toBe(null);
    });
  });

  describe('hasMany', () => {
    it('create', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      const response = await agent
        .post(`/posts/${post.id}/comments`)
        .send({
          content: 'content1',
        });
      expect(response.body.post_id).toBe(post.id);
      expect(response.body.content).toBe('content1');
      
      const comments = await agent
        .get('/comments?fields=id,content');
      expect(comments.body.count).toBe(1);
      expect(comments.body.rows).toEqual([{
        id: 1,
        content: 'content1'
      }]);
    });
  });
});
