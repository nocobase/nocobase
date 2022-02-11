import { MagicAttributeModel } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { getAccessible } from './actions/getAccessible';

export class UiRoutesStoragePlugin extends Plugin {
  beforeLoad() {
    this.app.on('installing', async () => {
      const repository = this.app.db.getRepository('uiRoutes');
      const routes = [
        {
          type: 'redirect',
          from: '/',
          to: '/admin',
          exact: true,
        },
        {
          type: 'route',
          uiSchema: {
            type: 'void',
            'x-component': 'Menu',
            'x-component-props': {
              mode: 'mix',
              theme: 'dark',
              // defaultSelectedUid: 'u8',
              onSelect: '{{ onSelect }}',
              sideMenuRefScopeKey: 'sideMenuRef',
            },
            properties: {
              item3: {
                type: 'void',
                title: 'SubMenu u3',
                'x-component': 'Menu.SubMenu',
                'x-component-props': {},
                properties: {
                  item6: {
                    type: 'void',
                    title: 'SubMenu u6',
                    'x-component': 'Menu.SubMenu',
                    'x-component-props': {},
                    properties: {
                      item7: {
                        type: 'void',
                        title: 'Menu Item u7',
                        'x-component': 'Menu.Item',
                        'x-component-props': {},
                      },
                      item8: {
                        type: 'void',
                        title: 'Menu Item u8',
                        'x-component': 'Menu.Item',
                        'x-component-props': {},
                      },
                    },
                  },
                  item4: {
                    type: 'void',
                    title: 'Menu Item u4',
                    'x-component': 'Menu.Item',
                    'x-component-props': {},
                  },
                  item5: {
                    type: 'void',
                    title: 'Menu Item u5',
                    'x-component': 'Menu.Item',
                    'x-component-props': {},
                  },
                },
              },
              item1: {
                type: 'void',
                title: 'Menu Item u1',
                'x-component': 'Menu.Item',
                'x-component-props': {},
              },
              item2: {
                type: 'void',
                title: 'Menu Item u2',
                'x-component': 'Menu.Item',
                'x-component-props': {},
              },
              item9: {
                type: 'void',
                title: 'SubMenu u9',
                'x-component': 'Menu.SubMenu',
                'x-component-props': {},
                properties: {
                  item10: {
                    type: 'void',
                    title: 'Menu Item u10',
                    'x-component': 'Menu.Item',
                    'x-component-props': {},
                  },
                },
              },
            },
          },
          path: '/admin/:name(.+)?',
          component: 'AdminLayout',
          title: 'NocoBase Admin',
        },
        {
          type: 'route',
          component: 'AuthLayout',
          routes: [
            {
              type: 'route',
              path: '/signin',
              component: 'SigninPage',
            },
            {
              type: 'route',
              path: '/signup',
              component: 'SignupPage',
            },
          ],
        },
      ];
      for (const values of routes) {
        await repository.create({
          values,
        });
      }
    });
  }

  async load() {
    this.app.resourcer.registerActionHandler('uiRoutes:getAccessible', getAccessible);
    this.app.db.registerModels({ MagicAttributeModel });
    this.app.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }
}

export default UiRoutesStoragePlugin;
