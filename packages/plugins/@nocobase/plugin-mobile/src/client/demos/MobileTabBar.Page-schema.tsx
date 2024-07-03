import React from 'react';
import { BlockItem, Plugin, SchemaComponent } from '@nocobase/client';
import { MobileTabBar, getMobileTabBarPageItemData } from '@nocobase/plugin-mobile/client';
import { mockApp } from '@nocobase/client/demo-utils';

import { schemaViewer } from './fixtures/schemaViewer';

const Demo = () => {
  return (
    <SchemaComponent
      schema={schemaViewer(
        getMobileTabBarPageItemData({
          pageSchemaUid: 'page1',
          url: '/schema/page1',
          values: { title: 'Test', icon: 'AppstoreOutlined' },
        }).options,
      )}
    />
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.addComponents({ BlockItem, MobileTabBar });
    this.app.router.add('schema', {
      path: '/schema',
    });

    this.app.router.add('schema.test', {
      path: '/schema/test',
      Component: Demo,
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/schema/test'],
  },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
