import { getApp, getAgent } from '.';

describe('user fields', () => {
  let app;
  let agent;
  let db;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
    db = app.database;
    await db.sync({ force: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('add field', () => {
    it('add model without createdBy/updatedBy field', async () => {
      const Collection = db.getModel('collections');
      await Collection.create({ name: 'posts' });
      const Post = db.getModel('posts');

      const post = await Post.create();
      expect(post.created_by_id).toBeUndefined();
      expect(post.updated_by_id).toBeUndefined();
    });

    it('add model with named createdBy/updatedBy field', async () => {
      const Collection = db.getModel('collections');
      await Collection.create({ name: 'posts', createdBy: 'author', updatedBy: 'editor' });
      const Post = db.getModel('posts');

      const post = await Post.create();
      expect(post.author_id).toBeDefined();
      expect(post.editor_id).toBeDefined();
    });

    it('add model with named createdBy/updatedBy field and target', async () => {
      const Collection = db.getModel('collections');
      await Collection.create({
        name: 'posts',
        createdBy: { name: 'author', target: 'users' },
        updatedBy: { name: 'editor', target: 'users' }
      });
      const Post = db.getModel('posts');

      const post = await Post.create();
      expect(post.author_id).toBeDefined();
      expect(post.editor_id).toBeDefined();
    });

    it('add model with createdBy/updatedBy field', async () => {
      const Collection = db.getModel('collections');
      await Collection.create({ name: 'posts', createdBy: true, updatedBy: true });
      const Post = db.getModel('posts');

      const post = await Post.create();
      expect(post.created_by_id).toBeDefined();
      expect(post.updated_by_id).toBeDefined();
    });
  });

  describe('create', () => {
    it('create data with createdBy/updatedBy field', async () => {
      const Collection = db.getModel('collections');
      await Collection.create({ name: 'posts', createdBy: true, updatedBy: true });
      const User = db.getModel('users');
      const currentUser = await User.create();
      const Post = db.getModel('posts');

      const postWithoutUser = await Post.create();
      expect(postWithoutUser.created_by_id).toBe(null);
      expect(postWithoutUser.updated_by_id).toBe(null);

      const postWithUser = await Post.create({}, { context: { state: { currentUser } } });
      expect(postWithUser.created_by_id).toBe(currentUser.id);
      expect(postWithUser.updated_by_id).toBe(currentUser.id);
    });

    it('create data with value of createdBy/updatedBy field', async () => {
      const Collection = db.getModel('collections');
      await Collection.create({ name: 'posts', createdBy: true, updatedBy: true });
      const User = db.getModel('users');
      const user1 = await User.create();
      const user2 = await User.create();
      const Post = db.getModel('posts');

      const post = await Post.create({
        created_by_id: user1.id,
        updated_by_id: user1.id,
      }, { context: { state: { currentUser: user2 } } });
      expect(post.created_by_id).toBe(user1.id);
      expect(post.updated_by_id).toBe(user1.id);
    });
  });

  describe('update', () => {
    it('update data with updatedBy field', async () => {
      const Collection = db.getModel('collections');
      await Collection.create({
        name: 'posts',
        updatedBy: true,
        fields: [
          {
            type: 'string',
            name: 'title'
          }
        ]
      });
      const User = db.getModel('users');
      const currentUser = await User.create();
      const Post = db.getModel('posts');

      const post = await Post.create();
      expect(post.updated_by_id).toBe(null);

      await post.update({ title: 'title' }, { context: { state: { currentUser } } })
      expect(post.updated_by_id).toBe(currentUser.id);
    });
  });
});
