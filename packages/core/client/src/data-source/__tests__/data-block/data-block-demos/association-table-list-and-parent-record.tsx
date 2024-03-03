import React from 'react';
import { Table, TableProps } from 'antd';
import { SchemaComponent, UseDataBlockProps, useDataBlockRequest, withDynamicSchemaProps } from '@nocobase/client';
import { ISchema } from '@formily/json-schema';
import { createApp } from './createApp';

const collection = 'users';
const associationField = 'roles';

const association = `${collection}.${associationField}`;
const action = 'list';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DataBlockProvider',
  'x-use-decorator-props': 'useBlockDecoratorProps',
  'x-decorator-props': {
    association,
    action,
  },
  'x-component': 'CardItem',
  properties: {
    demo: {
      type: 'array',
      'x-component': 'MyTable',
      'x-use-component-props': 'useTableProps',
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
        title: 'Name',
        dataIndex: 'name',
      },
      {
        title: 'Title',
        dataIndex: 'title',
      },
      {
        title: 'Description',
        dataIndex: 'description',
      },
    ],
  };
}

const useBlockDecoratorProps: UseDataBlockProps<'CollectionList'> = () => {
  const parentRecord = {
    id: 1,
    username: 'Tom',
  };
  return {
    parentRecord,
  };
};

const Demo = () => {
  return <SchemaComponent schema={schema}></SchemaComponent>;
};

const mocks = {
  [`${collection}/1/${associationField}:${action}`]: {
    data: [
      {
        name: 'admin',
        title: 'Admin',
        description: 'Admin description',
      },
      {
        name: 'developer',
        title: 'Developer',
        description: 'Developer description',
      },
    ],
  },
};

const Root = createApp(
  Demo,
  {
    components: { MyTable },
    scopes: { useTableProps, useBlockDecoratorProps },
  },
  mocks,
);

export default Root;
