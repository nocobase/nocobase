import React from 'react';
import { Plugin } from '@nocobase/client';
import { MobilePageContent, MobileRoutesProvider } from '@nocobase/plugin-mobile/client';

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
      path: '/schema',
    });
    this.app.router.add('schema.page', {
      path: '/schema/:pageSchemaUid',
      Component: Demo,
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/schema/test'],
  },
  plugins: [DemoPlugin],
  apis: {
    'mobileRoutes:list': {
      data: [
        {
          id: 28,
          url: '/schema/test',
          children: [
            {
              id: 29,
              url: '/schema/test/tabs/tab1',
              options: {
                tabSchemaUid: 'tab1',
              },
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
        'x-content': 'Schema Test Page',
      },
    },
  },
});

export default app.getRootComponent();
