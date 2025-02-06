import { FormItem, Input } from '@formily/antd-v5';
import { ISchema, observer, useForm } from '@formily/react';
import {
  Action,
  CustomRouterContextProvider,
  Form,
  SchemaComponent,
  SchemaComponentProvider,
  useCloseAction,
} from '@nocobase/client';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router-dom';
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
          'x-decorator-props': {
            initialValue: {
              field1: 'aaa',
            },
          },
          title: 'Drawer Title',
          properties: {
            field1: {
              title: 'T1',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
            out: {
              'x-component': 'Output',
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

export default observer(() => {
  const history = createMemoryHistory();

  const Output = observer(
    () => {
      const form = useForm();
      return <pre>{JSON.stringify(form.values, null, 2)}</pre>;
    },
    { displayName: 'Output' },
  );

  return (
    <Router location={history.location} navigator={history}>
      <CustomRouterContextProvider>
        <SchemaComponentProvider scope={{ useCloseAction }} components={{ Output, Form, Action, Input, FormItem }}>
          <SchemaComponent schema={schema} />
        </SchemaComponentProvider>
      </CustomRouterContextProvider>
    </Router>
  );
});
