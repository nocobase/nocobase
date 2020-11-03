import React from 'react';
import { Table as AntdTable } from 'antd';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';

const dataSource = [
  {
    id: '1',
    name: '胡彦斌',
    age: 32,
    address: '西湖区湖底公园1号',
  },
  {
    id: '2',
    name: '胡彦祖',
    age: 42,
    address: '西湖区湖底公园1号',
  },
];

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
  const { schema } = props;
  const { defaultTabId } = schema;
  return (
    <div>
      <AntdTable dataSource={dataSource} onRow={(data) => ({
        onClick: () => {
          redirectTo(props.match.params, {
            itemId: data.id,
            tabId: defaultTabId,
          });
        },
      })} columns={columns} />
    </div>
  );
}
