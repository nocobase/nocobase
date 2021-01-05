import { getApp, getAgent, getAPI } from '.';

describe('list', () => {
  let app;
  let agent;
  let api;
  let db;

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

    const Role = db.getModel('roles');
    const roles = await Role.bulkCreate([
      { title: '匿名用户', anonymous: true },
      { title: '普通用户' },
      { title: '编辑' },
      { title: '管理员' },
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
              scope: { status: 'published' },
              fields: [
                postTitleField
              ]
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
      permissions: [
        {
          collection_name: 'posts',
          actions_permissions: [
            {
              name: 'create',
              fields_permissions: [
                postTitleField
              ]
            },
            {
              name: 'update',
              scope: { status: 'draft', /* created_by: '$currentUser' */ },
              fields_permissions: [
                postTitleField
              ]
            }
          ]
        }
      ]
    });

    // 编辑
    await roles[2].updateAssociations({
      permissions: [
        {
          collection_name: 'posts',
          actions_permissions: [
            {
              name: 'update',
              fields_permissions: [
                postTitleField,
                postStatusField,
                postCategoryField,
              ]
            }
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

    // 普通用户
    await users[0].updateAssociations({
      roles: [roles[1]]
    });
    // 编辑
    await users[1].updateAssociations({
      roles: [roles[2]]
    });
    // 管理员
    await users[2].updateAssociations({
      roles: [roles[3]]
    });
    // 普通用户+编辑
    await users[3].updateAssociations({
      roles: [roles[1], roles[2]]
    });

    const Post = db.getModel('posts');
    await Post.bulkCreate([
      { title: 'title1', user_id: users[0].id },
      { title: 'title2', user_id: users[0].id },
      { title: 'title3', user_id: users[1].id },
      { title: 'title4', user_id: users[3].id },
    ]);
  });

  afterEach(() => db.close());

  describe('anonymous', () => {
    it('', async () => {
      const response = await agent.get('/api/posts');
      expect(response.status).toBe(200);
      console.log(response.body);
      // expect(response.body.count).toBe(0);
    });
  });

  describe.skip('normal user', () => {
    let userAgent;

    beforeAll(async () => {
      const User = db.getModel('users');
      let user = await User.findOne({ username: 'user1' });

      userAgent = getAgent(app);
      userAgent.set('Authorization', `Bearer ${user.token}`);
    });

    it('', async () => {
      const response = await userAgent.get('posts');
      console.log(response);
    });
  });
});
