import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';
import { mobilePageSettings } from '@nocobase/plugin-mobile/client';

import { schemaViewer } from './fixtures/schemaViewer';

const schema = {
  type: 'void',
  name: 'test',
  'x-settings': mobilePageSettings.name,
  'x-decorator': 'BlockItem',
  'x-component': 'div',
  'x-decorator-props': {
    style: {
      height: 100,
    },
  },
  'x-content': 'Settings',
};

const Demo = () => {
  return (
    <div>
      <SchemaComponent schema={schemaViewer(schema, 'x-component-props')} />
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  schemaSettings: [mobilePageSettings],
  designable: true,
});

export default app.getRootComponent();
