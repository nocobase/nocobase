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
    children: [
      {
        title: '仪表盘',
        type: 'page',
        path: '/dashboard',
        icon: 'DashboardOutlined',
        template: 'page1',
        sort: 20,
        showInMenu: true,
      },
      {
        title: '数据',
        type: 'layout',
        path: '/collections',
        icon: 'DatabaseOutlined',
        template: 'SideMenuLayout',
        sort: 30,
        showInMenu: true,
        children: [
          // {
          //   title: '页面3',
          //   type: 'page',
          //   path: '/collections/page3',
          //   icon: 'dashboard',
          //   template: 'page3',
          //   sort: 40,
          // },
          // {
          //   title: '页面4',
          //   type: 'page',
          //   path: '/collections/page4',
          //   icon: 'dashboard',
          //   template: 'page4',
          //   sort: 50,
          // },
        ]
      },
      {
        title: '用户',
        type: 'layout',
        path: '/users',
        icon: 'TeamOutlined',
        template: 'SideMenuLayout',
        sort: 70,
        showInMenu: true,
        children: [
          {
            title: '用户管理',
            type: 'collection',
            path: '/users/users',
            icon: 'UserOutlined',
            template: 'collection',
            collection: 'users',
            sort: 80,
            showInMenu: true,
          },
        ]
      },
      {
        title: '动态',
        type: 'layout',
        path: '/activity',
        icon: 'NotificationOutlined',
        template: 'SideMenuLayout',
        sort: 85,
        showInMenu: true,
        children: [
          {
            title: '操作记录',
            type: 'collection',
            path: '/activity/logs',
            icon: 'HistoryOutlined',
            template: 'collection',
            collection: 'action_logs',
            sort: 80,
            showInMenu: true,
          },
        ]
      },
      {
        title: '配置',
        type: 'layout',
        path: '/settings',
        icon: 'SettingOutlined',
        template: 'SideMenuLayout',
        sort: 90,
        showInMenu: true,
        children: [
          {
            title: '页面与菜单',
            type: 'collection',
            collection: 'pages',
            path: '/settings/pages',
            icon: 'MenuOutlined',
            sort: 100,
            developerMode: true,
            showInMenu: true,
          },
          {
            title: '数据表配置',
            type: 'collection',
            collection: 'collections',
            path: '/settings/collections',
            icon: 'TableOutlined',
            sort: 110,
            showInMenu: true,
          },
          {
            title: '权限组配置',
            type: 'collection',
            collection: 'roles',
            path: '/settings/roles',
            icon: 'TableOutlined',
            sort: 120,
            showInMenu: true,
          },
          {
            title: '自动化配置',
            type: 'collection',
            collection: 'automations',
            path: '/settings/automations',
            icon: 'TableOutlined',
            sort: 130,
            showInMenu: true,
          },
        ]
      },
    ],
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
  {
    title: '后台',
    path: '/admin',
    type: 'page',
    inherit: false,
    template: 'AdminLoader',
    order: 230,
  }
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
  const roles = await Role.bulkCreate([
    { title: '系统开发组', type: -1 },
    { title: '匿名用户组', type: 0 },
    { title: '普通用户组', default: true },
  ]);
  await roles[0].updateAssociations({
    users: user
  });

  const Action = database.getModel('actions');
  // 全局
  await Action.bulkCreate([
  ]);

  // 导入地域数据
  // await chinaRegionSeederInit(api);

  await database.getModel('collections').import(require('./collections/example').default);
  await database.getModel('collections').import(require('./collections/authors').default);
  await database.getModel('collections').import(require('./collections/books').default);

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
          // pageName: 'welcome'
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
        {
          title: '申请表单',
          icon: 'DatabaseOutlined',
          type: 'page',
          pageName: 'authors.form',
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
          pageName: 'pages_v2.globals',
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
  await database.close();
})();
