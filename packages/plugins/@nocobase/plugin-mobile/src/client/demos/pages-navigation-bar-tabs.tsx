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
    <MobileTitleProvider title="Title">
      <MobileRoutesProvider>
        <MobilePageProvider enableNavigationBarTabs={true}>
          <SchemaComponent schema={schema} />
          <div>{pathname}</div>
        </MobilePageProvider>
      </MobileRoutesProvider>
    </MobileTitleProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.addComponents({ MobilePageNavigationBar });
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
    initialEntries: ['/schema/page1/tabs/tab1'],
  },
  plugins: [DemoPlugin],
  apis: {
    'mobileRoutes:list': {
      data: [
        {
          id: 1,
          url: '/schema/page1',
          options: {
            title: 'Page1',
          },
          children: [
            {
              id: 2,
              parentId: 1,
              url: '/schema/page1/tabs/tab1',
              options: {
                title: 'Tab1',
                tabSchemaUid: 'tab1',
              },
            },
            {
              id: 3,
              parentId: 1,
              url: '/schema/page1/tabs/tab2',
              options: {
                title: 'Tab2',
                tabSchemaUid: 'tab2',
              },
            },
          ],
        },
      ],
    },
  },
});

export default app.getRootComponent();
