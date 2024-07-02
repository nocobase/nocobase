import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';
import {
  mobileTabBarLinkSettings,
  MobileProviders,
  getMobileTabBarLinkItemData,
  MobileTabBar,
} from '@nocobase/plugin-mobile/client';

import { schemaViewer } from './fixtures/schemaViewer';
const schema = getMobileTabBarLinkItemData({ url: 'test', values: { title: 'test', icon: 'GithubOutlined' } }).options;

const Demo = () => {
  return (
    <div>
      <MobileProviders skipLogin={true}>
        <SchemaComponent schema={schemaViewer({ type: 'void', properties: { test: schema } }, 'x-component-props')} />
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
  schemaSettings: [mobileTabBarLinkSettings],
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
