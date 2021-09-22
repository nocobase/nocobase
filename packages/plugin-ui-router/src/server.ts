import path from 'path';
import { PluginOptions } from '@nocobase/server';
import { registerModels } from '@nocobase/database';
import * as models from './models';
import getAccessible from './actions/getAccessible';
import * as uiSchema from './ui-schema';

export default {
  name: 'ui-router',
  async load() {
    const database = this.app.db;
    registerModels(models);

    database.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  
    this.app.resourcer.registerActionHandler('routes:getAccessible', getAccessible);
  
    const Route = database.getModel('routes');
  
    this.app.on('db.init', async () => {
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
} as PluginOptions;
