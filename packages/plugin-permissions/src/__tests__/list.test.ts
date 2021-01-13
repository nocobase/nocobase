import { getApp, getAgent, getAPI } from '.';

describe.skip('list', () => {
  let app;
  let agent;
  let api;
  let db;
  let userAgents;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
    db = app.database;

    const User = db.getModel('users');
    const users = await User.bulkCreate([
      { username: 'user1', token: 'token1' },
      { username: 'user2', token: 'token2' },
      { username: 'user3', token: 'token3' },
      { username: 'user4', token: 'token4' },
    ]);

    userAgents = users.map(user => {
      const userAgent = getAgent(app);
      userAgent.set('Authorization', `Bearer ${users[0].token}`);
      return userAgent;
    });

    const Role = db.getModel('roles');
    const roles = await Role.bulkCreate([
      { title: '匿名用户', type: 0 },
      { title: '普通用户' },
      { title: '编辑' },
      { title: '管理员', type: -1 },
    ]);
    
    const Field = db.getModel('fields');
    const postTitleField = await Field.findOne({
      where: {
        name: 'title',
        collection_name: 'posts'
      }
    });
    const postStatusField = await Field.findOne({
      where: {
        name: 'status',
        collection_name: 'posts'
      }
    });
    const postCategoryField = await Field.findOne({
      where: {
        name: 'category',
        collection_name: 'posts'
      }
    });

    // 匿名用户
    await roles[0].updateAssociations({
      permissions: [
        {
          collection_name: 'posts',
          actions_permissions: [
            {
              name: 'list',
              scope: { filter: { status: 'published' }, collection_name: 'posts' },
            }
          ],
          fields: [
            {
              id: postTitleField.id,
              fields_permissions: { actions: ['posts:list'] }
            }
          ]
        },
        {
          collection_name: 'categories',
          actions_permissions: [
            { name: 'list' }
          ]
        }
      ]
    });

    // 普通用户
    await roles[1].updateAssociations({
      users: [users[0], users[3]],
      permissions: [
        {
          collection_name: 'posts',
          actions_permissions: [
            {
              name: 'list',
              // TODO(bug): 字段应使用 'created_by' 名称，通过程序映射成外键
              scope: { filter: { status: 'draft', 'created_by_id.$currentUser': true }, collection_name: 'posts' },
            },
            {
              name: 'update',
              scope: { filter: { status: 'draft', 'created_by_id.$currentUser': true }, collection_name: 'posts' },
            }
          ],
          fields: [
            {
              id: postTitleField.id,
              fields_permissions: { actions: ['posts:list', 'posts:create', 'posts:update'] }
            },
            {
              id: postStatusField.id,
              fields_permissions: { actions: ['posts:list'] }
            },
            {
              id: postCategoryField.id,
              fields_permissions: { actions: ['posts:list'] }
            },
          ]
        }
      ]
    });

    // 编辑
    await roles[2].updateAssociations({
      users: [users[1], users[3]],
      permissions: [
        {
          collection_name: 'posts',
          actions_permissions: [
            {
              name: 'update'
            }
          ],
          fields: [
            {
              id: postTitleField.id,
              fields_permissions: { actions: ['posts:update'] }
            },
            {
              id: postStatusField.id,
              fields_permissions: { actions: ['posts:update'] }
            },
            {
              id: postCategoryField.id,
              fields_permissions: { actions: ['posts:update'] }
            },
          ]
        },
        {
          collection_name: 'categories',
          actions_permissions: [
            { name: 'create' },
            { name: 'update' },
            { name: 'destroy' },
          ]
        }
      ]
    });

    // 管理员

    const Post = db.getModel('posts');
    await Post.bulkCreate([
      { title: 'title1', created_by_id: users[0].id },
      { title: 'title2', created_by_id: users[0].id },
      { title: 'title3', created_by_id: users[1].id },
      { title: 'title4', created_by_id: users[3].id },
    ]);
  });

  afterEach(() => db.close());

  describe('anonymous', () => {
    it('fetch all drafts only get empty list', async () => {
      const response = await agent.get('/api/posts');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });
  });

  // TODO(bug): 单独执行可以通过。
  // 由于 app.database.getModel('collections').import() 有 bug，无法正确的完成数据构造。
  describe('normal user', () => {
    it('user could get posts created by self and limited fields', async () => {
      const response = await userAgents[0].get('/api/posts?sort=title');
      expect(response.body.count).toBe(2);
      expect(response.body.rows).toEqual([
        { title: 'title1', status: 'draft', category: null },
        { title: 'title2', status: 'draft', category: null }
      ]);
    });
  });
});
