import { BlockItem, DndContext, Grid, Plugin, SchemaComponent } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginMobileClient, { MobileProviders, getMobilePageSchema } from '@nocobase/plugin-mobile/client';
import React from 'react';

import { schemaViewer } from './fixtures/schemaViewer';

const Demo = () => {
  return (
    <MobileProviders>
      <DndContext>
        <SchemaComponent schema={schemaViewer(getMobilePageSchema('page1', 'tab1').schema)} />
      </DndContext>
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
  },
  designable: true,
  apis: {
    'mobileRoutes:listAccessible': {
      data: [
        {
          id: 1,
          title: 'Page1',
          schemaUid: 'page1',
          children: [
            {
              id: 2,
              title: 'Tab1',
              schemaUid: 'tab1',
            },
          ],
        },
      ],
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
