import path from 'path';
import { Application } from '@nocobase/server';
import { registerModels } from '@nocobase/database';
import * as models from './models';
import getAccessible from './actions/getAccessible';
import * as uiSchema from './ui-schema';

export default async function (this: Application, options = {}) {
  const database = this.database;
  registerModels(models);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  this.resourcer.registerActionHandler('routes:getAccessible', getAccessible);

  const Route = database.getModel('routes');

  this.on('ui-router.init', async () => {
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
  });
}
