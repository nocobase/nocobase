import { Checkbox, Select, Table } from 'antd';
import React from 'react';

export const StrategyActions = () => {
  return (
    <div>
      <Table
        size={'small'}
        pagination={false}
        columns={[
          {
            dataIndex: 'displayName',
            title: '操作',
          },
          {
            dataIndex: 'type',
            title: '类型',
          },
          {
            dataIndex: 'enable',
            title: '允许操作',
            render: () => <Checkbox />,
          },
          {
            dataIndex: 'scope',
            title: '可操作的数据范围',
            render: () => <Select size={'small'}/>,
          },
        ]}
        dataSource={[
          {
            displayName: '添加',
            type: 'new-data',
          },
          {
            displayName: '导入',
            type: 'new-data',
          },
          {
            displayName: '查看',
            type: 'old-data',
          },
        ]}
      />
    </div>
  );
};
