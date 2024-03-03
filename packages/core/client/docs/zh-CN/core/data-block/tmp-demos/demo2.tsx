import { Table } from 'antd';
import React from 'react';
import { CardItem, Plugin, SchemaComponent } from '@nocobase/client';
import { Application } from '@nocobase/client';
import { uid } from '@formily/shared';

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

class MyPlugin extends Plugin {
  async load() {
    this.app.addComponents({ MyTable });
  }
}

const tableSchema = {
  name: 'demo',
  type: 'void',
  'x-component': 'CardItem',
  properties: {
    [uid()]: {
      type: 'array',
      'x-component': 'MyTable',
    },
  },
};

const Root = () => {
  return <SchemaComponent schema={tableSchema} />;
};

const app = new Application({
  plugins: [MyPlugin],
  components: {
    CardItem,
  },
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
});

app.router.add('root', {
  path: '/',
  Component: Root,
});

export default app.getRootComponent();
