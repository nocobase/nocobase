import React from 'react';
import {
  Action,
  ActionBar,
  ActionInitializer,
  Application,
  Plugin,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerV2,
} from '@nocobase/client';

const addActionInitializer = new SchemaInitializerV2({
  title: 'Configure actions',
  // 插入位置
  insertPosition: 'beforeEnd',
  style: { marginLeft: 8 },
  items: [
    {
      type: 'itemGroup',
      title: 'Enable actions',
      children: [
        {
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
            'x-initializer': 'AddAction',
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
    this.app.schemaInitializerManager.add('AddAction', addActionInitializer);
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
