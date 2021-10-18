import { getDatabase } from '..';

describe('radio', () => {
  let db;

  beforeEach(async () => {
    db = getDatabase();

    db.table({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'posts',
        },
      ],
    });

    db.table({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'string',
          name: 'status',
          defaultValue: 'published',
        },
        {
          type: 'radio',
          name: 'pinned',
        },
        {
          type: 'radio',
          name: 'latest',
          defaultValue: true,
        },
        {
          type: 'radio',
          name: 'pinned_in_status',
          scope: ['status'],
        },
        {
          type: 'radio',
          name: 'pinned_in_user',
          scope: ['user'],
          defaultValue: true,
        },
      ],
    });

    await db.sync({ force: true });
  });

  afterEach(() => db.close());

  describe('create', () => {
    it('undefined value as defaultValue', async () => {
      const Post = db.getModel('posts');
      const created1 = await Post.create({ title: 'title1', pinned: true });
      expect(created1.pinned).toBe(true);
      expect(created1.latest).toBe(true);

      const created2 = await Post.create({ title: 'title2' });
      expect(created2.pinned).toBe(false);
      expect(created2.latest).toBe(true);

      const posts = await Post.findAll({ order: [['id', 'ASC']] });

      expect(posts.map(({ pinned, latest }) => ({ pinned, latest }))).toEqual([
        { pinned: true, latest: false },
        { pinned: false, latest: true },
      ]);
    });

    it('true value set', async () => {
      const Post = db.getModel('posts');
      const created1 = await Post.create({ title: 'title1', pinned: true });
      expect(created1.pinned).toBe(true);

      const created2 = await Post.create({ title: 'title2', pinned: true });
      expect(created2.pinned).toBe(true);

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
        { pinned: false, latest: true },
      ]);
    });

    it('create with scopes', async () => {
      const User = db.getModel('users');
      const users = await User.bulkCreate([{}, {}]);
      const Post = db.getModel('posts');
      const bulkCreated = await Post.bulkCreate([
        { title: 'title1', status: 'published', user_id: 1 },
        {
          title: 'title2',
          status: 'published',
          user_id: 2,
          pinned_in_status: true,
        },
        {
          title: 'title3',
          status: 'draft',
          user_id: 1,
          pinned_in_status: true,
        },
      ]);
      expect(
        bulkCreated.map(({ pinned_in_status, pinned_in_user }) => ({
          pinned_in_status,
          pinned_in_user,
        })),
      ).toEqual([
        { pinned_in_status: false, pinned_in_user: false },
        { pinned_in_status: true, pinned_in_user: true },
        { pinned_in_status: true, pinned_in_user: true },
      ]);

      const user1Post = await users[1].createPost({
        title: 'title4',
        status: 'draft',
        pinned_in_status: true,
      });
      expect(user1Post.pinned_in_status).toBe(true);
      expect(user1Post.pinned_in_user).toBe(true);

      const posts = await Post.findAll({ order: [['id', 'ASC']] });
      expect(
        posts.map(({ title, pinned_in_status, pinned_in_user }) => ({
          title,
          pinned_in_status,
          pinned_in_user,
        })),
      ).toMatchObject([
        { title: 'title1', pinned_in_status: false, pinned_in_user: false },
        { title: 'title2', pinned_in_status: true, pinned_in_user: false },
        { title: 'title3', pinned_in_status: false, pinned_in_user: true },
        { title: 'title4', pinned_in_status: true, pinned_in_user: true },
      ]);
    });
  });

  describe('update', () => {
    it('update one to false effect nothing else', async () => {
      const Post = db.getModel('posts');
      await Post.bulkCreate([
        { title: 'title1', pinned: true },
        { title: 'title2' },
      ]);

      const created = await Post.create({ pinned: false });
      expect(created.pinned).toBe(false);

      const posts = await Post.findAll({ order: [['id', 'ASC']] });

      expect(posts.map(({ pinned }) => pinned)).toEqual([true, false, false]);
    });

    it('update one to true makes others to false', async () => {
      const Post = db.getModel('posts');
      await Post.bulkCreate([
        { title: 'title1', pinned: true },
        { title: 'title2' },
      ]);

      const created = await Post.create({ pinned: true });
      expect(created.pinned).toBe(true);

      const posts = await Post.findAll({ order: [['id', 'ASC']] });

      expect(posts.map(({ pinned }) => pinned)).toEqual([false, false, true]);
    });

    it('update other fields should not effect radio field', async () => {
      const Post = db.getModel('posts');
      await Post.bulkCreate([
        { title: 'bug1' },
        { title: 'bug2' },
        { title: 'bug3' },
      ]);

      const post = await Post.findByPk(2);

      await post.update({
        pinned: true,
      });

      await post.update({
        status: 'draft',
      });

      const posts = await Post.findAll({ order: [['id', 'ASC']] });
      expect(posts.map(({ pinned }) => pinned)).toEqual([false, true, false]);
    });
  });
});
