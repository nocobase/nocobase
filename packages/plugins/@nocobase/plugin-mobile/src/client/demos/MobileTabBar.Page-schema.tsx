import React from 'react';
import { BlockItem, Plugin, SchemaComponent } from '@nocobase/client';
import { getMobileTabBarItemSchema, MobileTabBar } from '@nocobase/plugin-mobile/client';
import { mockApp } from '@nocobase/client/demo-utils';

import { schemaViewer } from './fixtures/schemaViewer';

const schema = getMobileTabBarItemSchema({
  id: 1,
  type: 'page',
  title: 'Test',
  schemaUid: 'test',
  icon: 'AppstoreOutlined',
});

const Demo = () => {
  return <SchemaComponent schema={schemaViewer(schema)} />;
};

class MyPlugin extends Plugin {
  async load() {
    this.app.addComponents({ BlockItem, MobileTabBar });
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
