import React from 'react';
import { Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { MobileTitleProvider, useMobileTitle, MobileRoutesProvider, useMobileRoutes } from '../mobile-providers';

const InnerPage = () => {
  const { routeList } = useMobileRoutes();
  const { title } = useMobileTitle();
  return (
    <div>
      <h1>{title}</h1>
      <div>{routeList.length}</div>
    </div>
  );
};

const Demo = () => {
  return (
    <MobileTitleProvider>
      <MobileRoutesProvider>
        <InnerPage />
      </MobileRoutesProvider>
    </MobileTitleProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/test', Component: Demo });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/test'],
  },
  plugins: [DemoPlugin],
  apis: {
    'mobileRoutes:list': {
      data: [
        {
          id: 28,
          createdAt: '2024-06-30T12:11:05.104Z',
          updatedAt: '2024-06-30T12:11:05.104Z',
          parentId: null,
          url: '/test',
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
                title: '未读数据',
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
                title: '已读数据',
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
  },
});

export default app.getRootComponent();
