
import { ISchema, useActionContext } from '@nocobase/client';
import { SchemaComponent, Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const useCloseActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'primary',
    onClick() {
      console.log('submit');
      setVisible(false);
    },
  };
};

const schema: ISchema = {
  name: 'test',
  type: 'void',
  'x-component': 'Action',
  title: 'Open Drawer',
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Drawer',
      title: 'Drawer Title',
      properties: {
        content: {
          type: 'void',
          'x-content': 'Hello',
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer', // must be `Action.Drawer.Footer`
          properties: {
            close: {
              title: 'Close',
              'x-component': 'Action',
              'x-use-component-props': 'useCloseActionProps',
            },
            submit: {
              title: 'Submit',
              'x-component': 'Action',
              'x-use-component-props': 'useSubmitActionProps',
            },
          },
        },
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useCloseActionProps, useSubmitActionProps }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  apis: {
    test: { data: 'ok' },
  }
});

export default app.getRootComponent();
