import {
  Application,
  Plugin,
  SchemaComponentPlugin,
  SchemaInitializer,
  useSchemaInitializerRender,
} from '@nocobase/client';
import React from 'react';

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  designable: true,
  title: 'Button Text',
  items: [
    {
      name: 'a',
      type: 'itemGroup',
      title: 'Group a',
      // 动态加载子项
      useChildren() {
        return [
          {
            name: 'a1',
            type: 'item',
            title: 'A 1',
            onClick: () => {
              alert('a-1');
            },
          },
          {
            name: 'a2',
            type: 'item',
            title: 'A 2',
          },
        ];
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'b',
      type: 'item',
      title: 'Item B',
      useVisible() {
        return false;
      },
    },
    {
      name: 'c',
      type: 'item',
      title: 'Item C',
      useVisible() {
        return true;
      },
    },
  ],
});

const Root = () => {
  const { render } = useSchemaInitializerRender('myInitializer');
  return <div>{render()}</div>;
};

class MyPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add(myInitializer);
    this.app.router.add('root', {
      path: '/',
      Component: Root,
    });
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin, SchemaComponentPlugin],
});

export default app.getRootComponent();
