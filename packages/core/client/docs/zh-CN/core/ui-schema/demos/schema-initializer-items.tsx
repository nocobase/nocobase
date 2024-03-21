import React, { FC } from 'react';
import {
  Application,
  Plugin,
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerChild,
  SchemaInitializerItem,
  SchemaInitializerItemsProps,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaInitializerRender,
} from '@nocobase/client';
import { observer, useField, useFieldSchema } from '@formily/react';
import { Field } from '@formily/core';
import { ButtonProps, ListProps, List, Card } from 'antd';

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
  return <SchemaInitializerItem title={itemConfig.title} onClick={handleClick} />;
}

const CustomListGridMenu: FC<SchemaInitializerItemsProps<ButtonProps, ListProps<any>>> = (props) => {
  const { items, options, ...others } = props;
  return (
    <List
      {...others}
      style={{ marginTop: 20 }}
      dataSource={items}
      grid={{ gutter: 16, column: 2 }}
      renderItem={(item) => (
        <List.Item style={{ minWidth: 100, textAlign: 'center' }}>
          <SchemaInitializerChild {...item} />
        </List.Item>
      )}
    ></List>
  );
};

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Add Block',
  // 插入位置
  insertPosition: 'beforeEnd',
  ItemsComponent: CustomListGridMenu,
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
