import { Checkbox, Select, Table } from 'antd';
import React from 'react';
import { useAvailableActions } from '.';
import { useCompile } from '../..';

export const StrategyActions = () => {
  const availableActions = useAvailableActions();
  const compile = useCompile();
  return (
    <div>
      <Table
        size={'small'}
        pagination={false}
        columns={[
          {
            dataIndex: 'displayName',
            title: '操作',
            render: (value) => compile(value),
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
            render: () => <Select size={'small'} />,
          },
        ]}
        dataSource={availableActions}
      />
    </div>
  );
};
