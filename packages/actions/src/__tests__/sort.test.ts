import { initDatabase, agent } from './index';

describe('get', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
    const User = db.getModel('users');
    const users = await User.bulkCreate(Array.from('abcdefg').map(name => ({ name })));

    const Post = db.getModel('posts');
    const posts = await Post.bulkCreate(Array(10).fill(null).map((_, i) => ({
      title: `title_${i}`,
      status: i % 2 ? 'publish' : 'draft',
      user_id: users[i % users.length].id
    })));

    await posts.reduce((promise, post) => promise.then(() => post.updateAssociations({
      comments: Array(post.sort % 5).fill(null).map((_, index) => ({
        content: `content_${index}`,
        status: index % 2 ? 'published' : 'draft',
        user_id: users[index % users.length].id
      }))
    })), Promise.resolve());
  });
  
  afterAll(() => db.close());

  describe.only('sort value initialization', () => {
    it('initialization by bulkCreate', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        order: [['id', 'ASC']]
      });
      expect(posts.map(({ id, sort, sort_in_status, sort_in_user }) => ({ id, sort, sort_in_status, sort_in_user }))).toEqual([
        { id: 1, sort: 1, sort_in_status: 1, sort_in_user: 1 },
        { id: 2, sort: 2, sort_in_status: 1, sort_in_user: 1 },
        { id: 3, sort: 3, sort_in_status: 2, sort_in_user: 1 },
        { id: 4, sort: 4, sort_in_status: 2, sort_in_user: 1 },
        { id: 5, sort: 5, sort_in_status: 3, sort_in_user: 1 },
        { id: 6, sort: 6, sort_in_status: 3, sort_in_user: 1 },
        { id: 7, sort: 7, sort_in_status: 4, sort_in_user: 1 },
        { id: 8, sort: 8, sort_in_status: 4, sort_in_user: 2 },
        { id: 9, sort: 9, sort_in_status: 5, sort_in_user: 2 },
        { id: 10, sort: 10, sort_in_status: 5, sort_in_user: 2 }
      ]);
    });

    it('initialization by updateAssociations', async () => {
      const Comment = db.getModel('comments');
      const comments = await Comment.findAll({
        order: [['id', 'ASC']]
      });
      expect(comments.map(({ id, sort, sort_in_status, sort_in_post }) => ({ id, sort, sort_in_status, sort_in_post }))).toEqual([
        { id: 1, sort: 1, sort_in_status: 1, sort_in_post: 1 },
        { id: 2, sort: 2, sort_in_status: 2, sort_in_post: 1 },
        { id: 3, sort: 3, sort_in_status: 1, sort_in_post: 2 },
        { id: 4, sort: 4, sort_in_status: 3, sort_in_post: 1 },
        { id: 5, sort: 5, sort_in_status: 2, sort_in_post: 2 },
        { id: 6, sort: 6, sort_in_status: 4, sort_in_post: 3 },
        { id: 7, sort: 7, sort_in_status: 5, sort_in_post: 1 },
        { id: 8, sort: 8, sort_in_status: 3, sort_in_post: 2 },
        { id: 9, sort: 9, sort_in_status: 6, sort_in_post: 3 },
        { id: 10, sort: 10, sort_in_status: 4, sort_in_post: 4 },
        { id: 11, sort: 11, sort_in_status: 7, sort_in_post: 1 },
        { id: 12, sort: 12, sort_in_status: 8, sort_in_post: 1 },
        { id: 13, sort: 13, sort_in_status: 5, sort_in_post: 2 },
        { id: 14, sort: 14, sort_in_status: 9, sort_in_post: 1 },
        { id: 15, sort: 15, sort_in_status: 6, sort_in_post: 2 },
        { id: 16, sort: 16, sort_in_status: 10, sort_in_post: 3 },
        { id: 17, sort: 17, sort_in_status: 11, sort_in_post: 1 },
        { id: 18, sort: 18, sort_in_status: 7, sort_in_post: 2 },
        { id: 19, sort: 19, sort_in_status: 12, sort_in_post: 3 },
        { id: 20, sort: 20, sort_in_status: 8, sort_in_post: 4 }
      ]);
    });

    it('sort value of append item', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create({ user_id: 1 });
      expect(post.sort).toBe(11);
      expect(post.sort_in_status).toBe(6);
      expect(post.sort_in_user).toBe(3);
    });
  });

  describe('sort in whole table', () => {
    it('init sort value', async () => {
      const Post = db.getModel('posts');
    });

    it('move id=1 by offset=1', async () => {
      const Post = db.getModel('posts');
      await agent
        .post('/posts:sort/1')
        .send({
          offset: 1,
        });

      const post1 = await Post.findByPk(1);
      expect(post1.get('sort')).toBe(1);

      const post2 = await Post.findByPk(2);
      expect(post2.get('sort')).toBe(0);
    });

    it('move id=1 by offset=9', async () => {
      const Post = db.getModel('posts');
      await agent
        .post('/posts:sort/1')
        .send({
          offset: 9,
        });

      const post1 = await Post.findByPk(1);
      expect(post1.get('sort')).toBe(9);

      const post2 = await Post.findByPk(2);
      expect(post2.get('sort')).toBe(0);

      const post10 = await Post.findByPk(10);
      expect(post10.get('sort')).toBe(8);

      const post11 = await Post.findByPk(11);
      expect(post11.get('sort')).toBe(10);
    });

    it('move id=1 by offset=-1', async () => {
      const Post = db.getModel('posts');
      await agent
        .post('/posts:sort/1')
        .send({
          offset: -1,
        });

      const post1 = await Post.findByPk(1);
      expect(post1.get('sort')).toBe(0);

      const post2 = await Post.findByPk(2);
      expect(post2.get('sort')).toBe(1);
    });

    it('move id=2 by offset=8', async () => {
      const Post = db.getModel('posts');
      await agent
        .post('/posts:sort/2')
        .send({
          offset: 8,
        });

      const post2 = await Post.findByPk(2);
      expect(post2.get('sort')).toBe(9);

      const post10 = await Post.findByPk(10);
      expect(post10.get('sort')).toBe(8);
    });

    it('move id=2 by offset=-1', async () => {
      const Post = db.getModel('posts');
      await agent
        .post('/posts:sort/2')
        .send({
          offset: -1,
        });

      const post2 = await Post.findByPk(2);
      expect(post2.get('sort')).toBe(0);

      const post1 = await Post.findByPk(1);
      expect(post1.get('sort')).toBe(1);
    });

    it('move id=2 by offset=Infinity', async () => {
      const Post = db.getModel('posts');
      await agent
        .post('/posts:sort/2')
        .send({
          offset: 'Infinity',
        });

      const post1 = await Post.findByPk(1);
      expect(post1.get('sort')).toBe(0);

      const post2 = await Post.findByPk(2);
      expect(post2.get('sort')).toBe(10);

      const post10 = await Post.findByPk(10);
      expect(post10.get('sort')).toBe(9);
    });

    it('move id=2 by offset=-Infinity', async () => {
      const Post = db.getModel('posts');
      await agent
        .post('/posts:sort/2')
        .send({
          offset: '-Infinity',
        });

      const post1 = await Post.findByPk(1);
      expect(post1.get('sort')).toBe(0);

      const post2 = await Post.findByPk(2);
      expect(post2.get('sort')).toBe(-1);
    });
  });

  describe('sort in filtered scope', () => {
    it('move id=1 by offset=3 in scope filter[status]=publish', async () => {
      try {
        await agent
          .post('/posts:sort/1?filter[status]=publish')
          .send({
            offset: 3,
          });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    // 在 scope 中的排序无所谓值是否与其他不在 scope 中的重复。
    it('move id=2 by offset=3 in scope filter[status]=publish', async () => {
      const Post = db.getModel('posts');
      await agent
        .post('/posts:sort/2?filter[status]=publish')
        .send({
          offset: 3,
        });
      
      const post2 = await Post.findByPk(2);
      expect(post2.get('sort')).toBe(7);
    });

    it('move id=2 by offset=Infinity in scope filter[status]=publish', async () => {
      await agent
        .post('/posts:sort/2?filter[status]=publish')
        .send({
          offset: 'Infinity',
        });
      
      const Post = db.getModel('posts');
      const post2 = await Post.findByPk(2);
      expect(post2.get('sort')).toBe(10);
    });
  });

  describe('associations', () => {
    describe('hasMany', () => {
      it('sort only 1 item in group will never change', async () => {
        await agent
          .post('/posts/2/comments:sort/1')
          .send({
            offset: 1
          });
        
        const Comment = db.getModel('comments');
        const comment1 = await Comment.findByPk(1);
        expect(comment1.get('sort')).toBe(0);
      });

      it('/posts/5/comments:sort/7', async () => {
        await agent
          .post('/posts/5/comments:sort/7')
          .send({
            offset: 1
          });
        
        const Comment = db.getModel('comments');
        const comment7 = await Comment.findByPk(7);
        expect(comment7.get('sort')).toBe(1);
      });
    });
  });
});
