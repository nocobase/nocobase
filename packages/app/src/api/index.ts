import Api from '../../../server/src';
import dotenv from 'dotenv';
import path from 'path';
import Database, { Model } from '@nocobase/database';
import actions from '../../../actions/src';
import associated from '../../../actions/src/middlewares/associated';

const sync = {
  force: true,
  alter: {
    drop: true,
  },
};

dotenv.config();

const api = Api.create({
  database: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    logging: false,
    define: {},
    sync,
  },
  resourcer: {
    prefix: '/api',
  },
});

api.resourcer.use(associated);
api.resourcer.registerHandlers({...actions.common, ...actions.associate});

const data = {
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
      icon: 'dashboard',
      template: 'page1',
      sort: 20,
    },
    {
      title: '数据',
      type: 'layout',
      path: '/collections',
      icon: 'dashboard',
      template: 'SideMenuLayout',
      sort: 30,
      children: [
        {
          title: '页面3',
          type: 'page',
          path: '/collections/page3',
          icon: 'dashboard',
          template: 'page3',
          sort: 40,
        },
        {
          title: '页面4',
          type: 'page',
          path: '/collections/page4',
          icon: 'dashboard',
          template: 'page4',
          sort: 50,
        },
        // {
        //   title: '页面5',
        //   type: 'collection',
        //   path: '/collections/collection1',
        //   icon: 'dashboard',
        //   template: 'collection',
        //   collection: 'collection1',
        //   sort: 60,
        // },
      ]
    },
    {
      title: '用户',
      type: 'layout',
      path: '/users',
      icon: 'dashboard',
      template: 'SideMenuLayout',
      sort: 70,
      children: [
        {
          title: '用户管理',
          type: 'collection',
          path: '/users/users',
          icon: 'dashboard',
          template: 'collection',
          collection: 'users',
          sort: 80,
        },
      ]
    },
    {
      title: '配置',
      type: 'layout',
      path: '/settings',
      icon: 'dashboard',
      template: 'SideMenuLayout',
      sort: 90,
      children: [
        {
          title: '页面与菜单',
          type: 'collection',
          collection: 'pages',
          path: '/settings/pages',
          icon: 'dashboard',
          sort: 100,
        },
        {
          title: '数据表配置',
          type: 'collection',
          collection: 'collections',
          path: '/settings/collections',
          icon: 'dashboard',
          sort: 110,
        },
        // {
        //   title: '权限配置',
        //   type: 'collection',
        //   collection: 'roles',
        //   path: '/settings/roles',
        //   icon: 'dashboard',
        //   sort: 120,
        // },
      ]
    },
  ],
};

(async () => {
  await api
    .plugins([
      [path.resolve(__dirname, '../../../plugin-collections'), {}],
      [path.resolve(__dirname, '../../../plugin-pages'), {}],
      [path.resolve(__dirname, '../../../plugin-permissions'), {}],
      [path.resolve(__dirname, '../../../plugin-users'), {}],
      [path.resolve(__dirname, '../../../plugin-file-manager'), {}],
      // [require('../../plugin-collections/src/index').default, {}],
      // [require('../../plugin-pages/src/index').default, {}],
    ]);

  const database: Database = api.database;

  await database.sync({
    // tables: ['collections', 'fields', 'actions', 'views', 'tabs'],
  });

  const Collection = database.getModel('collections');
  const tables = database.getTables([]);

  for (let table of tables) {
    await Collection.import(table.getOptions(), { hooks: false });
  }

  const Page = database.getModel('pages');
  const page = await Page.create(data);
  await page.updateAssociations(data);

  await Page.create({
    title: '登录页面',
    path: '/login',
    type: 'page',
    inherit: false,
    template: 'login',
    order: 120,
  });

  await Page.create({
    title: '注册页面',
    path: '/register',
    type: 'page',
    inherit: false,
    template: 'register',
    order: 130,
  });

  await database.getModel('users').create({
    nickname: "admin",
    password: "admin",
    username: "admin",
    token: "38979f07e1fca68fb3d2",
  });

  api.listen(process.env.HTTP_PORT, () => {
    console.log(`http://localhost:${process.env.HTTP_PORT}/`);
  });
})();
