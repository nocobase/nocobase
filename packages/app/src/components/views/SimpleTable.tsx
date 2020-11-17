import React, { useEffect, useRef, useState } from 'react';
import { Table as AntdTable, Card } from 'antd';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';
import { Actions } from '@/components/actions';
import ViewFactory from '@/components/views';
import { request, useRequest } from 'umi';
import api from '@/api-client';

const dataSource = [];
for (let i = 0; i < 46; i++) {
  dataSource.push({
    id: i,
    name: `Edward King ${i}`,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}

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
  const { fields, rowViewName, actions = [] } = schema;
  const { sourceKey = 'id' } = activeTab.field||{};
  const drawerRef = useRef<any>();
  const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
  const { data } = useRequest(() => api.resource(name).list({
    associatedKey,
  }));
  console.log(activeTab);
  return (
    <Card bordered={false}>
      <Actions {...props} style={{ marginBottom: 14 }} actions={actions}/>
      <ViewFactory
        {...props}
        viewName={rowViewName}
        reference={drawerRef}
      />
      <AntdTable
        columns={fields}
        dataSource={data}
        onRow={(record) => ({
          onClick: () => {
            drawerRef.current.setVisible(true);
            drawerRef.current.getData(record.id);
          }
        })}
      />
    </Card>
  );
}
