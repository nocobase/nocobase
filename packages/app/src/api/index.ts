import Api from '../../../server/src';
import dotenv from 'dotenv';
import path from 'path';
import Database, { Model } from '@nocobase/database';
import { get } from 'lodash';

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

  await database.sync();

  const Page = database.getModel('pages');
  const page = await Page.create(data);
  await page.updateAssociations(data);

  const [Collection, View, Action, Tab] = database.getModels(['collections', 'views', 'actions', 'tabs']);
  const tables = database.getTables([]);

  for (let table of tables) {
    const options = table.getOptions();
    const collection = await Collection.create(options);
    // console.log(options);
    const associations: any = {};
    if (options.fields) {
      associations['fields'] = options.fields.map(item => ({
        ...item,
        options: item,
      }))
    }
    if (options.tabs) {
      associations['tabs'] = options.tabs.map(item => ({
        ...item,
        options: item,
      }))
    }
    if (options.actions) {
      associations['actions'] = options.actions.map(item => ({
        ...item,
        options: item,
      }))
    }
    if (options.views) {
      associations['views'] = options.views.map(item => ({
        ...item,
        options: item,
      }))
    }
    await collection.updateAssociations(associations);
  }

  const actions = await Action.findAll();

  for (const action of actions) {
    const viewName = action.options.viewName;
    console.log({viewName});
    if (viewName) {
      const view = await View.findOne({
        where: {
          name: viewName,
          collection_name: action.collection_name
        },
      });
      if (view) {
        action.options.viewId = view.id;
        console.log(action.options);
        action.setDataValue('options', action.options);
        action.changed('options', true);
        await action.save();
      }
    }
  }
  const tabs = await Tab.findAll();

  for (const tab of tabs) {
    const viewName = tab.options.viewName;
    if (!viewName) {
      continue;
    }
    let view: any;
    if (tab.type === 'association') {
      view = await View.findOne({
        where: {
          name: viewName,
          collection_name: tab.options.association,
        },
      });
    } else {
      view = await View.findOne({
        where: {
          name: viewName,
          collection_name: tab.collection_name,
        },
      });
    }
    if (view) {
      tab.options.viewId = view.id;
      tab.setDataValue('options', tab.options);
      tab.changed('options', true);
      await tab.save();
    }
  }
  const views = await View.findAll();
  for (const view of views) {
    const detailsViewName = view.options.detailsViewName;
    if (detailsViewName) {
      const v = await View.findOne({
        where: {
          name: detailsViewName,
          collection_name: view.collection_name
        },
      });
      if (v) {
        view.options.detailsViewId = v.id;
        view.setDataValue('options', view.options);
        view.changed('options', true);
        await view.save();
      }
    }
    const updateViewName = view.options.updateViewName;
    if (updateViewName) {
      const v = await View.findOne({
        where: {
          name: updateViewName,
          collection_name: view.collection_name
        },
      });
      if (v) {
        view.options.updateViewId = v.id;
        view.setDataValue('options', view.options);
        view.changed('options', true);
        await view.save();
      }
    }
    console.log({detailsViewName, updateViewName});
  }

  // for (let table of tables) {
  //   const options = table.getOptions();
  //   const collection = await Collection.findOne({
  //     where: {
  //       name: options.name,
  //     },
  //   });
  //   const tabs = await collection.getTabs() as Model[];
  //   const actions = await collection.getActions() as Model[];
  //   const views = await collection.getViews() as Model[];
  //   for (const tab of tabs) {
  //     tab.options.viewName;
      
  //   }
  // }

  // const collections = await Collection.findAll();

  // await Promise.all(collections.map(async (collection) => {
  //   return await collection.modelInit();
  // }));

  api.listen(process.env.HTTP_PORT, () => {
    console.log(`http://localhost:${process.env.HTTP_PORT}/`);
  });
})();
