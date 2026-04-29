/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Table, Typography } from 'antd';
import React from 'react';

import { Chart } from './types';

const TableChart = ({ data = [] }: { data: Record<string, any>[] }) => {
  const columns = Object.keys(data[0] || {}).map((key) => ({
    title: key,
    dataIndex: key,
    key,
    render: (value: any) => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'object') {
        return <Typography.Text>{JSON.stringify(value)}</Typography.Text>;
      }
      return <Typography.Text>{String(value)}</Typography.Text>;
    },
  }));

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={data.map((record, index) => ({ ...record, __chartRowKey: index }))}
      rowKey="__chartRowKey"
      pagination={false}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default [
  new Chart({
    name: 'table',
    title: 'Table',
    Component: TableChart,
    getProps: ({ data }) => ({ data }),
  }),
];
