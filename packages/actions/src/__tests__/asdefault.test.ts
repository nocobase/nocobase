import { initDatabase, agent } from './index';

describe('create', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
  });
  
  afterAll(() => db.close());

  describe('create', () => {
    it('undefined value as defaultValue', async () => {
      const created1 = await agent
        .post('/posts')
        .send({ title: 'title1', pinned: true });
      expect(created1.body.pinned).toBe(true);
      expect(created1.body.latest).toBe(true);

      const created2 = await agent
        .post('/posts')
        .send({ title: 'title2' });
      expect(created2.body.pinned).toBe(false);
      expect(created2.body.latest).toBe(true);

      const Post = db.getModel('posts');
      const posts = await Post.findAll({ order: [['id', 'ASC']] });

      expect(posts.map(({ pinned, latest }) => ({ pinned, latest }))).toEqual([
        { pinned: true, latest: false },
        { pinned: false, latest: true }
      ]);
    });

    it('true value set', async () => {
      const created1 = await agent
        .post('/posts')
        .send({ title: 'title1', pinned: true });
      expect(created1.body.pinned).toBe(true);

      const created2 = await agent
        .post('/posts')
        .send({ title: 'title2', pinned: true });
      expect(created2.body.pinned).toBe(true);

      const Post = db.getModel('posts');
      const posts = await Post.findAll({ order: [['id', 'ASC']] });

      expect(posts.map(({ pinned }) => pinned)).toEqual([false, true]);
    });

    it('bulkCreate', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.bulkCreate([
        { title: 'title1' },
        { title: 'title2', pinned: true },
        { title: 'title3' },
      ]);

      expect(posts.map(({ pinned, latest }) => ({ pinned, latest }))).toEqual([
        { pinned: false, latest: false },
        { pinned: true, latest: false },
        { pinned: false, latest: true }
      ]);
    });

    it('create with scopes', async () => {
      const User = db.getModel('users');
      await User.bulkCreate([{}, {}]);
      const Post = db.getModel('posts');
      const bulkCreated = await Post.bulkCreate([
        { title: 'title1', status: 'publish', user_id: 1},
        { title: 'title2', status: 'publish', user_id: 2, pinned_in_status: true },
        { title: 'title3', status: 'draft', user_id: 1, pinned_in_status: true },
      ]);
      expect(bulkCreated.map(({ pinned_in_status, pinned_in_user }) => ({ pinned_in_status, pinned_in_user }))).toEqual([
        { pinned_in_status: false, pinned_in_user: false },
        { pinned_in_status: true, pinned_in_user: true },
        { pinned_in_status: true, pinned_in_user: true }
      ]);

      const response = await agent
        .post('/users/2/posts')
        .send({ title: 'title4', status: 'draft', pinned_in_status: true });
      expect(response.body.pinned_in_status).toBe(true);
      expect(response.body.pinned_in_user).toBe(true);

      const posts = await Post.findAll({ order: [['id', 'ASC']] });
      expect(posts.map(({ title, pinned_in_status, pinned_in_user }) => ({ title, pinned_in_status, pinned_in_user }))).toMatchObject([
        { title: 'title1', pinned_in_status: false, pinned_in_user: false },
        { title: 'title2', pinned_in_status: true, pinned_in_user: false },
        { title: 'title3', pinned_in_status: false, pinned_in_user: true },
        { title: 'title4', pinned_in_status: true, pinned_in_user: true }
      ]);
    });
  });

  describe('update', () => {
    it('update one to false effect nothing else', async () => {
      const Post = db.getModel('posts');
      await Post.bulkCreate([
        { title: 'title1', pinned: true },
        { title: 'title2' }
      ]);

      const response = await agent
        .put('/posts/1')
        .send({ pinned: false });
      expect(response.body.pinned).toBe(false);

      const results = await Post.findAll({ order: [['title', 'ASC']] });

      expect(results.map(({ pinned }) => pinned)).toEqual([false, false]);
    });

    it('update one to true makes others to false', async () => {
      const Post = db.getModel('posts');
      await Post.bulkCreate([
        { title: 'title1', pinned: true },
        { title: 'title2' }
      ]);

      const response = await agent
        .put('/posts/2')
        .send({ pinned: true });
      expect(response.body.pinned).toBe(true);

      const results = await Post.findAll({ order: [['title', 'ASC']] });

      expect(results.map(({ pinned }) => pinned)).toEqual([false, true]);
    });
  });
});
