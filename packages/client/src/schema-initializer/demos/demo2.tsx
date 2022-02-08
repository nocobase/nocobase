import { observer, useFieldSchema } from '@formily/react';
import {
  Action,
  ActionBar,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  useDesignable
} from '@nocobase/client';
import { Switch } from 'antd';
import React from 'react';

const AddActionButton = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      style={{ marginLeft: 8 }}
      items={[
        {
          type: 'itemGroup',
          title: 'Enable actions',
          children: [
            {
              type: 'item',
              title: 'Create',
              component: InitializeAction,
              schema: {
                title: 'Create',
                'x-action': 'posts:create',
                'x-align': 'left',
              },
            },
            {
              type: 'item',
              title: 'Update',
              component: InitializeAction,
              schema: {
                title: 'Update',
                'x-action': 'posts:update',
              },
            },
          ],
        },
      ]}
    >
      Configure actions
    </SchemaInitializer.Button>
  );
});

const useCurrentActionSchema = (action: string) => {
  const fieldSchema = useFieldSchema();
  const { remove } = useDesignable();
  const schema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-action'] === action) {
      return s;
    }
    return buf;
  });
  return {
    schema,
    exists: !!schema,
    remove() {
      schema && remove(schema);
    },
  };
};

const InitializeAction = SchemaInitializer.itemWrap((props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentActionSchema(item.schema['x-action']);
  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          type: 'void',
          'x-component': 'Action',
          ...item.schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
});

export default function App() {
  return (
    <SchemaComponentProvider components={{ ActionBar, Action, AddActionButton }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'ActionBar',
          // 指定初始化的按钮组件，
          // Table、Form、Details、Calendar、Kanban 等等不同区块
          // 可以根据情况组装自己的 initializer
          'x-action-initializer': 'AddActionButton',
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
    </SchemaComponentProvider>
  );
}
