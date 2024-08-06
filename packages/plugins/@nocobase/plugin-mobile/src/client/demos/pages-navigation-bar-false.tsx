import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';
import { MobilePageNavigationBar, MobilePageProvider, MobileTitleProvider } from '@nocobase/plugin-mobile/client';

const schema = {
  type: 'void',
  name: 'test',
  'x-component': 'MobilePageNavigationBar',
};

const Demo = () => {
  return (
    <div style={{ position: 'relative' }}>
      <MobileTitleProvider title="Title">
        <MobilePageProvider displayNavigationBar={false}>
          <SchemaComponent schema={schema} />
        </MobilePageProvider>
      </MobileTitleProvider>
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.addComponents({ MobilePageNavigationBar });
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  designable: true,
});

export default app.getRootComponent();
