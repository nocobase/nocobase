import { Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import {
  MobilePageNavigationBar,
  MobilePageProvider,
  MobilePageTabs,
  MobileRoutesProvider,
  MobileTitleProvider,
} from '@nocobase/plugin-mobile/client';
import React from 'react';

const Demo = () => {
  return (
    <div style={{ position: 'relative' }}>
      <MobileTitleProvider title="Title">
        <MobileRoutesProvider>
          <MobilePageProvider displayTabs={false}>
            <MobilePageTabs />
          </MobilePageProvider>
        </MobileRoutesProvider>
      </MobileTitleProvider>
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.addComponents({ MobilePageNavigationBar });
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
    initialEntries: ['/page/page1/tabs/tab1'],
  },
  plugins: [DemoPlugin],
  apis: {
    'mobileRoutes:listAccessible': {
      data: [
        {
          id: 1,
          title: 'Page1',
          schemaUid: 'page1',
          type: 'page',
          children: [
            {
              id: 2,
              parentId: 1,
              schemaUid: 'tab1',
              title: 'Tab1',
              type: 'tabs',
            },
            {
              id: 3,
              parentId: 1,
              schemaUid: 'tab2',
              title: 'Tab2',
              type: 'tabs',
            },
          ],
        },
      ],
    },
  },
});

export default app.getRootComponent();
