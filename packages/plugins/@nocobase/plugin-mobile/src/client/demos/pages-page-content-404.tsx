import React from 'react';
import { Plugin } from '@nocobase/client';
import { MobileNotFoundPage, MobilePageContent, MobileRoutesProvider } from '@nocobase/plugin-mobile/client';

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
    this.app.addComponents({
      MobileNotFoundPage,
    });
    this.app.router.add('schema', {
      path: '/schema',
    });
    this.app.router.add('schema.page', {
      path: '/schema/:pageSchemaUid',
    });
    this.app.router.add('schema.page.tabs', {
      path: '/schema/:pageSchemaUid/tabs',
    });
    this.app.router.add('schema.page.tabs.page', {
      path: '/schema/:pageSchemaUid/tabs/:tabSchemaUid',
      Component: Demo,
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/schema/test/tabs/tab1'],
  },
  plugins: [DemoPlugin],
  apis: {
    'mobileRoutes:list': {
      data: [],
    },
    'uiSchemas:getJsonSchema/tab1': {
      data: {},
    },
  },
});

export default app.getRootComponent();
