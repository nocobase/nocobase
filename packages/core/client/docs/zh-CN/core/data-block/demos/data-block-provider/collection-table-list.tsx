import React from 'react';
import { Table, TableProps } from 'antd';
import { SchemaComponent, useDataBlockRequestV2, withDynamicSchemaProps } from '@nocobase/client';
import { ISchema } from '@formily/json-schema';

import { createApp } from '../../../collection/demos/createApp';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DataBlockProviderV2',
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
  const { data, loading } = useDataBlockRequestV2<any[]>();
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

const Root = createApp(Demo, {
  components: { MyTable },
  scopes: { useTableProps },
});

export default Root;
