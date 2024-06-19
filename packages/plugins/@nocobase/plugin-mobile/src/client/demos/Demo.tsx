import React, { useEffect } from 'react';
import { Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginMobileClient, { useMobileTitle } from '@nocobase/plugin-mobile/client';
import { Button } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';

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
          basename: '/mobile',
          initialEntries: ['/mobile'],
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
  plugins: [DemoPlugin],
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
          title: 'Home',
          options: {
            type: 'void',
            // 'x-decorator': 'MobileTabBar.ItemDecorator',
            'x-component': 'MobileTabBar.Schema',
            'x-component-props': {
              title: 'Home',
              icon: 'AppleOutlined',
              selectedIcon: 'AppstoreOutlined',
              schemaId: 'home',
            },
          },
          children: [
            {
              id: 11,
              parentId: 1,
              options: {
                title: 'Tab1',
                schemaId: 'tab1',
              },
            },
            {
              id: 12,
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
          url: '/schema/message',
          title: 'Message',
          options: {
            type: 'void',
            'x-decorator': 'MobileTabBar.ItemDecorator',
            'x-component': 'MobileTabBar.Schema',
            'x-component-props': {
              title: 'Message',
              icon: 'MessageOutlined',
              schemaId: 'message',
            },
            // 'x-settings': 'MobileTabBar.Schema:settings',
          },
        },
        {
          id: 3,
          url: undefined,
          parentId: null,
          title: 'Github',
          options: {
            type: 'void',
            'x-decorator': 'MobileTabBar.ItemDecorator',
            'x-component': 'MobileTabBar.Link',
            'x-component-props': {
              title: 'Github',
              icon: 'GithubOutlined',
              link: 'https://www.github.com',
            },
            // 'x-settings': 'MobileTabBar.Link:settings',
          },
        },
        {
          id: 4,
          url: '/my',
          parentId: null,
          title: 'MY',
          options: {
            type: 'void',
            'x-decorator': 'MobileTabBar.ItemDecorator',
            'x-component': 'MobileTabBar.Link',
            'x-component-props': {
              title: 'MY',
              link: '/my',
              icon: 'UserOutlined',
            },
            // 'x-settings': 'MobileTabBar.Link:settings',
          },
        },
      ],
    },
  },
});

export default app.getRootComponent();
