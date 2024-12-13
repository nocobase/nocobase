import { ISchema, observer, useForm } from '@formily/react';
import {
  Action,
  ActionContextProvider,
  CustomRouterContextProvider,
  Form,
  FormItem,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useActionContext,
} from '@nocobase/client';
import { createMemoryHistory } from 'history';
import React, { useState } from 'react';
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
  const history = createMemoryHistory();
  const [visible, setVisible] = useState(false);
  return (
    <Router location={history.location} navigator={history}>
      <CustomRouterContextProvider>
        <SchemaComponentProvider components={{ Form, Action, Input, FormItem }}>
          <ActionContextProvider value={{ visible, setVisible }}>
            <a onClick={() => setVisible(true)}>Open</a>
            <SchemaComponent scope={{ useCloseAction }} schema={schema} />
          </ActionContextProvider>
        </SchemaComponentProvider>
      </CustomRouterContextProvider>
    </Router>
  );
});
