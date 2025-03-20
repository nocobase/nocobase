import { ACLRolesCheckProvider, APIClientProvider, mockAPIClient, Plugin } from '@nocobase/client';
import { DesktopMode } from '@nocobase/plugin-mobile/client';

import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const { apiClient, mockRequest } = mockAPIClient();

apiClient.auth.setToken('test');

mockRequest.onGet('/roles:check').reply(() => {
  return [
    200,
    {
      data: {
        role: 'root',
        snippets: ['ui.*'],
      },
    },
  ];
});

const Demo = () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <ACLRolesCheckProvider>
        <DesktopMode>demo content</DesktopMode>
      </ACLRolesCheckProvider>
    </APIClientProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();
