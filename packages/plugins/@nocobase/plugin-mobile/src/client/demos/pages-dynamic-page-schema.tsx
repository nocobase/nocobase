import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, Grid, BlockItem, ActionBar } from '@nocobase/client';
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
      path: '/schema',
    });
    this.app.router.add('schema.page', {
      path: '/schema/:pageSchemaUid',
      Component: Demo,
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
  plugins: [DemoPlugin, PluginMobileClient],
  components: {
    Grid,
    BlockItem,
    ActionBar,
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
