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
          title: `NocoBase`,
          uiSchema: uiSchema.menu,
        },
        {
          type: 'route',
          component: 'AuthLayout',
          children: [
            {
              type: 'route',
              path: '/signin',
              component: 'RouteSchemaRenderer',
              title: `{{t("Sign in")}}`,
              uiSchema: uiSchema.signin,
            },
            {
              type: 'route',
              path: '/signup',
              component: 'RouteSchemaRenderer',
              title: `{{t("Sign up")}}`,
              uiSchema: uiSchema.signup,
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
