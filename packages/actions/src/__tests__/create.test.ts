import { initDatabase, agent } from './index';

describe('create', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
  });
  
  afterAll(() => db.close());

  describe('common', () => {
    it('create', async () => {
      const response = await agent
        .post('/posts')
        .send({
          title: 'title1',
        });
      expect(response.body.title).toBe('title1');
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
    });
  });
});
