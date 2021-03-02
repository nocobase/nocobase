import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await api.database.sync();

  const [Collection, Field, Page, Menu, View] = database.getModels(['collections', 'fields', 'pages_v2', 'menus', 'views_v2']);
  await Menu.truncate();
  await View.truncate();
  // await Page.truncate();

  const tables = database.getTables(['collections', 'fields', 'menus', 'pages_v2', 'views_v2']);

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
          title: '用户管理',
          icon: 'DatabaseOutlined',
          type: 'page',
        },
        {
          title: '示例12',
          icon: 'DatabaseOutlined',
          type: 'page',
        },
        {
          title: '示例13',
          icon: 'DatabaseOutlined',
          type: 'page',
        },
      ],
    },
    {
      title: '数据',
      icon: 'DatabaseOutlined',
      type: 'group',
      children: [
        {
          title: '示例21',
          icon: 'DatabaseOutlined',
          type: 'page',
        },
        {
          title: '示例22',
          icon: 'DatabaseOutlined',
          type: 'page',
        },
        {
          title: '示例23',
          icon: 'DatabaseOutlined',
          type: 'page',
        },
      ],
    },
    {
      title: '用户',
      icon: 'TeamOutlined',
      type: 'group',
      children: [
        {
          title: '自定义连接',
          icon: 'DatabaseOutlined',
          type: 'link',
          url: 'https://www.baidu.com',
        }
      ],
    },
    {
      title: '动态',
      icon: 'NotificationOutlined',
      type: 'group',
      children: [
        {
          title: '自定义连接',
          icon: 'DatabaseOutlined',
          type: 'link',
          url: 'https://www.baidu.com',
        }
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
      ],
    },
  ];

  for (const item of menus) {
    const menu = await Menu.create(item);
    await menu.updateAssociations(item);
  }

})();
