import React, { FC } from 'react';
import {
  RecordV2,
  RecordProviderV2,
  SchemaComponent,
  useBlockRequestV2,
  useBlockV2,
  withSchemaComponentProps,
} from '@nocobase/client';
import { createApp } from './createApp';
import { Switch, Table, TableProps } from 'antd';

interface DemoTableRecordType {
  name: string;
}
type DemoTableProps = TableProps<DemoTableRecordType>;
const DemoTable: FC<DemoTableProps> = withSchemaComponentProps((props) => {
  const { dn } = useBlockV2();
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
  const { data, loading } = useBlockRequestV2<{ data: DemoTableRecordType[]; total: number }>();
  const { props, dn } = useBlockV2<{ rowKey?: string; params?: Record<string, any>; bordered?: boolean }>();
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
        dn.deepMerge({
          'x-decorator-props': {
            params: {
              pageSize,
              page,
            },
          },
        });
      },
    },
  };
}

const collection = 'users';
const action = 'list';

const schema = {
  type: 'void',
  name: 'hello',
  'x-decorator': 'DataBlockProviderV2',
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
    const { page = 1, pageSize } = config.params;
    const fixedData = [];
    for (let i = 0; i < pageSize; i += 1) {
      fixedData.push({
        id: (page - 1) * pageSize + i + 1,
        name: ['Light', 'Bamboo', 'Little'][i % 3],
        address: `New York No. ${i + 1} Lake Park`,
      });
    }
    return {
      data: fixedData,
      total: 200,
    };
  },
};

const Root = createApp(Demo, { components: { DemoTable }, scopes: { useDemoTableProps } }, mocks);

export default Root;
