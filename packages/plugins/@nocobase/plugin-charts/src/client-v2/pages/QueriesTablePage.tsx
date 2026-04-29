/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client-v2';
import { Alert, Table, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import { useChartsTranslation } from '../locale';

const QueriesTablePage = () => {
  const app = useApp();
  const { t } = useChartsTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    void app.apiClient
      .request({
        url: 'chartsQueries:listMetadata',
      })
      .then(({ data: response }) => {
        if (!disposed) {
          setData(response?.data || response || []);
        }
      })
      .finally(() => {
        if (!disposed) {
          setLoading(false);
        }
      })
      .catch(() => {
        if (!disposed) {
          setData([]);
        }
      });

    return () => {
      disposed = true;
    };
  }, [app.apiClient]);

  return (
    <>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message={t('The charts plugin has been deprecated. Please use the data visualization plugin instead.')}
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          {
            title: 'ID',
            dataIndex: 'id',
            width: 96,
          },
          {
            title: t('Title'),
            dataIndex: 'title',
            render: (value) => <Typography.Text>{value}</Typography.Text>,
          },
          {
            title: t('Type'),
            dataIndex: 'type',
            width: 160,
          },
        ]}
      />
    </>
  );
};

export default QueriesTablePage;
