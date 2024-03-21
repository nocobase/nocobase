import React from 'react';
import { SchemaComponent, useDataBlockRequest, withDynamicSchemaProps } from '@nocobase/client';
import { Table, TableProps } from 'antd';
import { ISchema } from '@formily/json-schema';
import { createApp } from './createApp';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    action: 'list',
  },
  'x-component': 'CardItem',
  properties: {
    demo: {
      type: 'array',
      'x-component': 'MyTable',
      'x-use-component-props': 'useTableProps', // 动态 table 属性
    },
  },
};

const MyTable = withDynamicSchemaProps(Table);

function useTableProps(): TableProps<any> {
  const { data, loading } = useDataBlockRequest<any[]>();
  return {
    loading,
    dataSource: data?.data || [],
    columns: [
      {
        title: 'UserName',
        dataIndex: 'username',
      },
      {
        title: 'NickName',
        dataIndex: 'nickname',
      },
      {
        title: 'Email',
        dataIndex: 'email',
      },
    ],
  };
}

const Demo = () => {
  return <SchemaComponent schema={schema}></SchemaComponent>;
};

const mocks = {
  'users:list': {
    data: [
      {
        id: '1',
        username: 'jack',
        nickname: 'Jack Ma',
        email: 'test@gmail.com',
      },
      {
        id: '2',
        username: 'jim',
        nickname: 'Jim Green',
      },
      {
        id: '3',
        username: 'tom',
        nickname: 'Tom Cat',
        email: 'tom@gmail.com',
      },
    ],
  },
  'roles:list': {
    data: [
      {
        name: 'root',
        title: 'Root',
        description: 'Root',
      },
      {
        name: 'admin',
        title: 'Admin',
        description: 'Admin description',
      },
    ],
  },
};

const App = createApp(
  Demo,
  {
    components: { MyTable },
    scopes: { useTableProps },
  },
  mocks,
);

export default App;
