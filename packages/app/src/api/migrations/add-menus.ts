import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;

  await api.database.sync();
  await api.database.getModel('collections').load({skipExisting: true});

  const [Collection, Field, Page, Menu, View] = database.getModels(['collections', 'fields', 'pages_v2', 'menus', 'views_v2']);

  await Collection.import(require('./collections/authors').default);
  await Collection.import(require('./collections/books').default);

  await Menu.truncate();
  // await View.truncate();
  // await Page.truncate();

  const tables = database.getTables([
    'collections', 
    'fields', 
    'menus', 
    'pages_v2', 
    'views_v2',
    'automations',
    'automations_jobs',
    'action_logs',
    'users',
    'roles',
  ]);

  for (let table of tables) {
    console.log(table.getName());
    await Collection.import(table.getOptions(), { update: true, migrate: false });
  }

  const menus = [
    {
      title: '仪表盘',
      icon: 'DashboardOutlined',
      type: 'group',
      children: [
        {
          title: '欢迎光临',
          icon: 'DatabaseOutlined',
          type: 'page',
          pageName: 'welcome'
        },
      ],
    },
    {
      title: '数据',
      icon: 'DatabaseOutlined',
      type: 'group',
      children: [
        {
          title: '作者',
          icon: 'DatabaseOutlined',
          type: 'page',
          pageName: 'authors.all',
        },
      ],
    },
    {
      title: '用户',
      icon: 'TeamOutlined',
      type: 'group',
      children: [
        {
          title: '用户管理',
          icon: 'DatabaseOutlined',
          type: 'page',
          pageName: 'users.all',
        },
      ],
    },
    {
      title: '动态',
      icon: 'NotificationOutlined',
      type: 'group',
      children: [
        {
          title: '操作日志',
          icon: 'DatabaseOutlined',
          type: 'page',
          pageName: 'action_logs.all',
        },
      ],
    },
    {
      title: '配置',
      icon: 'SettingOutlined',
      type: 'group',
      children: [
        {
          title: '数据表配置',
          icon: 'DatabaseOutlined',
          type: 'page',
          pageName: 'collections.all',
        },
        {
          title: '菜单配置',
          icon: 'MenuOutlined',
          type: 'page',
          pageName: 'menus.all',
        },
        {
          title: '页面配置',
          icon: 'MenuOutlined',
          type: 'page',
          pageName: 'pages_v2.pages',
        },
        {
          title: '权限配置',
          icon: 'MenuOutlined',
          type: 'page',
          pageName: 'roles.all',
        },
        {
          title: '自动化配置',
          icon: 'MenuOutlined',
          type: 'page',
          pageName: 'automations.all',
        },
      ],
    },
  ];

  for (const item of menus) {
    const menu = await Menu.create(item);
    await menu.updateAssociations(item);
  }

})();
