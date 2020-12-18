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

  describe('model definition', () => {
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

    it('add model with boolean createdBy/updatedBy field', async () => {
      const Collection = db.getModel('collections');
      await Collection.create({ name: 'posts', createdBy: true, updatedBy: true });
      const Post = db.getModel('posts');

      const post = await Post.create();
      expect(post.created_by_id).toBeDefined();
      expect(post.updated_by_id).toBeDefined();
    });

    // TODO(bug): 重复添加字段不能与 fields 表同步，应做到同步
    it('add model and then add createdBy/updatedBy field', async () => {
      const Collection = db.getModel('collections');
      const collection = await Collection.import({
        name: 'posts',
        createdBy: true,
        updatedBy: true,
        fields: [
          {
            interface: 'createdBy',
            title: '创建人1',
            type: 'createdBy',
            name: 'createdBy1',
            target: 'users',
            foreignKey: 'created_by_id',
          },
          {
            interface: 'updatedBy',
            title: '更新人1',
            type: 'updatedBy',
            name: 'updatedBy1',
            target: 'users',
            foreignKey: 'updated_by_id',
          },
          {
            interface: 'createdBy',
            title: '创建人2',
            type: 'createdBy',
            name: 'createdBy2',
            target: 'users',
            foreignKey: 'created_by_id',
          },
          {
            interface: 'updatedBy',
            title: '更新人2',
            type: 'updatedBy',
            name: 'updatedBy2',
            target: 'users',
            foreignKey: 'updated_by_id',
          },
        ]
      });
      const table = db.getTable('posts');
      // console.log(table.getFields());

      const User = db.getModel('users');
      const Post = db.getModel('posts');

      // 用户1 操作
      const user1 = await User.create();
      const postWithUser = await Post.create({}, { context: { state: { currentUser: user1 } } });

      const post = await Post.findOne(Post.parseApiJson({
        filter: {
          id: postWithUser.id,
        },
        fields: ['createdBy1', 'updatedBy1', 'createdBy2', 'updatedBy2'],
      }));

      expect(post.createdBy1.id).toBe(user1.id);
      expect(post.updatedBy1.id).toBe(user1.id);
      expect(post.createdBy2.id).toBe(user1.id);
      expect(post.updatedBy2.id).toBe(user1.id);

      // 换个用户
      const user2 = await User.create();
      await postWithUser.update({title: 'title1'}, { context: { state: { currentUser: user2 } } });

      const post2 = await Post.findOne(Post.parseApiJson({
        filter: {
          id: postWithUser.id,
        },
        fields: ['createdBy1', 'updatedBy1', 'createdBy2', 'updatedBy2'],
      }));

      expect(post2.createdBy1.id).toBe(user1.id);
      expect(post2.createdBy2.id).toBe(user1.id);
      expect(post2.updatedBy1.id).toBe(user2.id);
      expect(post2.updatedBy2.id).toBe(user2.id);


      // const Collection = db.getModel('collections');
      // const collection = await Collection.create({
      //   name: 'posts'
      // });
      // const createdByField = await collection.createField({ type: 'createdBy', name: 'author', target: 'users' });
      // const updatedByField = await collection.createField({ type: 'updatedBy', name: 'editor', target: 'users' });

      // const postTable = db.getTable('posts');
      // const Post = db.getModel('posts');

      // // create data should contain added fields
      // const post = await Post.create();
      // expect(post[postTable.getField(createdByField.get('name')).options.foreignKey]).toBeDefined();
      // expect(post[postTable.getField(updatedByField.get('name')).options.foreignKey]).toBeDefined();

      // // add same type field twice should get same field
      // const createdByField2 = await collection.createField({ type: 'createdBy', target: 'users' });
      // expect(createdByField2.get('name')).toBe(createdByField.get('name'));

      // // add same type field twice with a new name should get same field name as before
      // const updatedByField2 = await collection.createField({ type: 'updatedBy', name: 'proofreader', target: 'users' });
      // expect(updatedByField2.get('name')).toBe(updatedByField.get('name'));

      // // delete field data should not really remove the column in table
      // await createdByField2.destroy();
      // expect(postTable.getField('author')).toBeDefined();
    });
  });

  describe('createdBy field', () => {
    it('create data with createdBy/updatedBy field', async () => {
      const Collection = db.getModel('collections');
      await Collection.create({ name: 'posts', createdBy: true, updatedBy: true });
      const User = db.getModel('users');
      const currentUser = await User.create();
      const user2 = await User.create();
      const Post = db.getModel('posts');

      const postWithoutUser = await Post.create();
      expect(postWithoutUser.created_by_id).toBe(null);
      expect(postWithoutUser.updated_by_id).toBe(null);

      const postWithUser = await Post.create({}, { context: { state: { currentUser } } });
      expect(postWithUser.created_by_id).toBe(currentUser.id);
      expect(postWithUser.updated_by_id).toBe(currentUser.id);

      // 更新数据 createdBy 数据不变
      await postWithUser.update({title: 'title1'}, { context: { state: { currentUser: user2 } } });
      expect(postWithUser.created_by_id).toBe(currentUser.id);
      expect(postWithUser.updated_by_id).toBe(user2.id);
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

  describe('updatedBy field', () => {
    it('update data ', async () => {
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

    it('update data by different user', async () => {
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
      const user1 = await User.create();
      const user2 = await User.create();
      const Post = db.getModel('posts');
      let context = { state: { currentUser: user2 } };

      const post = await Post.create({
        updated_by_id: user1.id,
      }, { context });
      expect(post.updated_by_id).toBe(user1.id);

      await post.update({ title: 'title' }, { context });
      expect(post.updated_by_id).toBe(user2.id);

      await post.update({ title: 'title', updated_by_id: user1.id }, { context });
      expect(post.updated_by_id).toBe(user1.id);

      // 不同用户更新数据
      context = { state: { currentUser: user1 } };
      await post.update({ title: 'title234' }, { context });
      expect(post.updated_by_id).toBe(user1.id);
    
      // 重新查询
      const post2 = await Post.findByPk(post.id);
      expect(post2.updated_by_id).toBe(user1.id);
    });
  });
});
