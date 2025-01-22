/**
 * iframe: true
 * compact: true
 */
import { Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { MobileProviders, MobileTabBar, mobileTabBarInitializer } from '@nocobase/plugin-mobile/client';
import React from 'react';

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('schema', {
      path: '/page',
    });
    this.app.router.add('schema.page', {
      path: '/page/:pageSchemaUid',
      element: (
        <MobileProviders>
          <MobileTabBar />
        </MobileProviders>
      ),
    });

    this.app.router.add('inner-page', {
      path: '/inner-page',
      element: 'inner page',
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/inner-page'],
  },
  designable: false,
  plugins: [DemoPlugin],
  schemaInitializers: [mobileTabBarInitializer],
  components: {
    MobileTabBar,
  },
  apis: {
    'applicationPlugins:update': {
      data: {},
    },
    'mobileRoutes:listAccessible': {
      data: [
        {
          id: 10,
          createdAt: '2024-07-08T13:22:33.763Z',
          updatedAt: '2024-07-08T13:22:33.763Z',
          parentId: null,
          title: 'Test1',
          icon: 'AppstoreOutlined',
          schemaUid: 'd4o6esth2ik',
          type: 'page',
          options: null,
          sort: 1,
          createdById: 1,
          updatedById: 1,
          children: [
            {
              id: 11,
              createdAt: '2024-07-08T13:22:33.800Z',
              updatedAt: '2024-07-08T13:22:45.084Z',
              parentId: 10,
              title: 'Tab1',
              icon: null,
              schemaUid: 'pm65m9y0o2y',
              type: 'tabs',
              options: null,
              sort: 2,
              createdById: 1,
              updatedById: 1,
              __index: '0.children.0',
            },
            {
              id: 12,
              createdAt: '2024-07-08T13:22:48.564Z',
              updatedAt: '2024-07-08T13:22:48.564Z',
              parentId: 10,
              title: 'Tab2',
              icon: null,
              schemaUid: '1mcth1tfcb6',
              type: 'tabs',
              options: null,
              sort: 3,
              createdById: 1,
              updatedById: 1,
              __index: '0.children.1',
            },
          ],
          __index: '0',
        },
        {
          id: 13,
          createdAt: '2024-07-08T13:23:01.929Z',
          updatedAt: '2024-07-08T13:23:12.433Z',
          parentId: null,
          title: 'Test2',
          icon: 'aliwangwangoutlined',
          schemaUid: null,
          type: 'link',
          options: {
            schemaUid: null,
            url: 'https://github.com',
            params: [{}],
          },
          sort: 4,
          createdById: 1,
          updatedById: 1,
          __index: '1',
        },
      ],
    },
    'uiSchemas:getJsonSchema/d4o6esth2ik': {
      data: {
        'x-uid': 'd4o6esth2ik',
        name: 'd4o6esth2ik',
        type: 'void',
        'x-component': 'MobilePageProvider',
        'x-settings': 'mobile:page',
        'x-decorator': 'BlockItem',
        'x-decorator-props': {
          style: {
            height: '100%',
          },
        },
        'x-toolbar-props': {
          draggable: false,
          spaceWrapperStyle: {
            right: -15,
            top: -15,
          },
          spaceClassName: 'css-m1q7xw',
          toolbarStyle: {
            overflowX: 'hidden',
          },
        },
        _isJSONSchemaObject: true,
        version: '2.0',
        'x-async': false,
        'x-component-props': {
          displayPageTitle: true,
          displayTabs: true,
        },
        properties: {
          header: {
            type: 'void',
            'x-component': 'MobilePageHeader',
            properties: {
              pageNavigationBar: {
                type: 'void',
                'x-component': 'MobilePageNavigationBar',
                properties: {
                  actionBar: {
                    type: 'void',
                    'x-component': 'MobileNavigationActionBar',
                    'x-initializer': 'mobile:navigation-bar:actions',
                    'x-component-props': {
                      spaceProps: {
                        style: {
                          flexWrap: 'nowrap',
                        },
                      },
                    },
                    name: 'actionBar',
                  },
                },
                name: 'pageNavigationBar',
              },
              pageTabs: {
                type: 'void',
                'x-component': 'MobilePageTabs',
                name: 'pageTabs',
              },
            },
            name: 'header',
          },
          content: {
            type: 'void',
            'x-component': 'MobilePageContent',
            'x-uid': 'ooteekvdis8',
            'x-async': false,
            'x-index': 2,
          },
        },
      },
    },
    'uiSchemas:getJsonSchema/1mcth1tfcb6': {
      data: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'mobile:addBlock',
        'x-app-version': '1.2.12-alpha',
        properties: {
          mbds3xuxm48: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.12-alpha',
            properties: {
              jfe4z693cji: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.12-alpha',
                properties: {
                  '01rowxmritv': {
                    'x-uid': 'pj9gi5yfpza',
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-settings': 'blockSettings:markdown',
                    'x-decorator': 'CardItem',
                    'x-decorator-props': {
                      name: 'markdown',
                    },
                    'x-component': 'Markdown.Void',
                    'x-editable': false,
                    'x-component-props': {
                      content: 'Tab2 Content',
                    },
                    'x-app-version': '1.2.12-alpha',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '4twpusksaod',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'ktou2snt890',
            'x-async': false,
            'x-index': 1,
          },
        },
        name: 'nuh60rxntix',
        'x-uid': '1mcth1tfcb6',
        'x-async': true,
        'x-index': 2,
      },
    },
    'uiSchemas:getJsonSchema/pm65m9y0o2y': {
      data: {
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'mobile:addBlock',
        properties: {
          lxtx5t4hh2x: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.12-alpha',
            properties: {
              yn6ojyount2: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.12-alpha',
                properties: {
                  mgsz7z1ibu0: {
                    'x-uid': '1dpiddwlasg',
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-settings': 'blockSettings:markdown',
                    'x-decorator': 'CardItem',
                    'x-decorator-props': {
                      name: 'markdown',
                    },
                    'x-component': 'Markdown.Void',
                    'x-editable': false,
                    'x-component-props': {
                      content: 'Tab1 content',
                    },
                    'x-app-version': '1.2.12-alpha',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'ip7l9yu8v37',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '48ilv5bcdz1',
            'x-async': false,
            'x-index': 1,
          },
        },
        name: 'pm65m9y0o2y',
        'x-uid': 'pm65m9y0o2y',
        'x-async': true,
        'x-index': 1,
      },
    },
  },
});

export default app.getRootComponent();
