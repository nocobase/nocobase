import { Plugin } from '@nocobase/client';
import { MobilePageContent, MobileRoutesProvider } from '@nocobase/plugin-mobile/client';
import React from 'react';

import { mockApp } from '@nocobase/client/demo-utils';

const Demo = () => {
  return (
    <MobileRoutesProvider>
      <MobilePageContent />
    </MobileRoutesProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('schema', {
      path: '/page',
    });
    this.app.router.add('schema.page', {
      path: '/page/:pageSchemaUid',
    });
    this.app.router.add('schema.page.tabs', {
      path: '/page/:pageSchemaUid/tabs',
    });
    this.app.router.add('schema.page.tabs.page', {
      path: '/page/:pageSchemaUid/tabs/:tabSchemaUid',
      Component: Demo,
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/page/test/tabs/tab1'],
  },
  plugins: [DemoPlugin],
  apis: {
    'mobileRoutes:listAccessible': {
      data: [],
    },
    'uiSchemas:getJsonSchema/tab1': {
      data: {
        type: 'void',
        name: 'test',
        'x-uid': 'test',
        'x-content': 'Schema Test Page',
      },
    },
  },
});

export default app.getRootComponent();
