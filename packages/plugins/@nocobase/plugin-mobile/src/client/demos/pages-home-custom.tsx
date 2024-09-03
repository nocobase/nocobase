/**
 * iframe: true
 */
import { Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginMobileClient, { Mobile } from '@nocobase/plugin-mobile/client';
import React from 'react';

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/m', element: <Mobile /> });
    const mobilePlugin = this.pluginManager.get(PluginMobileClient);
    mobilePlugin.mobileRouter.add('mobile.home', {
      path: '/',
      element: <div>Custom Home Page</div>,
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/m'],
  },
  plugins: [
    [
      PluginMobileClient,
      {
        config: {
          router: {
            type: 'memory',
            basename: '/m',
            initialEntries: ['/m'],
          },
          skipLogin: true,
          desktopMode: false,
        },
      },
    ],
    DemoPlugin,
  ],
  apis: {
    'mobileRoutes:listAccessible': {
      data: [
        {
          id: '1',
          title: 'Home',
          icon: 'AppstoreOutlined',
          type: 'link',
          options: {
            url: '/',
          },
        },
      ],
    },
    'uiSchemas:getJsonSchema/nocobase-mobile': {
      data: {
        type: 'void',
        properties: {
          pageOutlet: {
            type: 'void',
            'x-component': 'MobilePageOutlet',
            'x-uid': '5dix5scrv77',
            'x-async': false,
            'x-index': 1,
          },
          tabBar: {
            type: 'void',
            'x-component': 'MobileTabBar',
            'x-decorator': 'BlockItem',
            'x-decorator-props': {
              style: {
                position: 'sticky',
                bottom: 0,
                zIndex: 1000,
              },
            },
            'x-toolbar-props': {
              draggable: false,
            },
            'x-uid': 'cwf8ti4suno',
            'x-async': false,
            'x-index': 2,
          },
        },
        name: 'nocobase-mobile',
        'x-uid': 'nocobase-mobile',
        'x-async': false,
      },
    },
  },
});

export default app.getRootComponent();
