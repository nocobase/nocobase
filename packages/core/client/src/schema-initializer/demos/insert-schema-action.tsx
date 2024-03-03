import {
  Action,
  ActionBar,
  ActionInitializer,
  Application,
  Plugin,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  useApp,
} from '@nocobase/client';
import React from 'react';

const addActionInitializer = new SchemaInitializer({
  name: 'addAction',
  title: 'Configure actions',
  // 插入位置
  insertPosition: 'beforeEnd',
  style: { marginLeft: 8 },
  items: [
    {
      name: 'enableActions',
      type: 'itemGroup',
      title: 'Enable actions',
      children: [
        {
          name: 'create',
          title: 'Create',
          Component: 'ActionInitializer',
          schema: {
            title: 'Create',
            'x-action': 'posts:create',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-align': 'left',
          },
        },
        {
          name: 'update',
          title: 'Update',
          Component: 'ActionInitializer',
          schema: {
            title: 'Update',
            'x-action': 'posts:update',
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-align': 'right',
          },
        },
      ],
    },
  ],
});

const Root = () => {
  return (
    <div>
      <SchemaComponentProvider designable>
        <SchemaComponent
          components={{ ActionBar, Action, ActionInitializer }}
          schema={{
            type: 'void',
            name: 'page',
            'x-component': 'ActionBar',
            // 指定初始化的按钮组件，
            // Table、Form、Details、Calendar、Kanban 等等不同区块
            // 可以根据情况组装自己的 initializer
            'x-initializer': 'addAction',
            properties: {
              action1: {
                type: 'void',
                title: 'Update',
                // 使用 x-action 来标记 action schema
                'x-action': 'posts:update',
                'x-component': 'Action',
              },
            },
          }}
        ></SchemaComponent>
      </SchemaComponentProvider>
    </div>
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add(addActionInitializer);
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
  plugins: [MyPlugin],
});

export default app.getRootComponent();
