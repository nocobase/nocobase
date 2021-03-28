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

  describe('sort value initialization', () => {
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
    it('move id=1 to position at id=2', async () => {
      await agent
        .post('/posts:sort/1')
        .send({
          field: 'sort',
          target: { id: 2 },
        });

      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        attributes: ['id', 'sort'],
        order: [['id', 'ASC']]
      });
      expect(posts.map(item => item.get())).toEqual([
        { id: 1, sort: 2 },
        { id: 2, sort: 1 },
        { id: 3, sort: 3 },
        { id: 4, sort: 4 },
        { id: 5, sort: 5 },
        { id: 6, sort: 6 },
        { id: 7, sort: 7 },
        { id: 8, sort: 8 },
        { id: 9, sort: 9 },
        { id: 10, sort: 10 }
      ]);
    });

    it('move id=2 to position at id=1', async () => {
      await agent
        .post('/posts:sort/2')
        .send({
          field: 'sort',
          target: { id: 1 },
        });

      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        attributes: ['id', 'sort'],
        order: [['id', 'ASC']]
      });
      expect(posts.map(item => item.get())).toEqual([
        { id: 1, sort: 2 },
        { id: 2, sort: 1 },
        { id: 3, sort: 3 },
        { id: 4, sort: 4 },
        { id: 5, sort: 5 },
        { id: 6, sort: 6 },
        { id: 7, sort: 7 },
        { id: 8, sort: 8 },
        { id: 9, sort: 9 },
        { id: 10, sort: 10 }
      ]);
    });

    it('move id=1 to position at id=10', async () => {
      await agent
        .post('/posts:sort/1')
        .send({
          field: 'sort',
          target: { id: 10 },
        });

      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        attributes: ['id', 'sort'],
        order: [['id', 'ASC']]
      });
      expect(posts.map(item => item.get())).toEqual([
        { id: 1, sort: 10 },
        { id: 2, sort: 1 },
        { id: 3, sort: 2 },
        { id: 4, sort: 3 },
        { id: 5, sort: 4 },
        { id: 6, sort: 5 },
        { id: 7, sort: 6 },
        { id: 8, sort: 7 },
        { id: 9, sort: 8 },
        { id: 10, sort: 9 }
      ]);
    });
  });

  describe('sort in filtered scope', () => {
    it('move id=2 to position at id=8 (same scope value)', async () => {
      await agent
        .post('/posts:sort/2')
        .send({
          field: 'sort_in_status',
          target: { id: 8 },
        });

      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: {
          status: 'publish'
        },
        attributes: ['id', 'sort_in_status'],
        order: [['id', 'ASC']]
      });
      expect(posts.map(item => item.get())).toEqual([
        { id: 2, sort_in_status: 4 },
        { id: 4, sort_in_status: 1 },
        { id: 6, sort_in_status: 2 },
        { id: 8, sort_in_status: 3 },
        { id: 10, sort_in_status: 5 }
      ]);
    });

    it('move id=1 to position at id=8 (different scope value)', async () => {
      await agent
        .post('/posts:sort/1')
        .send({
          field: 'sort_in_status',
          target: { id: 8 },
        });

      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: {
          status: 'publish'
        },
        attributes: ['id', 'sort_in_status'],
        order: [['id', 'ASC']]
      });
      expect(posts.map(item => item.get())).toEqual([
        { id: 1, sort_in_status: 4 },
        { id: 2, sort_in_status: 1 },
        { id: 4, sort_in_status: 2 },
        { id: 6, sort_in_status: 3 },
        { id: 8, sort_in_status: 5 },
        { id: 10, sort_in_status: 6 }
      ]);
    });

    it('move id=1 to new empty list of scope', async () => {
      await agent
        .post('/posts:sort/1')
        .send({
          field: 'sort_in_status',
          target: { status: 'archived' },
        });

      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        attributes: ['id', 'sort_in_status'],
        order: [['id', 'ASC']]
      });
      expect(posts.map(item => item.get())).toEqual([
        { id: 1, sort_in_status: 1 },
        { id: 2, sort_in_status: 1 },
        { id: 3, sort_in_status: 2 },
        { id: 4, sort_in_status: 2 },
        { id: 5, sort_in_status: 3 },
        { id: 6, sort_in_status: 3 },
        { id: 7, sort_in_status: 4 },
        { id: 8, sort_in_status: 4 },
        { id: 9, sort_in_status: 5 },
        { id: 10, sort_in_status: 5 }
      ]);
    });

    it('move id=1 to scope without target primary key', async () => {
      await agent
        .post('/posts:sort/1')
        .send({
          field: 'sort_in_status',
          target: { status: 'publish' },
        });

      const Post = db.getModel('posts');
      const posts = await Post.findAll({
        where: {
          status: 'publish'
        },
        attributes: ['id', 'sort_in_status'],
        order: [['id', 'ASC']]
      });
      expect(posts.map(item => item.get())).toEqual([
        { id: 1, sort_in_status: 6 },
        { id: 2, sort_in_status: 1 },
        { id: 4, sort_in_status: 2 },
        { id: 6, sort_in_status: 3 },
        { id: 8, sort_in_status: 4 },
        { id: 10, sort_in_status: 5 }
      ]);
    });
  });

  describe('associations', () => {
    describe('hasMany', () => {
      it('move id=1 to position at id=3 (different scope value)', async () => {
        await agent
          .post('/users/1/posts:sort/1')
          .send({
            field: 'sort_in_user',
            target: { id: 3 },
          });

        const Post = db.getModel('posts');
        const posts = await Post.findAll({
          where: {
            user_id: 3
          },
          attributes: ['id', 'sort_in_user'],
          order: [['id', 'ASC']]
        });

        expect(posts.map(item => item.get())).toEqual([
          { id: 1, sort_in_user: 1 },
          { id: 3, sort_in_user: 2 },
          { id: 10, sort_in_user: 3 },
        ]);
      });
    });
  });
});
