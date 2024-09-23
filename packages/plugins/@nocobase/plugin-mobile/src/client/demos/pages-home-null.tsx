import { Plugin } from '@nocobase/client';
import { MobileHomePage, MobileRoutesProvider } from '@nocobase/plugin-mobile/client';

import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const Demo = () => {
  return (
    <MobileRoutesProvider>
      <MobileHomePage />
    </MobileRoutesProvider>
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
  plugins: [DemoPlugin],
  apis: {
    'mobileRoutes:listAccessible': {
      data: [],
    },
  },
});

export default app.getRootComponent();
