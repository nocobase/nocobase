import { Application, Plugin } from '@nocobase/client';
import PluginEventFilterSystemClient from '@nocobase/plugin-event-filter-system/client';
import React from 'react';

const ProviderDemo = ({ children }) => {
  return (
    <div>
      <div>hello world</div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('home', {
      path: '/',
      Component: () => <div>home page</div>,
    });
  }
}

const app = new Application({
  plugins: [PluginEventFilterSystemClient, DemoPlugin],
  providers: [ProviderDemo],
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
});

export default app.getRootComponent();
