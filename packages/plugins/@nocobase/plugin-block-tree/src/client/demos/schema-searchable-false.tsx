import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, DataBlockProvider } from '@nocobase/client';

import TreePlugin from '@nocobase/plugin-block-tree/client';
import { getTreeSchema } from '../schema';

const Demo = () => {
  return <SchemaComponent schema={{ type: 'void', properties: { test: getTreeSchema({ collection: 'tree-collection', props: { searchable: false } }), } }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [TreePlugin, DemoPlugin],
});

export default app.getRootComponent();
