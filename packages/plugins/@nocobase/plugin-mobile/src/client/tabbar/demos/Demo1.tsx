import React from 'react';
import type { FC } from 'react';
import { TabBar, TabBarProps } from '@nocobase/plugin-mobile/client';
import { GithubOutlined, ZoomInOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';

import { createRouterManager } from '@nocobase/client';

const Bottom: FC = () => {
  const tabs: TabBarProps['list'] = [
    {
      key: '/',
      path: '/',
      title: 'Home',
      icon: <AppstoreOutlined />,
    },
    {
      key: '/todo',
      path: '/todo',
      title: 'TODO',
      icon: 'UnorderedListOutlined',
    },
    {
      key: 'baidu',
      path: 'https://www.github.com',
      title: 'Github',
      icon: <GithubOutlined />,
    },
    {
      key: 'custom',
      title: 'Custom Action',
      icon: <ZoomInOutlined />,
      onClick() {
        alert('Custom Action');
      },
    },
  ];

  return <TabBar list={tabs}></TabBar>;
};

const Layout = () => {
  return (
    <div>
      <Outlet />
      <div>
        <Bottom />
      </div>
    </div>
  );
};

const router = createRouterManager({ type: 'memory', initialEntries: ['/'] });

router.add('mobile', {
  Component: Layout,
});

router.add('mobile.home', {
  path: '/',
  element: <div>Home</div>,
});

router.add('mobile.todo', {
  path: '/todo',
  element: <div>TODO</div>,
});

export default () => {
  const Rooter = router.getRouterComponent();
  return <Rooter />;
};
