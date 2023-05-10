import {
  Action,
  ActionBar,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React from 'react';

const initializers = {
  AddAction: {
    title: 'Configure actions',
    insertPosition: 'beforeEnd',
    style: { marginLeft: 8 },
    items: [
      {
        type: 'itemGroup',
        title: 'Enable actions',
        children: [
          {
            type: 'item',
            title: 'Create',
            component: 'ActionInitializer',
            schema: {
              title: 'Create',
              'x-action': 'posts:create',
              'x-component': 'Action',
              'x-designer': 'Action.Designer',
              'x-align': 'left',
            },
          },
          {
            type: 'item',
            title: 'Update',
            component: 'ActionInitializer',
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
  },
};

export default function App() {
  return (
    <SchemaComponentProvider designable components={{ ActionBar, Action }}>
      <SchemaInitializerProvider initializers={initializers}>
        <SchemaComponent
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
        />
      </SchemaInitializerProvider>
    </SchemaComponentProvider>
  );
}
