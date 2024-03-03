import React from 'react';
import {
  Application,
  Plugin,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaInitializerRender,
} from '@nocobase/client';
import { observer, useField } from '@formily/react';
import { Field } from '@formily/core';

const Hello = observer(() => {
  const field = useField<Field>();
  return (
    <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
      {field.title}
    </div>
  );
});

function Demo() {
  const itemConfig = useSchemaInitializerItem();
  // 调用插入功能
  const { insert } = useSchemaInitializer();
  const handleClick = () => {
    insert({
      type: 'void',
      title: itemConfig.title,
      'x-component': 'Hello',
    });
  };
  return <div onClick={handleClick}>{itemConfig.title}</div>;
}

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  title: 'Add Block',
  // 插入位置
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'a',
      title: 'Item A',
      Component: Demo,
    },
    {
      name: 'b',
      title: 'Item B',
      Component: Demo,
    },
  ],
});

const AddBlockButton = observer(() => {
  const { render } = useSchemaInitializerRender('myInitializer');
  return render();
});

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
      <SchemaComponentProvider designable>
        <SchemaComponent
          components={{ Page, Hello, AddBlockButton }}
          schema={{
            type: 'void',
            name: 'page',
            'x-component': 'Page',
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
      </SchemaComponentProvider>
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
});

export default app.getRootComponent();
