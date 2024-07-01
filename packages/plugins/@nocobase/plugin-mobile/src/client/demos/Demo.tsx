import React, { useEffect } from 'react';
import { Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginMobileClient, { useMobileTitle } from '@nocobase/plugin-mobile/client';
import { Button } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { PluginBlockIframeClient } from '@nocobase/plugin-block-iframe/client';

const MyPage = () => {
  const navigate = useNavigate();
  return (
    <div>
      <div>自定义页面 MY</div>
      <Button color="primary" onClick={() => navigate('/config')}>
        去 /config 页面
      </Button>
    </div>
  );
};

const ConfigPage = () => {
  const { setTitle } = useMobileTitle();

  useEffect(() => {
    setTitle('Config');
  }, []);

  return (
    <div>
      <div>自定义页面 Config</div>
    </div>
  );
};

class DemoPlugin extends Plugin {
  async beforeLoad(): Promise<void> {
    await this.app.pluginManager.add(PluginMobileClient, {
      config: {
        router: {
          type: 'memory',
          basename: '/m',
          initialEntries: ['/m'],
        },
        skipLogin: true,
      },
    });
  }

  async load() {
    const mobilePlugin = this.app.pluginManager.get(PluginMobileClient);
    mobilePlugin.mobileRouter.add('mobile.my', {
      path: '/my',
      element: <MyPage />,
    });

    mobilePlugin.mobileRouter.add('mobile.config', {
      path: '/config',
      element: <ConfigPage />,
    });
  }
}

const app = mockApp({
  designable: true,
  plugins: [DemoPlugin, PluginBlockIframeClient],
  router: {
    type: 'memory',
    initialEntries: ['/m'],
  },
  apis: {
    'mobile-tabs:list': {
      data: [
        {
          id: 1,
          url: '/schema/home',
          parentId: null,
          title: 'Home',
          options: {
            type: 'void',
            'x-decorator': 'BlockItem',
            'x-toolbar-props': {
              draggable: false,
            },
            'x-settings': 'mobile:tab-bar:schema',
            'x-component': 'MobileTabBar.Page',
            'x-component-props': {
              title: 'Home',
              icon: 'AppleOutlined',
              selectedIcon: 'AppstoreOutlined',
              schemaPageUid: 'home',
            },
          },
          children: [
            {
              id: 11,
              parentId: 1,
              options: {
                title: 'Tab1',
                schemaPageUid: 'tab1',
              },
            },
            {
              id: 12,
              parentId: 1,
              options: {
                title: 'Tab2',
                schemaPageUid: 'tab2',
              },
            },
          ],
        },
        {
          id: 2,
          parentId: null,
          url: '/schema/message',
          title: 'Message',
          options: {
            type: 'void',
            'x-decorator': 'BlockItem',
            'x-toolbar-props': {
              draggable: false,
            },
            'x-component': 'MobileTabBar.Page',
            'x-component-props': {
              title: 'Message',
              icon: 'MessageOutlined',
              schemaPageUid: 'message',
            },
            'x-settings': 'mobile:tab-bar:schema',
          },
        },
        {
          id: 3,
          url: undefined,
          parentId: null,
          title: 'Github',
          options: {
            type: 'void',
            'x-component': 'MobileTabBar.Link',
            'x-component-props': {
              title: 'Github',
              icon: 'GithubOutlined',
              link: 'https://www.github.com',
            },
            'x-decorator': 'BlockItem',
            'x-toolbar-props': {
              draggable: false,
            },
            'x-settings': 'mobile:tab-bar:link',
          },
        },
        {
          id: 4,
          url: '/my',
          parentId: null,
          title: 'MY',
          options: {
            type: 'void',
            'x-component': 'MobileTabBar.Link',
            'x-component-props': {
              title: 'MY',
              link: '/my',
              icon: 'UserOutlined',
            },
            'x-decorator': 'BlockItem',
            'x-toolbar-props': {
              draggable: false,
            },
            'x-settings': 'mobile:tab-bar:link',
          },
        },
      ],
    },
    '/uiSchemas:getJsonSchema/home': {
      data: {
        type: 'void',
        name: 'home',
        'x-component': 'MobilePage',
        'x-settings': 'mobile:page',
        'x-decorator': 'BlockItem',
        'x-toolbar-props': {
          draggable: false,
        },
        properties: {
          navigationBar: {
            type: 'void',
            'x-component': 'MobilePageNavigationBar',
          },
          content: {
            type: 'void',
            'x-component': 'MobilePageContent',
            'x-decorator': 'Grid',
            'x-initializer': 'mobile:addBlock',
            properties: {
              iframe: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                'x-app-version': '1.2.6-alpha',
                properties: {
                  '5j2kzibcex8': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-app-version': '1.2.6-alpha',
                    properties: {
                      '9fpf28yu2sc': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-settings': 'blockSettings:iframe',
                        'x-decorator': 'BlockItem',
                        'x-decorator-props': {
                          name: 'iframe',
                        },
                        'x-component': 'Iframe',
                        'x-component-props': {
                          url: 'https://react.dev',
                          height: '60vh',
                        },
                        'x-app-version': '1.2.6-alpha',
                        'x-uid': 'oa9qxpoxg7d',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'qq4guo52d6e',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                name: 'sazeibwax6w',
                'x-uid': 'whb73jdroqz',
                'x-async': false,
                'x-index': 1,
              },
            },
          },
        },
      },
    },
    '/uiSchemas:getJsonSchema/message': {
      data: {
        type: 'void',
        name: 'message',
        'x-component': 'MobilePage',
        'x-settings': 'mobile:page',
        'x-decorator': 'BlockItem',
        'x-toolbar-props': {
          draggable: false,
        },
        properties: {
          navigationBar: {
            type: 'void',
            'x-component': 'MobilePageNavigationBar',
          },
          content: {
            type: 'void',
            'x-component': 'MobilePageContent',
            'x-decorator': 'Grid',
            'x-initializer': 'mobile:addBlock',
          },
        },
      },
    },
  },
});

export default app.getRootComponent();
