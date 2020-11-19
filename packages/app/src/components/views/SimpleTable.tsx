import React, { useEffect, useRef, useState } from 'react';
import { Table as AntdTable, Card } from 'antd';
import { Actions } from '@/components/actions';
import ViewFactory from '@/components/views';
import { useRequest } from 'umi';
import api from '@/api-client';
import get from 'lodash/get';
import { components, fields2columns } from './SortableTable';

export interface SimpleTableProps {
  schema?: any;
  activeTab?: any;
  resourceName: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

export function SimpleTable(props: SimpleTableProps) {
  console.log(props);
  const {
    activeTab = {},
    pageInfo = {},
    schema,
    resourceName,
    associatedName,
    associatedKey,
  } = props;
  const { rowKey = 'id', fields = [], rowViewName, actions = [] } = schema;
  const { sourceKey = 'id' } = activeTab.field||{};
  const drawerRef = useRef<any>();
  const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
  const { data, mutate } = useRequest(() => api.resource(name).list({
    associatedKey,
  }));
  console.log(activeTab);
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
      <ViewFactory
        {...props}
        viewName={rowViewName}
        reference={drawerRef}
      />
      <AntdTable
        columns={fields2columns(fields)}
        dataSource={data}
        rowKey={rowKey}
        components={components({data, mutate})}
        onRow={(record) => ({
          onClick: () => {
            drawerRef.current.setVisible(true);
            drawerRef.current.getData(record[rowKey]);
          }
        })}
        {...tableProps}
      />
    </Card>
  );
}
