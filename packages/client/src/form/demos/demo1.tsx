import React from 'react';
import { observer, ISchema } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider, Form, Action, useCloseAction } from '@nocobase/client';
import { FormItem, Input } from '@formily/antd';
import 'antd/dist/antd.css';

export default observer(() => {
  const schema: ISchema = {
    type: 'object',
    properties: {
      a1: {
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          type: 'primary',
        },
        title: 'Open',
        properties: {
          d1: {
            type: 'void',
            'x-component': 'Action.Drawer',
            'x-decorator': 'Form',
            title: 'Drawer Title',
            properties: {
              field1: {
                'x-component': 'Input',
                'x-decorator': 'FormItem',
                title: 'T1',
              },
              f1: {
                type: 'void',
                'x-component': 'Action.Drawer.Footer',
                properties: {
                  a1: {
                    'x-component': 'Action',
                    title: 'Close',
                    'x-component-props': {
                      useAction: '{{ useCloseAction }}',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  return (
    <SchemaComponentProvider scope={{ useCloseAction }} components={{ Form, Action, Input, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
});
