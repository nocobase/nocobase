import React from 'react';
import { Table as AntdTable, Card } from 'antd';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';
import { Actions } from '@/components/actions';
import { request, useRequest } from 'umi';
import api from '@/api-client';

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
  const { defaultTabId, fields, defaultTabName, rowKey = 'id', actions = [] } = schema;
  const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
  const { data } = useRequest(() => api.resource(name).list({
    associatedKey,
  }));
  const { sourceKey = 'id' } = activeTab.field||{};
  console.log(data);
  console.log(activeTab);
  return (
    <Card bordered={false}>
      <Actions {...props} style={{ marginBottom: 14 }} actions={actions}/>
      <AntdTable dataSource={data} onRow={(data) => ({
        onClick: () => {
          redirectTo({
            ...props.match.params,
            [activeTab ? 'newItem' : 'lastItem']: {
              itemId: data[rowKey]||data.id,
              tabName: defaultTabName,
            },
          });
        },
      })} columns={fields} />
    </Card>
  );
}
