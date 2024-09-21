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
      Component: Demo,
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/page/page1'],
  },
  plugins: [DemoPlugin],
  apis: {
    'mobileRoutes:listAccessible': {
      data: [
        {
          id: 28,
          title: 'Test',
          schemaUid: 'page1',
          children: [
            {
              id: 29,
              title: 'First Route',
              schemaUid: 'tab1',
            },
          ],
        },
      ],
    },
    'uiSchemas:getJsonSchema/tab1': {
      data: {
        type: 'void',
        name: 'test',
        'x-uid': 'test',
        'x-content': 'First Route Content',
      },
    },
  },
});

export default app.getRootComponent();
