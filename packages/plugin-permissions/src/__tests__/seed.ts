import { ROLE_TYPE_ANONYMOUS, ROLE_TYPE_ROOT, ROLE_TYPE_USER } from '../constants';

export default async function(db) {
  const User = db.getModel('users');
  const users = await User.bulkCreate([
    { username: 'user1', token: 'token1' },
    { username: 'user2', token: 'token2' },
    { username: 'user3', token: 'token3' },
    { username: 'user4', token: 'token4' },
  ]);

  const Role = db.getModel('roles');
  const roles = await Role.bulkCreate([
    { title: '匿名用户', type: ROLE_TYPE_ANONYMOUS },
    { title: '普通用户' },
    { title: '编辑' },
    { title: '管理员', type: ROLE_TYPE_ROOT },
  ]);

  const Scope = db.getModel('scopes');
  const scopePublished = await Scope.create({ collection_name: 'posts', filter: { status: 'published' } }, { logging: true });
  // TODO(bug): 字段应使用 'created_by' 名称，通过程序映射成外键
  const scopeCreatedBy = await Scope.create({ collection_name: 'posts', filter: { status: 'draft', 'created_by_id.$currentUser': true } });
  
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
        actions: [
          {
            name: 'posts:list',
            scope: scopePublished,
          }
        ],
        fields_permissions: [
          {
            field_id: postTitleField[Field.primaryKeyAttribute],
            actions: ['posts:list']
          }
        ]
      },
      {
        collection_name: 'categories',
        actions: [
          { name: 'posts:list' }
        ]
      }
    ]
  }, { migrate: false });

  // 普通用户
  await roles[1].updateAssociations({
    users: [users[0], users[3]],
    permissions: [
      {
        collection_name: 'posts',
        actions: [
          {
            name: 'posts:list',
            scope: scopeCreatedBy,
          },
          {
            name: 'posts:update',
            scope: scopeCreatedBy,
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
  }, { migrate: false });

  // 编辑
  await roles[2].updateAssociations({
    users: [users[1], users[3]],
    permissions: [
      {
        collection_name: 'posts',
        actions: [
          {
            name: 'posts:update'
          }
        ],
        fields_permissions: [
          {
            field_id: postTitleField[Field.primaryKeyAttribute],
            actions: ['posts:update']
          },
          {
            field_id: postStatusField[Field.primaryKeyAttribute],
            actions: ['posts:update']
          },
          {
            field_id: postCategoryField[Field.primaryKeyAttribute],
            actions: ['posts:update']
          },
        ]
      },
      {
        collection_name: 'categories',
        actions: [
          { name: 'posts:create' },
          { name: 'posts:update' },
          { name: 'posts:destroy' },
        ]
      }
    ]
  }, { migrate: false });

  // 管理员

  const Post = db.getModel('posts');
  await Post.bulkCreate([
    { title: 'title1', created_by_id: users[0].id, status: 'draft' },
    { title: 'title2', created_by_id: users[0].id, status: 'draft' },
    { title: 'title3', created_by_id: users[1].id, status: 'draft' },
    { title: 'title4', created_by_id: users[3].id, status: 'draft' },
  ]);
}
