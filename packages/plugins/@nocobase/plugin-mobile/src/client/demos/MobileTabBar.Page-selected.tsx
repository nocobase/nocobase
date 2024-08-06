import React from 'react';
import { Plugin } from '@nocobase/client';
import { MobileTabBar } from '@nocobase/plugin-mobile/client';
import { mockApp } from '@nocobase/client/demo-utils';

const Demo = () => {
  return <MobileTabBar.Page title="Test" icon="AppstoreOutlined" schemaUid="test" />;
};

class MyPlugin extends Plugin {
  async load() {
    this.app.router.add('schema', {
      path: '/page',
    });

    this.app.router.add('schema.test', {
      path: '/page/test',
      Component: Demo,
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/page/test'],
  },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
