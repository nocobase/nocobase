import React, { useState } from 'react';
import { Table as AntdTable, Card } from 'antd';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';
import { Actions } from '@/components/actions';
import { request, useRequest } from 'umi';
import api from '@/api-client';
import { components, fields2columns } from './SortableTable';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: '住址',
    dataIndex: 'address',
    key: 'address',
  },
];

export interface TableProps {
  schema?: any;
  activeTab?: any;
  resourceName: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

export function Table(props: TableProps) {
  const {
    activeTab = {},
    schema,
    resourceName,
    associatedName,
    associatedKey,
  } = props;
  const { fields, defaultTabName, rowKey = 'id', actions = [] } = schema;
  const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
  const { data, mutate } = useRequest(() => api.resource(name).list({
    associatedKey,
  }));
  const { sourceKey = 'id' } = activeTab.field||{};
  console.log(props);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onChange = (selectedRowKeys: React.ReactText[]) => {
    setSelectedRowKeys(selectedRowKeys);
  }
  const tableProps: any = {};
  if (actions.length) {
    tableProps.rowSelection = {
      selectedRowKeys,
      onChange,
    }
  }
  return (
    <Card bordered={false}>
      <Actions {...props} style={{ marginBottom: 14 }} actions={actions}/>
      <AntdTable 
        dataSource={data}
        rowKey={rowKey}
        columns={fields2columns(fields)}
        components={components({data, mutate})}
        onRow={(data) => ({
          onClick: () => {
            redirectTo({
              ...props.match.params,
              [activeTab ? 'newItem' : 'lastItem']: {
                itemId: data[rowKey]||data.id,
                tabName: defaultTabName,
              },
            });
          },
        })}
        {...tableProps}
      />
    </Card>
  );
}
