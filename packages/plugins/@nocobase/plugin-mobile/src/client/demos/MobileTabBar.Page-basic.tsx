import React from 'react';
import { Plugin } from '@nocobase/client';
import { MobileTabBar } from '@nocobase/plugin-mobile/client';
import { mockApp } from '@nocobase/client/demo-utils';

const Demo = () => {
  return <MobileTabBar.Page title="Test" icon="AppstoreOutlined" pageSchemaUid="test" />;
};

class MyPlugin extends Plugin {
  async load() {
    this.app.router.add('home', {
      path: '/',
      Component: Demo,
    });

    this.app.router.add('schema', {
      path: '/schema',
    });

    this.app.router.add('schema.test', {
      path: '/schema/test',
      Component: () => {
        return <div>Schema Test Page</div>;
      },
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
