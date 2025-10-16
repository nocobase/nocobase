/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tabs, Table, Typography, Alert } from 'antd';
import { TableOutlined, CodeOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { configStore } from './config-store';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
const { Paragraph } = Typography;

export const ResultPanel: React.FC = () => {
  const t = useT();
  const ctx = useFlowSettingsContext();
  const uid = ctx.model.uid;
  const data = configStore.results[uid]?.result;
  const error = configStore.results[uid]?.error;

  return !error ? (
    <Tabs
      size="small"
      type="card"
      items={[
        {
          key: 'table',
          label: <span style={{ fontSize: 12 }}>{t('Table')}</span>,
          icon: <TableOutlined />,
          children: <TableResult data={data || []} />,
        },
        {
          key: 'json',
          label: <span style={{ fontSize: 12 }}>{t('JSON')}</span>,
          icon: <CodeOutlined />,
          children: <JSONResult data={data || []} />,
        },
      ]}
    />
  ) : (
    <Alert showIcon message={t('Query Error')} description={error} type="error" />
  );
};

const TableResult: React.FC<{
  data: any[];
}> = ({ data }) => {
  return (
    <Table
      dataSource={data.map((item: any, index: number) => ({ ...item, _key: index }))}
      rowKey="_key"
      scroll={{ x: 'max-content' }}
      columns={Object.keys(data[0] || {}).map((col) => {
        return {
          title: col,
          dataIndex: col,
          key: col,
        };
      })}
      size="small"
    />
  );
};

const JSONResult: React.FC<{
  data: any[];
}> = ({ data }) => {
  const result = JSON.stringify(data, null, 2);
  return (
    <Paragraph>
      <pre>{result}</pre>
    </Paragraph>
  );
};
