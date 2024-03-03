import { Table } from 'antd';
import React, { useCallback } from 'react';
import {
  CardItem,
  Plugin,
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerItem,
  useSchemaInitializer,
  useSchemaInitializerRender,
} from '@nocobase/client';
import { Application } from '@nocobase/client';
import { uid } from '@formily/shared';
import { ISchema, observer, useFieldSchema } from '@formily/react';

const MyTable = () => {
  const dataSource = [
    {
      key: '1',
      name: 'Mike',
      age: 32,
      address: '10 Downing Street',
    },
    {
      key: '2',
      name: 'John',
      age: 42,
      address: '10 Downing Street',
    },
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
  ];

  return <Table dataSource={dataSource} columns={columns} />;
};

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

const TableDataBlockInitializer = () => {
  const { insert, setVisible } = useSchemaInitializer();

  const handleClick = useCallback(
    ({ item }) => {
      const tableSchema = {
        type: 'void',
        'x-component': 'CardItem',
        properties: {
          [uid()]: {
            type: 'array',
            'x-component': 'MyTable',
          },
        },
      };
      insert(tableSchema);
      setVisible(false);
    },
    [insert, setVisible],
  );

  return <SchemaInitializerItem title={'Table'} onClick={handleClick} />;
};

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  title: 'Add Block',
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'table',
      Component: TableDataBlockInitializer,
    },
  ],
});

const rootSchema: ISchema = {
  type: 'void',
  name: 'root',
  'x-component': 'Page',
  'x-initializer': 'myInitializer',
};

class MyPlugin extends Plugin {
  async load() {
    this.app.addComponents({ MyTable });
    this.app.schemaInitializerManager.add(myInitializer);
  }
}

const Root = () => {
  return <SchemaComponent schema={rootSchema}></SchemaComponent>;
};

const app = new Application({
  plugins: [MyPlugin],
  components: {
    Page,
    AddBlockButton,
    CardItem,
  },
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  designable: true,
});

app.router.add('home', {
  path: '/',
  Component: Root,
});

export default app.getRootComponent();
