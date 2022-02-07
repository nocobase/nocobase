import { observer } from '@formily/react';
import { Action, ActionBar, SchemaComponent, SchemaComponentProvider, SchemaInitializer } from '@nocobase/client';
import React from 'react';

const InitializerButton = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={(schema) => schema}
      insertPosition={'beforeEnd'}
      style={{ marginLeft: 8 }}
      items={[
        {
          title: 'Enable actions',
          children: [
            {
              title: 'Create',
              key: 'create',
              component: 'ActionInitializer',
              schema: {
                'x-align': 'left',
              },
            },
            {
              title: 'Update',
              key: 'update',
              component: 'ActionInitializer',
            },
          ],
        },
      ]}
    >
      Configure actions
    </SchemaInitializer.Button>
  );
});

const ActionInitializer = (props) => {
  const { title, schema, insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={(info) => {
        insert({
          type: 'void',
          title: info.key,
          'x-component': 'Action',
          ...schema,
        });
      }}
    >
      {title}
    </SchemaInitializer.Item>
  );
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ ActionBar, Action, ActionInitializer, InitializerButton }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'ActionBar',
          'x-initializer': 'InitializerButton',
          properties: {
            action1: {
              type: 'void',
              title: 'Test1',
              'x-component': 'Action',
            },
            action2: {
              type: 'void',
              title: 'Test2',
              'x-component': 'Action',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}
