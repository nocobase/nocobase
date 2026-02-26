import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';

import TreePlugin from '@nocobase/plugin-block-tree/client';
import { getTreeSchema } from '../schema';

const Demo = () => {
  return <SchemaComponent schema={{ type: 'void', properties: { test: getTreeSchema({ collection: 'tree-collection' }) } }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [TreePlugin, DemoPlugin],
  delayResponse: 100
});

export default app.getRootComponent();
