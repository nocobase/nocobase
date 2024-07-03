import React from 'react';
import { BlockItem, Plugin, SchemaComponent } from '@nocobase/client';
import { MobileTabBar, getMobileTabBarLinkItemData } from '@nocobase/plugin-mobile/client';
import { mockApp } from '@nocobase/client/demo-utils';

import { schemaViewer } from './fixtures/schemaViewer';

const Demo = () => {
  return (
    <SchemaComponent
      schema={schemaViewer(
        getMobileTabBarLinkItemData({
          url: '/test',
          values: { title: 'Test', icon: 'AppstoreOutlined', link: '/test' },
        }).options,
      )}
    />
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.addComponents({ BlockItem, MobileTabBar });
    this.app.router.add('home', {
      path: '/',
      Component: Demo,
    });

    this.app.router.add('test', {
      path: '/test',
      element: <div>Test Page</div>,
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
