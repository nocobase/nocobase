import { ISchema, useForm } from '@formily/react';
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
        popover: true,
        openMode: 'popover',
      },
      type: 'void',
      title: 'Open',
      properties: {
        popover: {
          type: 'void',
          'x-component': 'Action.Popover',
          properties: {
            hello: {
              type: 'void',
              'x-content': 'Hello',
            },
          },
        },
      },
    },
  },
};

export default () => {
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
};
