import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await api.database.sync();

  const [Collection, Page, Role] = database.getModels(['collections', 'pages', 'roles']);

  const tables = database.getTables();
  for (let table of tables) {
    console.log(table.getName());
    await Collection.import(table.getOptions(), { update: true, migrate: false });
  }

  const parent = await Page.findOne({
    where: {
      path: '/settings',
    }
  });

  const roles = await Role.bulkCreate([
    { title: '系统开发组' },
    { title: '数据管理组' },
    { title: '普通用户组' },
    { title: '未登录用户组' },
  ]);

  await Page.create({
    title: '权限组配置',
    type: 'collection',
    collection: 'roles',
    path: '/settings/roles',
    icon: 'TableOutlined',
    sort: 120,
    showInMenu: true,
    parent_id: parent.id,
  });

  const Scope = database.getModel('actions_scopes');

  const collections = await Collection.findAll();

  for (const collection of collections) {
    const count = await collection.countScopes();
    if (count === 0) {
      await Scope.bulkCreate([
        {
          title: '全部数据',
          filter: {},
          collection_name: collection.name,
        },
        {
          title: '用户自己的数据',
          filter: {
            "created_by_id.$currentUser": true,
          },
          collection_name: collection.name,
        },
      ]);
    }
  }

})();
