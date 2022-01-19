import React, { useState } from 'react';
import { observer, ISchema, useForm } from '@formily/react';
import {
  SchemaComponent,
  SchemaComponentProvider,
  Form,
  Action,
  useActionVisible,
  VisibleContext,
} from '@nocobase/client';
import { FormItem, Input } from '@formily/antd';
import { Button } from 'antd';

const useCloseAction = () => {
  const { setVisible } = useActionVisible();
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

const schema: ISchema = {
  type: 'object',
  properties: {
    drawer1: {
      'x-component': 'Action.Drawer',
      type: 'void',
      title: 'Drawer Title',
      properties: {
        hello1: {
          'x-content': 'Hello',
          title: 'T1',
        },
        footer1: {
          'x-component': 'Action.Drawer.Footer',
          type: 'void',
          properties: {
            close1: {
              title: 'Close',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useCloseAction }}',
              },
            },
          },
        },
      },
    },
  },
};

export default observer(() => {
  const [visible, setVisible] = useState(false);
  return (
    <SchemaComponentProvider components={{ Form, Action, Input, FormItem }}>
      <VisibleContext.Provider value={[visible, setVisible]}>
        <a onClick={() => setVisible(true)}>Open</a>
        <SchemaComponent scope={{ useCloseAction }} schema={schema} />
      </VisibleContext.Provider>
    </SchemaComponentProvider>
  );
});
