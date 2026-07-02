import React, { useState } from 'react';
import { Table } from '@nocobase/client-v2';
import type { ColumnsType } from 'antd/es/table';

interface Row {
  id: number;
  name: string;
  status: string;
}

const columns: ColumnsType<Row> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Status', dataIndex: 'status' },
];

const dataSource: Row[] = [
  { id: 1, name: 'Email provider', status: 'Enabled' },
  { id: 2, name: 'SMS provider', status: 'Disabled' },
  { id: 3, name: 'Webhook', status: 'Enabled' },
];

export default function TableDemo() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  return (
    <Table<Row>
      rowKey="id"
      columns={columns}
      dataSource={dataSource}
      rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
      pagination={false}
    />
  );
}
