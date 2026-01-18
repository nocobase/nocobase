import { Plugin, MobileNotFoundPage } from '@nocobase/client';

import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', element: <div>Home Page</div> });
    this.app.router.add('not-found', { path: '*', Component: MobileNotFoundPage });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/not-found'],
  },
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
