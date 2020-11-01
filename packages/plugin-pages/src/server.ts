import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

const data = {
  title: '布局1',
  path: '/',
  type: 'layout',
  template: '@/pages/layout1',
  order: 1,
  children: [
    {
      title: '页面1',
      type: 'page',
      path: '/page1',
      icon: 'dashboard',
      template: '@/pages/page1',
      order: 2,
    },
    {
      title: '页面2',
      type: 'page',
      path: '/page2',
      icon: 'dashboard',
      template: '@/pages/page2',
      order: 3,
    },
    {
      title: '页面3',
      type: 'layout',
      path: '/layout2',
      icon: 'dashboard',
      template: '@/pages/layout2',
      order: 4,
      children: [
        {
          title: '页面3',
          type: 'page',
          path: '/layout2/page3',
          icon: 'dashboard',
          template: '@/pages/page3',
          order: 5,
        },
        {
          title: '页面4',
          type: 'page',
          path: '/layout2/page4',
          icon: 'dashboard',
          template: '@/pages/page4',
          order: 6,
        },
        {
          title: '页面5',
          type: 'collection',
          path: '/layout2/collection1',
          icon: 'dashboard',
          template: '@/pages/collection',
          collection: 'collection1',
          order: 7,
        },
      ]
    },
  ],
};

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  const tables = database.import({
    directory: path.resolve(__dirname, 'tables'),
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
