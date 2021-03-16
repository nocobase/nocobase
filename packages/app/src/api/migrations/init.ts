// @ts-ignore
global.sync = {
  force: true,
  alter: {
    drop: true,
  },
};

import Database from '@nocobase/database';
import { init as chinaRegionSeederInit } from '@nocobase/plugin-china-region/src/db/seeders';
import api from '../app';

const data = [
  {
    title: '后台应用',
    path: '/',
    type: 'layout',
    template: 'TopMenuLayout',
    sort: 10,
    redirect: '/admin',
  },
  {
    title: '后台',
    path: '/admin',
    type: 'page',
    inherit: false,
    template: 'AdminLoader',
    order: 230,
  },
  {
    title: '登录页面',
    path: '/login',
    type: 'page',
    inherit: false,
    template: 'login',
    order: 120,
  },
  {
    title: '注册页面',
    path: '/register',
    type: 'page',
    inherit: false,
    template: 'register',
    order: 130,
  },
];

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await database.sync({
    // tables: ['collections', 'fields', 'actions', 'views', 'tabs'],
  });
  const [Collection, Page, User] = database.getModels(['collections', 'pages', 'users']);
  const tables = database.getTables([]);
  for (let table of tables) {
    // console.log(table.getName());
    if (table.getName() === 'roles') {
      // console.log('roles', table.getOptions())
    }
    await Collection.import(table.getOptions(), { update: true, migrate: false });
  }
  await Page.import(data);
  let user = await User.findOne({
    where: {
      username: "admin",
    },
  });
  if (!user) {
    user = await User.create({
      nickname: "超级管理员",
      password: "admin",
      username: "admin",
      email: 'dev@nocobase.com',
      token: "38979f07e1fca68fb3d2",
    });
  }
  const Storage = database.getModel('storages');
  // await Storage.create({
  //   title: '本地存储',
  //   name: `local`,
  //   type: 'local',
  //   baseUrl: process.env.LOCAL_STORAGE_BASE_URL,
  //   default: true
  // });
  const storage = await Storage.findOne({
    where: {
      name: "ali-oss",
    },
  });
  if (!storage) {
    await Storage.create({
      name: `ali-oss`,
      type: 'ali-oss',
      baseUrl: process.env.STORAGE_BASE_URL,
      options: {
        region: process.env.ALIYUN_OSS_REGION,// 'oss-cn-beijing',
        accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,// 'LTAI4GEGDJsdGantisvSaz47',
        accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,//'cDFaOUwigps7ohRmsfBFXGDxNm8uIq',
        bucket: process.env.ALIYUN_OSS_BUCKET, //'nocobase'
      },
      default: true
    });
  }
  const Role = database.getModel('roles');
  if (Role) {
    const roles = await Role.bulkCreate([
      { title: '系统开发组', type: -1 },
      // { title: '匿名用户组', type: 0 },
      { title: '普通用户组', default: true },
    ]);
    await roles[0].updateAssociations({
      users: user
    });
  }

  const Action = database.getModel('actions');
  // 全局
  await Action.bulkCreate([
  ]);

  // 导入地域数据
  await chinaRegionSeederInit(api);

  // await database.getModel('collections').import(require('./collections/example').default);
  // await database.getModel('collections').import(require('./collections/authors').default);
  // await database.getModel('collections').import(require('./collections/books').default);

  const Menu = database.getModel('menus');

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
          views: [],
          name: 'welcome',
        },
      ],
    },
    {
      title: '数据',
      icon: 'DatabaseOutlined',
      type: 'group',
      children: [],
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
          views: ['users.table'],
          name: 'users',
        },
      ],
    },
    {
      title: '动态',
      icon: 'NotificationOutlined',
      type: 'group',
      developerMode: true,
      children: [
        {
          title: '操作日志',
          icon: 'DatabaseOutlined',
          type: 'page',
          views: ['action_logs.table'],
          developerMode: true,
          name: 'auditing',
        },
      ],
    },
    {
      title: '配置',
      icon: 'SettingOutlined',
      type: 'group',
      developerMode: true,
      children: [
        {
          name: 'system_settings',
          title: '系统配置',
          icon: 'DatabaseOutlined',
          type: 'page',
          views: ['system_settings.descriptions'],
          developerMode: true,
        },
        {
          name: 'collections',
          title: '数据表配置',
          icon: 'DatabaseOutlined',
          type: 'page',
          views: ['collections.table'],
          developerMode: true,
        },
        {
          name: 'menus',
          title: '菜单和页面配置',
          icon: 'MenuOutlined',
          type: 'page',
          views: ['menus.table'],
          developerMode: true,
        },
        {
          name: 'permissions',
          title: '权限配置',
          icon: 'MenuOutlined',
          type: 'page',
          views: ['roles.table'],
          developerMode: true,
        },
        {
          name: 'automations',
          title: '自动化配置',
          icon: 'MenuOutlined',
          type: 'page',
          views: ['automations.table'],
          developerMode: true,
        },
      ],
    },
  ];

  for (const item of menus) {
    const menu = await Menu.create(item);
    await menu.updateAssociations(item);
  }
  await database.close();
})();
