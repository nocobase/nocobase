import { useAsyncData } from '../../../../async-data-provider';
import React from 'react';
import { Table } from 'antd';

export const PreviewTable = () => {
  const { data, loading } = useAsyncData();
  const columns = Object.keys(data?.[0] || {}).map((col) => {
    return {
      title: col,
      dataIndex: col,
      key: col,
    };
  });
  const dataSource = data?.map((item: any, index: number) => ({ ...item, key: index }));
  return (
    <div
      style={{
        overflow: 'auto',
      }}
    >
      <Table
        bordered
        dataSource={dataSource}
        columns={columns}
        scroll={{ x: columns.length * 150, y: 300 }}
        loading={loading}
        rowKey="key"
      />
    </div>
  );
};
