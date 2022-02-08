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

const ActionInitializerButton = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      style={{ marginLeft: 8 }}
      items={[
        {
          title: 'Enable actions',
          children: [
            {
              title: 'Create',
              key: 'create',
              component: 'ActionInitializerItem',
              schema: {
                title: 'Create',
                'x-action': 'posts:create',
                'x-align': 'left',
              },
            },
            {
              title: 'Update',
              key: 'update',
              schema: {
                title: 'Update',
                'x-action': 'posts:update',
              },
              component: 'ActionInitializerItem',
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

const ActionInitializerItem = (props) => {
  const { title, schema, insert } = props;
  const { exists, remove } = useCurrentActionSchema(schema['x-action']);
  return (
    <SchemaInitializer.Item
      onClick={(info) => {
        if (exists) {
          return remove();
        }
        insert({
          type: 'void',
          'x-component': 'Action',
          ...schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title} <Switch size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ ActionBar, Action, ActionInitializerItem, ActionInitializerButton }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'ActionBar',
          'x-action-initializer': 'ActionInitializerButton',
          properties: {
            action1: {
              type: 'void',
              title: 'Update',
              'x-action': 'posts:update',
              'x-component': 'Action',
            },
            // action2: {
            //   type: 'void',
            //   title: 'Create',
            //   'x-action': 'posts:create',
            //   'x-align': 'left',
            //   'x-component': 'Action',
            // },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}
