import { Table } from 'antd';
import React from 'react';
import { useRoute } from '../../route-switch';

export const MenuConfigure = () => {
  const route = useRoute();
  console.log(route);
  return (
    <div>
      <Table
        columns={[
          {
            dataIndex: 'title',
            title: '菜单项',
          },
          {
            dataIndex: 'accessible',
            title: '允许访问',
          },
        ]}
        dataSource={[]}
      />
    </div>
  );
};
