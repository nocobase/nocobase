// @ts-ignore
global.sync = {
  force: true,
  alter: {
    drop: true,
  },
};

import Database from '@nocobase/database';
import api from '../app';
import * as uiSchema from './ui-schema';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await database.sync({
    // tables: ['collections', 'fields', 'actions', 'views', 'tabs'],
  });

  const config = require('@nocobase/plugin-users/src/collections/users').default;
  const Collection = database.getModel('collections');
  const collection = await Collection.create(config);
  await collection.updateAssociations(config);

  const Route = database.getModel('routes');

  const data = [
    {
      type: 'redirect',
      from: '/',
      to: '/admin',
      exact: true,
    },
    {
      type: 'route',
      path: '/admin/:name(.+)?',
      component: 'AdminLayout',
      title: `后台`,
      uiSchema: uiSchema.menu,
    },
    {
      type: 'route',
      component: 'AuthLayout',
      children: [
        {
          type: 'route',
          path: '/login',
          component: 'RouteSchemaRenderer',
          title: `登录`,
          uiSchema: uiSchema.login,
        },
        {
          type: 'route',
          path: '/register',
          component: 'RouteSchemaRenderer',
          title: `注册`,
          uiSchema: uiSchema.register,
        },
      ],
    },
  ];

  for (const item of data) {
    const route = await Route.create(item);
    await route.updateAssociations(item);
  }

  await database.close();
})();
