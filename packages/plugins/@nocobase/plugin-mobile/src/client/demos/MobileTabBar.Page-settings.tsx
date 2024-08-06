import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';
import {
  mobileTabBarPageSettings,
  MobileProviders,
  MobileTabBar,
  getMobileTabBarItemSchema,
} from '@nocobase/plugin-mobile/client';

import { schemaViewer } from './fixtures/schemaViewer';

const schema = getMobileTabBarItemSchema({
  id: 1,
  type: 'page',
  title: 'Test',
  icon: 'GithubOutlined',
  schemaUid: 'test',
});

const Demo = () => {
  return (
    <div>
      <MobileProviders skipLogin={true}>
        <SchemaComponent schema={schemaViewer(schema, 'x-component-props')} />
      </MobileProviders>
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  components: {
    MobileTabBar,
  },
  plugins: [DemoPlugin],
  schemaSettings: [mobileTabBarPageSettings],
  designable: true,
  apis: {
    'mobileRoutes:list': {
      data: [],
    },
    'mobileRoutes:update': {
      data: [],
    },
  },
});

export default app.getRootComponent();
