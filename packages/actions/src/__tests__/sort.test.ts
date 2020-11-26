import { initDatabase, agent } from './index';

describe('get', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
    const User = db.getModel('users');
    const users = await User.bulkCreate('abcdefg'.split('').map(name => ({ name })));

    const Post = db.getModel('posts');
    const posts = await Post.bulkCreate(Array(22).fill(null).map((_, i) => ({
      title: `title_${i}`,
      status: i % 2 ? 'publish' : 'draft',
      sort: i,
      user_id: users[i % users.length].id
    })));

    await posts.reduce((promise, post) => promise.then(() => post.updateAssociations({
      comments: Array(post.sort % 5).fill(null).map((_, index) => ({
        content: `content_${index}`,
        status: index % 2 ? 'published' : 'draft',
        user_id: users[index % users.length].id,
        sort: index
      }))
    })), Promise.resolve());
    // [
    //   { id: 1, post_id: 2, sort: 0 },
    //   { id: 2, post_id: 3, sort: 0 },
    //   { id: 3, post_id: 3, sort: 1 },
    //   { id: 4, post_id: 4, sort: 0 },
    //   { id: 5, post_id: 4, sort: 1 },
    //   { id: 6, post_id: 4, sort: 2 },
    //   { id: 7, post_id: 5, sort: 0 },
    //   { id: 8, post_id: 5, sort: 1 },
    //   { id: 9, post_id: 5, sort: 2 },
    //   { id: 10, post_id: 5, sort: 3 },
    //   { id: 11, post_id: 7, sort: 0 },
    //   { id: 12, post_id: 8, sort: 0 },
    //   { id: 13, post_id: 8, sort: 1 },
    //   { id: 14, post_id: 9, sort: 0 },
    //   { id: 15, post_id: 9, sort: 1 },
    //   { id: 16, post_id: 9, sort: 2 },
    //   { id: 17, post_id: 10, sort: 0 },
    //   { id: 18, post_id: 10, sort: 1 },
    //   { id: 19, post_id: 10, sort: 2 },
    //   { id: 20, post_id: 10, sort: 3 },
    //   { id: 21, post_id: 15, sort: 0 },
    //   { id: 22, post_id: 15, sort: 1 },
    //   { id: 23, post_id: 15, sort: 2 },
    //   { id: 24, post_id: 15, sort: 3 },
    //   { id: 25, post_id: 12, sort: 0 },
    //   { id: 26, post_id: 13, sort: 0 },
    //   { id: 27, post_id: 13, sort: 1 },
    //   { id: 28, post_id: 14, sort: 0 },
    //   { id: 29, post_id: 14, sort: 1 },
    //   { id: 30, post_id: 14, sort: 2 },
    //   { id: 31, post_id: 17, sort: 0 },
    //   { id: 32, post_id: 18, sort: 0 },
    //   { id: 33, post_id: 18, sort: 1 },
    //   { id: 34, post_id: 19, sort: 0 },
    //   { id: 35, post_id: 19, sort: 1 },
    //   { id: 36, post_id: 19, sort: 2 },
    //   { id: 37, post_id: 20, sort: 0 },
    //   { id: 38, post_id: 20, sort: 1 },
    //   { id: 39, post_id: 20, sort: 2 },
    //   { id: 40, post_id: 20, sort: 3 },
    //   { id: 41, post_id: 22, sort: 0 }
    // ]
  });
  
  afterAll(() => db.close());

  describe('sort in whole table', () => {
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
      expect(post2.get('sort')).toBe(22);

      const post22 = await Post.findByPk(22);
      expect(post22.get('sort')).toBe(21);
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
      expect(post2.get('sort')).toBe(22);
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
