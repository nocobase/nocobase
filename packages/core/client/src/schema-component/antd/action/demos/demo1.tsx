import { ISchema, observer, useForm } from '@formily/react';
import {
  Action,
  CustomRouterContextProvider,
  Form,
  FormItem,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useActionContext,
} from '@nocobase/client';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router-dom';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
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
    action1: {
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
      },
      type: 'void',
      title: 'Open',
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
    },
  },
};

export default observer(() => {
  const history = createMemoryHistory();
  return (
    <Router location={history.location} navigator={history}>
      <CustomRouterContextProvider>
        <SchemaComponentProvider scope={{ useCloseAction }} components={{ Form, Action, Input, FormItem }}>
          <SchemaComponent schema={schema} />
        </SchemaComponentProvider>
      </CustomRouterContextProvider>
    </Router>
  );
});
