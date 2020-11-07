import React from 'react';
import { Table as AntdTable, Card } from 'antd';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';
import { Actions } from '@/components/actions';
import { request, useRequest } from 'umi';

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

export function Table(props: any) {
  console.log(props);
  const { activeTab, schema } = props;
  const { defaultTabId, defaultTabName, actions = [] } = schema;
  const { data } = useRequest(() => request('/collections'));
  console.log(data);
  return (
    <Card bordered={false}>
      <Actions {...props} style={{ marginBottom: 14 }} actions={actions}/>
      <AntdTable dataSource={data} onRow={(data) => ({
        onClick: () => {
          redirectTo({
            ...props.match.params,
            [activeTab ? 'newItem' : 'lastItem']: {
              itemId: data.id,
              tabName: defaultTabName,
            },
          });
        },
      })} columns={columns} />
    </Card>
  );
}
