import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';
import PluginMobileClient, { MobilePageProvider, MobileTitleProvider } from '@nocobase/plugin-mobile/client';

const schema = {
  type: 'void',
  name: 'test',
  'x-component': 'MobilePageNavigationBar',
  properties: {
    actionBar: {
      type: 'void',
      'x-component': 'MobileNavigationActionBar',
      'x-component-props': {
        spaceProps: {
          style: {
            flexWrap: 'nowrap',
          },
        },
      },
      properties: {
        action1: {
          version: '2.0',
          'x-position': 'right',
          type: 'void',
          'x-component': 'Action',
          'x-toolbar': 'ActionSchemaToolbar',
          'x-use-component-props': 'useMobileNavigationBarLink',
          'x-component-props': {
            link: '/?right=true',
            title: 'Right1',
            component: 'MobileNavigationBarAction',
          },
        },
        action2: {
          version: '2.0',
          'x-position': 'right',
          type: 'void',
          'x-component': 'Action',
          'x-toolbar': 'ActionSchemaToolbar',
          'x-use-component-props': 'useMobileNavigationBarLink',
          'x-component-props': {
            link: '/?right=true',
            title: 'Right2',
            component: 'MobileNavigationBarAction',
          },
        },
        action3: {
          version: '2.0',
          'x-position': 'left',
          type: 'void',
          'x-component': 'Action',
          'x-toolbar': 'ActionSchemaToolbar',
          'x-use-component-props': 'useMobileNavigationBarLink',
          'x-component-props': {
            link: '/?left=true',
            title: 'Left',
            component: 'MobileNavigationBarAction',
          },
        },
        action4: {
          version: '2.0',
          'x-position': 'bottom',
          type: 'void',
          'x-component': 'div',
          'x-content': 'Bottom',
        },
      },
    },
  },
};

const Demo = () => {
  return (
    <div style={{ position: 'relative' }}>
      <MobileTitleProvider title="Title">
        <MobilePageProvider>
          <SchemaComponent schema={schema} />
        </MobilePageProvider>
      </MobileTitleProvider>
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin, PluginMobileClient],
  designable: true,
});

export default app.getRootComponent();
