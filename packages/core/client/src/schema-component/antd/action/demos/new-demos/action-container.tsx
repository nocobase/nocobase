import { SchemaComponent, useActionContext, Plugin, ISchema } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

function useCloseActionProps() {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
}
const schema: ISchema = {
  name: 'test',
  type: 'void',
  'x-component': 'Action',
  title: 'Open',
  'x-component-props': {
    openMode: 'drawer',
  },
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Container',
      title: 'Title',
      properties: {
        footer: {
          type: 'void',
          'x-component': 'Action.Container.Footer',
          properties: {
            close: {
              title: 'Close',
              'x-component': 'Action',
              'x-use-component-props': 'useCloseActionProps',
            },
          },
        },
      },
    },
  },
}

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useCloseActionProps }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();
