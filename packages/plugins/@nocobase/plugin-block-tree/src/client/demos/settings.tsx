import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, BlockSchemaToolbar } from '@nocobase/client';

import TreePlugin from '@nocobase/plugin-block-tree/client';
import { getTreeSchema } from '../schema';
import { schemaViewer } from './fixtures/schemaViewer';

const Demo = () => {
  return <SchemaComponent schema={schemaViewer(getTreeSchema({ collection: 'tree-collection' }))} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [TreePlugin, DemoPlugin],
  designable: true,
});

export default app.getRootComponent();
