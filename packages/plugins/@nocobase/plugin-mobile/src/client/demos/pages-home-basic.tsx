import { Plugin } from '@nocobase/client';
import { MobileHomePage, MobileRoutesProvider } from '@nocobase/plugin-mobile/client';

import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const Demo = () => {
  return (
    <div style={{ position: 'relative' }}>
      <MobileRoutesProvider>
        <MobileHomePage />
      </MobileRoutesProvider>
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
    this.app.router.add('test', { path: '/test', element: <div>Test Page</div> });
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
      data: [
        {
          id: 28,
          type: 'link',
          options: {
            url: '/test',
          },
        },
      ],
    },
  },
});

export default app.getRootComponent();
