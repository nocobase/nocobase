import { Plugin } from '@nocobase/client';
import { DesktopMode } from '@nocobase/plugin-mobile/client';

import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const Demo = () => {
  return <DesktopMode>demo content</DesktopMode>;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();
