import React from 'react';
import {
  Application,
  Plugin,
  SchemaComponent,
  SchemaInitializer,
  useDesignable,
  useSchemaInitializerRender,
} from '@nocobase/client';
import { observer, useField, useFieldSchema } from '@formily/react';
import { Field } from '@formily/core';
import { Button } from 'antd';

const Hello = observer(() => {
  const field = useField<Field>();
  return (
    <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
      {field.title}
    </div>
  );
});

const MyInitializerComponent = () => {
  const { insertBeforeEnd } = useDesignable();
  return (
    <Button
      onClick={() =>
        insertBeforeEnd({
          type: 'void',
          title: Math.random(),
          'x-component': 'Hello',
        })
      }
    >
      Add block
    </Button>
  );
};

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  popover: false,
  Component: MyInitializerComponent,
});

const AddBlockButton = observer(
  () => {
    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer']);
    return render();
  },
  { displayName: 'AddBlockButton' },
);

const Page = observer(
  (props) => {
    return (
      <div>
        {props.children}
        <AddBlockButton />
      </div>
    );
  },
  { displayName: 'Page' },
);

const Root = () => {
  return (
    <div>
      <SchemaComponent
        components={{ Page, Hello, AddBlockButton }}
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Page',
          'x-initializer': 'MyInitializer',
          properties: {
            hello1: {
              type: 'void',
              title: 'Test1',
              'x-component': 'Hello',
            },
            hello2: {
              type: 'void',
              title: 'Test2',
              'x-component': 'Hello',
            },
          },
        }}
      ></SchemaComponent>
    </div>
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add(myInitializer);
    this.app.router.add('root', {
      path: '/',
      Component: Root,
    });
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin],
  designable: true,
});

export default app.getRootComponent();
