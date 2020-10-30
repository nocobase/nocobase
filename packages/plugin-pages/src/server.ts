import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

const data = {
  title: '布局1',
  path: '/',
  type: 'layout',
  template: 'layout1',
  order: 1,
  children: [
    {
      title: '页面1',
      type: 'page',
      path: '/page1',
      icon: 'dashboard',
      template: 'page1',
      order: 2,
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
