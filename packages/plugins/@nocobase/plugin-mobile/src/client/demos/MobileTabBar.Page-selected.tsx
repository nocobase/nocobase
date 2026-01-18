import React from 'react';
import { Plugin, MobileTabBar } from '@nocobase/client';
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
