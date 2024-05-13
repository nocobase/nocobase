import {
  ActionContextProvider,
  ISchema,
  SchemaComponent,
  Plugin,
  useActionContext,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React, { useState } from 'react';

function useActionProps() {
  const { setVisible } = useActionContext();
  return {
    onClick() {
      setVisible(false);
    },
  };
}
const schema: ISchema = {
  name: 'test',
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
          'x-use-component-props': 'useActionProps'
        },
      },
    },
  },
}

const Demo = () => {
  const [visible, setVisible] = useState(false);
  return <ActionContextProvider value={{ visible, setVisible }}>
    <a onClick={() => setVisible(true)}>Open</a>
    <SchemaComponent schema={schema} scope={{ useActionProps }} />
  </ActionContextProvider>;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();

