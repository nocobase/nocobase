// @ts-nocheck
import Database from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';

describe('user fields', () => {
  let api: MockServer;
  let db: Database;

  beforeEach(async () => {
    api = mockServer();
    api.registerPlugin('users', require('../server').default);
    await api.loadPlugins();
    db = api.db;
  });

  afterEach(async () => {
    await db.close();
  });

  describe('model definition', () => {
    it('createdBy=false/updatedBy=false', async () => {
      db.table({
        name: 'posts',
        createdBy: false,
        updatedBy: false,
      });
      await db.sync();
      const Post = db.getModel('posts');
      const post = await Post.create();
      expect(post.created_by_id).toBeUndefined();
      expect(post.updated_by_id).toBeUndefined();
    });

    it('without createdBy/updatedBy', async () => {
      db.table({
        name: 'posts',
      });
      await db.sync();
      const Post = db.getModel('posts');
      const post = await Post.create();
      expect(post.created_by_id).toBeDefined();
      expect(post.updated_by_id).toBeDefined();
    });

    it('updatedBy=author/updatedBy=editor', async () => {
      db.table({
        name: 'posts',
        createdBy: 'author',
        updatedBy: 'editor',
      });
      await db.sync();
      const Post = db.getModel('posts');
      const post = await Post.create();
      expect(post.author_id).toBeDefined();
      expect(post.editor_id).toBeDefined();
    });

    it('createdBy=true/updatedBy=true', async () => {
      db.table({
        name: 'posts',
        createdBy: true,
        updatedBy: true,
      });
      await db.sync();
      const Post = db.getModel('posts');
      const post = await Post.create();
      expect(post.created_by_id).toBeDefined();
      expect(post.updated_by_id).toBeDefined();
    });

    it('add model and then add createdBy/updatedBy field', async () => {
      db.table({
        name: 'posts',
        fields: [
          {
            type: 'createdBy',
            name: 'createdBy1',
            target: 'users',
            foreignKey: 'created_by_id',
          },
          {
            type: 'updatedBy',
            name: 'updatedBy1',
            target: 'users',
            foreignKey: 'updated_by_id',
          },
          {
            type: 'createdBy',
            name: 'createdBy2',
            target: 'users',
            foreignKey: 'created_by_id',
          },
          {
            type: 'updatedBy',
            name: 'updatedBy2',
            target: 'users',
            foreignKey: 'updated_by_id',
          },
        ],
      });

      await db.sync();

      const User = db.getModel('users');
      const Post = db.getModel('posts');

      // 用户1 操作
      const user1 = await User.create();
      const postWithUser = await Post.create(
        {},
        { context: { state: { currentUser: user1 } } },
      );

      const post = await Post.findOne(
        Post.parseApiJson({
          filter: {
            id: postWithUser.id,
          },
          fields: ['createdBy1', 'updatedBy1', 'createdBy2', 'updatedBy2'],
        }),
      );

      expect(post.createdBy1.id).toBe(user1.id);
      expect(post.updatedBy1.id).toBe(user1.id);
      expect(post.createdBy2.id).toBe(user1.id);
      expect(post.updatedBy2.id).toBe(user1.id);

      // 换个用户
      const user2 = await User.create();
      await postWithUser.update(
        { title: 'title1' },
        { context: { state: { currentUser: user2 } } },
      );

      const post2 = await Post.findOne(
        Post.parseApiJson({
          filter: {
            id: postWithUser.id,
          },
          fields: ['createdBy1', 'updatedBy1', 'createdBy2', 'updatedBy2'],
        }),
      );

      expect(post2.createdBy1.id).toBe(user1.id);
      expect(post2.createdBy2.id).toBe(user1.id);
      expect(post2.updatedBy1.id).toBe(user2.id);
      expect(post2.updatedBy2.id).toBe(user2.id);
    });
  });

  describe('createdBy field', () => {
    it('create data with createdBy/updatedBy field', async () => {
      db.table({ name: 'posts', createdBy: true, updatedBy: true });
      await db.sync();
      const User = db.getModel('users');
      const currentUser = await User.create();
      const user2 = await User.create();
      const Post = db.getModel('posts');

      const postWithoutUser = await Post.create();
      expect(postWithoutUser.created_by_id).toBe(null);
      expect(postWithoutUser.updated_by_id).toBe(null);
      // @ts-ignore
      const postWithUser = await Post.create(
        {},
        { context: { state: { currentUser } } },
      );
      expect(postWithUser.created_by_id).toBe(currentUser.id);
      expect(postWithUser.updated_by_id).toBe(currentUser.id);

      // 更新数据 createdBy 数据不变
      // @ts-ignore
      await postWithUser.update(
        { title: 'title1' },
        { context: { state: { currentUser: user2 } } },
      );
      expect(postWithUser.created_by_id).toBe(currentUser.id);
      expect(postWithUser.updated_by_id).toBe(user2.id);
    });

    it('create data with value of createdBy/updatedBy field', async () => {
      db.table({ name: 'posts', createdBy: true, updatedBy: true });
      await db.sync();
      const User = db.getModel('users');
      const user1 = await User.create();
      const user2 = await User.create();
      const Post = db.getModel('posts');

      const post = await Post.create(
        {
          created_by_id: user1.id,
          updated_by_id: user1.id,
          // @ts-ignore
        },
        { context: { state: { currentUser: user2 } } },
      );
      expect(post.created_by_id).toBe(user1.id);
      expect(post.updated_by_id).toBe(user1.id);
    });
  });

  describe('updatedBy field', () => {
    it('update data ', async () => {
      db.table({
        name: 'posts',
        createdBy: false,
        updatedBy: true,
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      });
      await db.sync();
      const User = db.getModel('users');
      const currentUser = await User.create();
      const Post = db.getModel('posts');

      const post = await Post.create();
      expect(post.updated_by_id).toBe(null);
      // @ts-ignore
      await post.update(
        { title: 'title' },
        { context: { state: { currentUser } } },
      );
      expect(post.updated_by_id).toBe(currentUser.id);
    });

    it('update data by different user', async () => {
      db.table({
        name: 'posts',
        updatedBy: true,
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      });
      await db.sync();
      const User = db.getModel('users');
      const user1 = await User.create();
      const user2 = await User.create();
      const Post = db.getModel('posts');
      let context = { state: { currentUser: user2 } };

      const post = await Post.create(
        {
          updated_by_id: user1.id,
        },
        { context },
      );
      expect(post.updated_by_id).toBe(user1.id);

      await post.update({ title: 'title' }, { context });
      expect(post.updated_by_id).toBe(user2.id);

      await post.update(
        { title: 'title', updated_by_id: user1.id },
        { context },
      );
      expect(post.updated_by_id).toBe(user1.id);

      // 不同用户更新数据
      context = { state: { currentUser: user1 } };
      await post.update({ title: 'title234' }, { context });
      expect(post.updated_by_id).toBe(user1.id);

      // 重新查询
      const post2 = await Post.findByPk(post.id);
      expect(post2.updated_by_id).toBe(user1.id);
    });

    it('bulkUpdate', async () => {
      db.table({
        name: 'posts',
        createdBy: false,
        updatedBy: true,
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      });
      await db.sync();
      const User = db.getModel('users');
      const user1 = await User.create();
      const user2 = await User.create();
      const Post = db.getModel('posts');
      let context = { state: { currentUser: user2 } };

      await Post.bulkCreate([{ title: 'title1' }, { title: 'title2' }]);

      await Post.update(
        { title: 'title3' },
        {
          where: { title: 'title1' },
          context,
        },
      );

      const posts = await Post.findAll({ order: [['id', 'ASC']] });
      expect(
        posts.map(({ title, updated_by_id }) => ({ title, updated_by_id })),
      ).toEqual([
        { title: 'title3', updated_by_id: 2 },
        { title: 'title2', updated_by_id: null },
      ]);
    });
  });
});
