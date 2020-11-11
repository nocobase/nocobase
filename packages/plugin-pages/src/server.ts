import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

const data = {
  title: '后台应用',
  path: '/',
  type: 'layout',
  template: 'TopMenuLayout',
  order: 1,
  children: [
    {
      title: '仪表盘',
      type: 'page',
      path: '/dashboard',
      icon: 'dashboard',
      template: 'page1',
      order: 2,
    },
    {
      title: '数据',
      type: 'layout',
      path: '/collections',
      icon: 'dashboard',
      template: 'SideMenuLayout',
      order: 3,
      children: [
        {
          title: '页面3',
          type: 'page',
          path: '/collections/page3',
          icon: 'dashboard',
          template: 'page3',
          order: 5,
        },
        {
          title: '页面4',
          type: 'page',
          path: '/collections/page4',
          icon: 'dashboard',
          template: 'page4',
          order: 6,
        },
        {
          title: '页面5',
          type: 'collection',
          path: '/collections/collection1',
          icon: 'dashboard',
          template: 'collection',
          collection: 'collection1',
          order: 7,
        },
      ]
    },
    {
      title: '用户',
      type: 'layout',
      path: '/users',
      icon: 'dashboard',
      template: 'SideMenuLayout',
      order: 3,
      children: [
        {
          title: '用户管理',
          type: 'collection',
          path: '/users/users',
          icon: 'dashboard',
          template: 'collection',
          collection: 'users',
          order: 1,
        },
      ]
    },
    {
      title: '配置',
      type: 'layout',
      path: '/settings',
      icon: 'dashboard',
      template: 'SideMenuLayout',
      order: 4,
      children: [
        {
          title: '页面与菜单',
          type: 'collection',
          collection: 'pages',
          path: '/settings/pages',
          icon: 'dashboard',
          order: 1,
        },
        {
          title: '数据表配置',
          type: 'collection',
          collection: 'collections',
          path: '/settings/collections',
          icon: 'dashboard',
          order: 2,
        },
        {
          title: '权限配置',
          type: 'collection',
          collection: 'roles',
          path: '/settings/roles',
          icon: 'dashboard',
          order: 3,
        },
      ]
    },
  ],
};

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  const tables = database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  await database.sync({
    tables,
  });

  const Page = database.getModel('pages');

  const page = await Page.create(data);
  await page.updateAssociations(data);

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });
}
