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

  const Route = database.getModel('routes');

  const data = [
    {
      type: 'redirect',
      from: '/',
      to: '/admin',
      exact: true,
    },
    {
      path: '/admin/:name(.+)?',
      component: 'AdminLayout',
      title: `后台`,
      uiSchema: uiSchema.menu,
    },
    {
      component: 'AuthLayout',
      children: [
        {
          name: 'login',
          path: '/login',
          component: 'DefaultPage',
          title: `登录`,
          uiSchema: uiSchema.login,
        },
        {
          name: 'register',
          path: '/register',
          component: 'DefaultPage',
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
