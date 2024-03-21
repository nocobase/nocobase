import React from 'react';
import { Select, Table, TableProps } from 'antd';
import { SchemaComponent, UseDataBlockProps, useDataBlockRequest, withDynamicSchemaProps } from '@nocobase/client';
import { ISchema } from '@formily/json-schema';

import { createApp } from '../../../data-source/demos/createApp';
import useUrlState from '@ahooksjs/use-url-state';

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
  const [state] = useUrlState({ userId: '1' });
  return {
    sourceId: state.userId,
  };
};

const Demo = () => {
  const [state, setState] = useUrlState({ userId: '1' });
  return (
    <>
      <Select
        defaultValue={state.userId}
        options={[
          { key: 1, value: '1', label: 'Tom' },
          { key: 2, value: '2', label: 'Jack' },
        ]}
        onChange={(v) => {
          setState({ userId: v });
        }}
      ></Select>
      <SchemaComponent schema={schema}></SchemaComponent>
    </>
  );
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
  [`${collection}/2/${associationField}:${action}`]: {
    data: [
      {
        name: 'developer',
        title: 'Developer',
        description: 'Developer description',
      },
      {
        name: 'tester',
        title: 'Tester',
        description: 'Tester description',
      },
    ],
  },
  [`${collection}:get/1`]: {
    id: 1,
    username: 'Tom',
  },
  [`${collection}:get/2`]: {
    id: 1,
    username: 'Jack',
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
