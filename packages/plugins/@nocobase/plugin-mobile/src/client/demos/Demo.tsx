import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginMobileClient from '@nocobase/plugin-mobile/client';

const app = mockApp({
  plugins: [
    [
      PluginMobileClient,
      {
        config: {
          router: {
            type: 'memory',
            basename: '/mobile',
            initialEntries: ['/mobile'],
          },
          skipLogin: true,
        },
      },
    ],
  ],
  router: {
    type: 'memory',
    initialEntries: ['/mobile'],
  },
  apis: {
    '/mobile/tabs': {
      data: [
        {
          id: 1,
          url: '/schema/home',
          parentId: null,
          options: {
            type: 'void',
            // 'x-decorator': 'MobileTabBar.ItemDecorator',
            'x-component': 'MobileTabBar.Schema',
            'x-component-props': {
              title: '首页',
              icon: 'AppleOutlined',
              selectedIcon: 'AppstoreOutlined',
              schemaId: 'home',
            },
          },
          children: [
            {
              id: 3,
              parentId: 1,
              options: {
                title: 'Tab1',
                schemaId: 'tab1',
              },
            },
            {
              id: 3,
              parentId: 1,
              options: {
                title: 'Tab2',
                schemaId: 'tab2',
              },
            },
          ],
        },
        {
          id: 2,
          parentId: null,
          options: {
            type: 'void',
            'x-decorator': 'MobileTabBar.ItemDecorator',
            'x-component': 'MobileTabBar.Schema',
            'x-component-props': {
              title: 'Message',
              icon: 'MessageOutlined',
            },
            // 'x-settings': 'MobileTabBar.Schema:settings',
          },
        },
        {
          id: 3,
          url: undefined,
          parentId: null,
          options: {
            type: 'void',
            title: 'Github',
            'x-decorator': 'MobileTabBar.ItemDecorator',
            'x-component': 'MobileTabBar.Link',
            'x-component-props': {
              icon: 'GithubOutlined',
              link: 'https://www.github.com',
            },
            // 'x-settings': 'MobileTabBar.Link:settings',
          },
        },
      ],
    },
  },
});

export default app.getRootComponent();
