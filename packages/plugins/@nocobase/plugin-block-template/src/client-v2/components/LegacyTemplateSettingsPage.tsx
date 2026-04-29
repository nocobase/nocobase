/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { Alert, Table, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import { useBlockTemplateTranslation } from '../locale';

export const LegacyTemplateSettingsPage = () => {
  const { api } = useFlowContext();
  const { t } = useBlockTemplateTranslation();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    api
      .resource('blockTemplates')
      .list({ paginate: false })
      .then((res) => {
        if (canceled) {
          return;
        }
        setDataSource(res?.data?.data || []);
        setLoading(false);
      })
      .catch(() => {
        if (!canceled) {
          setDataSource([]);
          setLoading(false);
        }
      });
    return () => {
      canceled = true;
    };
  }, [api]);

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={t('Block template is deprecated. Please use UI templates in v2.')}
      />
      <Table
        rowKey="key"
        loading={loading}
        dataSource={dataSource}
        pagination={false}
        columns={[
          {
            title: t('Title'),
            dataIndex: 'title',
            render: (value, record: any) => value || record?.key || 'N/A',
          },
          {
            title: t('Key'),
            dataIndex: 'key',
            render: (value) => <Typography.Text code>{value}</Typography.Text>,
          },
          {
            title: t('Updated at'),
            dataIndex: 'updatedAt',
          },
        ]}
      />
    </div>
  );
};

export default LegacyTemplateSettingsPage;
