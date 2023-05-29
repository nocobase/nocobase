import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  Action,
  ActionBar,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React from 'react';

export const AddActionButton = (props: any) => {
  const { insertPosition, component } = props;
  return (
    <SchemaInitializer.Button
      insertPosition={insertPosition}
      style={{
        marginLeft: 8,
      }}
      items={[
        {
          key: 'media',
          type: 'itemGroup',
          title: 'Enable actions',
          children: [
            {
              type: 'item',
              title: '{{t("Action 1")}}',
              component: 'ActionInitializer',
              schema: {
                title: 'Action 1',
                'x-component': 'Action',
                'x-action': 'action1', // x-action，按钮的唯一标识（在 action bar 里）
                'x-align': 'left', // 左边、右边
              },
            },
            {
              type: 'item',
              title: '{{t("Action 2")}}',
              component: 'ActionInitializer',
              schema: {
                title: 'Action 2',
                'x-component': 'Action',
                'x-action': 'action2',
                'x-align': 'right',
              },
            },
          ],
        },
      ]}
      component={component}
      title={component ? undefined : 'Configure actions'}
    />
  );
};

const schema: ISchema = {
  type: 'object',
  properties: {
    actions: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-initializer': 'AddActionButton',
      'x-uid': uid(),
      properties: {
        a1: {
          title: 'Action 1',
          'x-component': 'Action',
          'x-action': 'action1',
          'x-align': 'left',
        },
      },
    },
  },
};

export default function App() {
  return (
    <SchemaComponentProvider designable components={{ ActionBar, Action }}>
      <SchemaInitializerProvider initializers={{ AddActionButton }}>
        <SchemaComponent schema={schema} />
      </SchemaInitializerProvider>
    </SchemaComponentProvider>
  );
}
