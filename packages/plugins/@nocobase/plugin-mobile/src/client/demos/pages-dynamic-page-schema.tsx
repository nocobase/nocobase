import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, Grid, BlockItem, MobileNavigationActionBar } from '@nocobase/client';
import PluginMobileClient, { MobileProviders, getMobilePageSchema } from '@nocobase/plugin-mobile/client';

import { schemaViewer } from './fixtures/schemaViewer';

const Demo = () => {
  return (
    <MobileProviders skipLogin={true}>
      <SchemaComponent schema={schemaViewer(getMobilePageSchema('page1', 'tab1').schema)} />
    </MobileProviders>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    // this.app.router.add('root', { path: '/', Component: Demo });
    this.app.router.add('schema', {
      path: '/page',
    });
    this.app.router.add('schema.page', {
      path: '/page/:pageSchemaUid',
      Component: Demo,
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
  plugins: [DemoPlugin, PluginMobileClient],
  components: {
    Grid,
    BlockItem,
    MobileNavigationActionBar,
  },
  designable: true,
  apis: {
    'mobileRoutes:list': {
      data: [],
    },
    'uiSchemas:getJsonSchema/tab1': {
      data: Grid.wrap({
        type: 'void',
        name: 'test',
        'x-component': 'div',
        'x-content': 'Tab1 Content',
      }),
    },
  },
});

export default app.getRootComponent();
