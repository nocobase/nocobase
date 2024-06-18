import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginMobileClient from '@nocobase/plugin-mobile/client';

const app = mockApp({
  plugins: [
    [
      PluginMobileClient,
      {
        config: {
          router: {
            type: 'memory',
            basename: '/mobile',
            initialEntries: ['/mobile'],
          },
          skipLogin: true,
        },
      },
    ],
  ],
  router: {
    type: 'memory',
    initialEntries: ['/mobile'],
  },
});

export default app.getRootComponent();
