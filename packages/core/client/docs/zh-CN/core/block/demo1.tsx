import React, { FC } from 'react';
import {
  SchemaComponent,
  useDataBlockRequestV2,
  useBlockSettingsV2,
  withSchemaComponentProps,
  UseDataBlockProps,
} from '@nocobase/client';
import { createApp } from './createApp';
import { Switch, Table, TableProps } from 'antd';

interface DemoTableRecordType {
  name: string;
}
type DemoTableProps = TableProps<DemoTableRecordType>;
const DemoTable: FC<DemoTableProps> = withSchemaComponentProps((props) => {
  const { dn } = useBlockSettingsV2();
  return (
    <>
      <Switch
        defaultChecked={props.bordered}
        checkedChildren="Bordered"
        onChange={(v) => {
          dn.deepMerge({
            'x-decorator-props': {
              bordered: v,
            },
          });
        }}
      ></Switch>
      <Table {...props}></Table>
    </>
  );
});

function useDemoTableProps(): DemoTableProps {
  const { data, loading } = useDataBlockRequestV2<{ data: DemoTableRecordType[]; total: number }>();
  const { props, changeSchemaProps } = useBlockSettingsV2<{
    rowKey?: string;
    params?: Record<string, any>;
    bordered?: boolean;
  }>();
  const { rowKey, params, bordered } = props;
  return {
    columns: [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Address',
        dataIndex: 'address',
        key: 'address',
      },
    ],
    loading,
    dataSource: data?.data || [],
    rowKey,
    bordered,
    pagination: {
      pageSize: params.pageSize || 5,
      current: params.page || 1,
      total: data?.total,
      onChange(page, pageSize) {
        changeSchemaProps({
          params: {
            pageSize,
            page,
          },
        });
      },
    },
  };
}

const collection = 'users';
const action = 'list';

const useTableDataBlockDecoratorProps: UseDataBlockProps<'CollectionList'> = () => {
  return {
    params: {
      address: 'New York',
    },
  };
};

const schema = {
  type: 'void',
  name: 'hello',
  'x-decorator': 'DataBlockProviderV2',
  'x-use-decorator-props': 'useTableDataBlockDecoratorProps',
  'x-component': 'DemoTable',
  'x-use-component-props': 'useDemoTableProps',
  'x-decorator-props': {
    action: action,
    collection: collection,
    params: {
      pageSize: 5,
      page: 1,
    },
    rowKey: 'id',
    bordered: false,
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema}></SchemaComponent>;
};

const mocks = {
  [`${collection}:${action}`]: function (config: any) {
    console.log('请求结果');
    const { page = 1, pageSize, address } = config.params;
    const fixedData = [];
    for (let i = 0; i < pageSize; i += 1) {
      fixedData.push({
        id: (page - 1) * pageSize + i + 1,
        name: ['Light', 'Bamboo', 'Little'][i % 3],
        address: `${address} No. ${i + 1} Lake Park`,
      });
    }
    return {
      data: fixedData,
      total: 200,
    };
  },
};

const Root = createApp(
  Demo,
  { components: { DemoTable }, scopes: { useDemoTableProps, useTableDataBlockDecoratorProps } },
  mocks,
);

export default Root;
