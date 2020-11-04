import React, { useRef } from 'react';
import { Table as AntdTable, Card } from 'antd';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';
import { Actions } from '@/components/actions';
import ViewFactory from '@/components/views';

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

export function SimpleTable(props: any) {
  console.log(props);
  const { activeTab, schema } = props;
  const { rowViewId, actions = [] } = schema;
  const drawerRef = useRef<any>();
  return (
    <Card bordered={false}>
      <Actions style={{ marginBottom: 14 }} actions={actions}/>
      <ViewFactory reference={drawerRef} id={rowViewId}/>
      <AntdTable dataSource={dataSource} onRow={(data) => ({
        onClick: () => {
          drawerRef.current.setVisible(true);
        },
      })} columns={columns} />
    </Card>
  );
}
