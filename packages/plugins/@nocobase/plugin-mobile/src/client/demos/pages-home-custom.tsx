import { Plugin } from '@nocobase/client';
import PluginMobileClient, { Mobile } from '@nocobase/plugin-mobile/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/m', Component: Mobile });
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
    'mobileRoutes:list': {
      data: [
        {
          id: 28,
          createdAt: '2024-06-30T12:11:05.104Z',
          updatedAt: '2024-06-30T12:11:05.104Z',
          parentId: null,
          url: '/schema/t1frxt9zpbv',
          options: {
            type: 'void',
            'x-decorator': 'BlockItem',
            'x-toolbar-props': {
              draggable: false,
            },
            'x-settings': 'mobile:tab-bar:page',
            'x-component': 'MobileTabBar.Page',
            'x-component-props': {
              title: 'Home',
              icon: 'alipayoutlined',
              selectedIcon: 'alipaycircleoutlined',
              pageSchemaUid: 't1frxt9zpbv',
            },
          },
          createdById: 1,
          updatedById: 1,
          children: [
            {
              id: 29,
              createdAt: '2024-06-30T12:11:05.310Z',
              updatedAt: '2024-07-01T01:17:09.607Z',
              parentId: 28,
              url: '/schema/t1frxt9zpbv/tabs/8rsetgcinn7',
              options: {
                title: '我',
                tabSchemaUid: '8rsetgcinn7',
              },
              createdById: 1,
              updatedById: 1,
              __index: '0.children.0',
            },
          ],
          __index: '0',
        },
        {
          id: 30,
          createdAt: '2024-06-30T12:11:13.923Z',
          updatedAt: '2024-07-01T01:18:04.618Z',
          parentId: null,
          url: '/schema/erat7aqqo00',
          options: {
            _isJSONSchemaObject: true,
            version: '2.0',
            name: '30',
            type: 'void',
            'x-decorator': 'BlockItem',
            'x-toolbar-props': {
              draggable: false,
            },
            'x-settings': 'mobile:tab-bar:page',
            'x-component': 'MobileTabBar.Page',
            'x-component-props': {
              title: 'Message',
              icon: 'aliwangwangoutlined',
              pageSchemaUid: 'erat7aqqo00',
              selectedIcon: 'globaloutlined',
            },
          },
          createdById: 1,
          updatedById: 1,
          children: [
            {
              id: 31,
              createdAt: '2024-06-30T12:11:14.114Z',
              updatedAt: '2024-06-30T12:11:55.964Z',
              parentId: 30,
              url: '/schema/erat7aqqo00/tabs/woov9ps6qvf',
              options: {
                title: 'Unread Message',
                tabSchemaUid: 'woov9ps6qvf',
              },
              createdById: 1,
              updatedById: 1,
              __index: '1.children.0',
            },
            {
              id: 33,
              createdAt: '2024-06-30T12:12:00.600Z',
              updatedAt: '2024-06-30T12:12:00.600Z',
              parentId: 30,
              url: '/schema/erat7aqqo00/tabs/3lkq3980t66',
              options: {
                title: 'Read Message',
                tabSchemaUid: '3lkq3980t66',
              },
              createdById: 1,
              updatedById: 1,
              __index: '1.children.1',
            },
          ],
          __index: '1',
        },
        {
          id: 32,
          createdAt: '2024-06-30T12:11:42.680Z',
          updatedAt: '2024-06-30T12:11:42.680Z',
          parentId: null,
          url: null,
          options: {
            type: 'void',
            'x-decorator': 'BlockItem',
            'x-toolbar-props': {
              draggable: false,
            },
            'x-settings': 'mobile:tab-bar:link',
            'x-component': 'MobileTabBar.Link',
            'x-component-props': {
              title: 'Github',
              icon: 'githuboutlined',
              link: 'https://www.github.com',
            },
          },
          createdById: 1,
          updatedById: 1,
          __index: '2',
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
            'x-uid': 'd1e6jk9sm1s',
            'x-async': false,
            'x-index': 1,
          },
          tabBar: {
            'x-uid': 'ib20ma8464k',
            type: 'void',
            'x-component': 'MobileTabBar',
            'x-decorator': 'BlockItem',
            'x-decorator-props': {
              style: {
                position: 'sticky',
                bottom: 0,
              },
            },
            'x-settings': 'mobile:tab-bar',
            'x-toolbar-props': {
              draggable: false,
            },
            _isJSONSchemaObject: true,
            version: '2.0',
            'x-async': false,
            'x-index': 2,
            'x-component-props': {
              enableTabBar: true,
            },
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
