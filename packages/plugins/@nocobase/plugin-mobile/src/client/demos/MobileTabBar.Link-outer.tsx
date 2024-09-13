import React from 'react';
import { Plugin } from '@nocobase/client';
import { MobileTabBar } from '@nocobase/plugin-mobile/client';
import { mockApp } from '@nocobase/client/demo-utils';

const Demo = () => {
  return <MobileTabBar.Link title="Test" icon="GithubOutlined" url="https://github.com" />;
};

class MyPlugin extends Plugin {
  async load() {
    this.app.router.add('home', {
      path: '/',
      Component: Demo,
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
