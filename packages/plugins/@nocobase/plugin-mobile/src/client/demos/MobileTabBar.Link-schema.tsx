import React from 'react';
import { BlockItem, Plugin, SchemaComponent } from '@nocobase/client';
import { MobileTabBar, getMobileTabBarItemSchema } from '@nocobase/plugin-mobile/client';
import { mockApp } from '@nocobase/client/demo-utils';

import { schemaViewer } from './fixtures/schemaViewer';

const Demo = () => {
  return (
    <SchemaComponent
      schema={schemaViewer(
        getMobileTabBarItemSchema({
          id: 1,
          type: 'link',
          title: 'Link',
          icon: 'AppstoreOutlined',
          options: {
            url: 'https://github.com',
          },
        }),
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
