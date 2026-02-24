import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';

import TreePlugin from '@nocobase/plugin-block-tree/client';

import { createSingleItemInitializer } from './fixtures/createSingleItemInitializer';
import { treeInitializerItem } from '../initializer';
import { schemaViewer } from './fixtures/schemaViewer';

const initializer = createSingleItemInitializer(treeInitializerItem);

const Demo = () => {
  return <SchemaComponent schema={schemaViewer({
    type: 'void',
    name: 'test',
    'x-component': 'Grid',
    'x-initializer': initializer.name,
  })}
  />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add(initializer);
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [TreePlugin, DemoPlugin],
  designable: true,
});

export default app.getRootComponent();
