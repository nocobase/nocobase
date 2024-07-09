import React from 'react';
import { useLocation } from 'react-router-dom';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';
import {
  MobilePageNavigationBar,
  MobilePageProvider,
  MobileRoutesProvider,
  MobileTitleProvider,
} from '@nocobase/plugin-mobile/client';

const schema = {
  type: 'void',
  name: 'test',
  'x-component': 'MobilePageNavigationBar',
};

const Demo = () => {
  const { pathname } = useLocation();
  return (
    <div style={{ position: 'relative' }}>
      <MobileTitleProvider title="Title">
        <MobileRoutesProvider>
          <MobilePageProvider enableNavigationBarTabs={true}>
            <SchemaComponent schema={schema} />
            <div>{pathname}</div>
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
    'mobileRoutes:list': {
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
