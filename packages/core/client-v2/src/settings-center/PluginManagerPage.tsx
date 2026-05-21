/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Table, Tag, theme, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';

type PluginManagerRecord = {
  name?: string;
  packageName?: string;
  displayName?: string;
  enabled?: boolean;
  builtIn?: boolean;
  version?: string;
  isCompatible?: boolean;
};

/**
 * `Plugin manager` 的最小只读页面。
 *
 * 首版只负责展示 `pm:list` 返回的插件列表和关键状态，
 * 不承载安装、升级、删除、启停等运维操作。
 */
export const PluginManagerPage = () => {
  const app = useApp();
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<PluginManagerRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const response = await app.apiClient.request({
          url: 'pm:list',
          skipNotify: true,
        });

        if (!mounted) {
          return;
        }

        setDataSource(Array.isArray(response?.data?.data) ? response.data.data : []);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setErrorMessage(error?.message || t('Failed to load plugins'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [app, t]);

  const columns = useMemo(
    () => [
      {
        title: t('Name'),
        dataIndex: 'name',
        key: 'name',
        render: (value: string) => value || '-',
      },
      {
        title: t('Package name'),
        dataIndex: 'packageName',
        key: 'packageName',
        render: (value: string) => (
          <Typography.Text copyable={!!value} code>
            {value || '-'}
          </Typography.Text>
        ),
      },
      {
        title: t('Display name'),
        dataIndex: 'displayName',
        key: 'displayName',
        render: (value: string) => value || '-',
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        key: 'enabled',
        width: 120,
        render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? t('Yes') : t('No')}</Tag>,
      },
      {
        title: t('Built-in'),
        dataIndex: 'builtIn',
        key: 'builtIn',
        width: 120,
        render: (value: boolean) => <Tag color={value ? 'processing' : 'default'}>{value ? t('Yes') : t('No')}</Tag>,
      },
      {
        title: t('Version'),
        dataIndex: 'version',
        key: 'version',
        width: 140,
        render: (value: string) => value || '-',
      },
      {
        title: t('Compatible'),
        dataIndex: 'isCompatible',
        key: 'isCompatible',
        width: 140,
        render: (value: boolean) => (
          <Tag color={value === false ? 'error' : 'success'}>{value === false ? t('No') : t('Yes')}</Tag>
        ),
      },
    ],
    [t],
  );

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        padding: token.paddingLG,
      }}
    >
      {errorMessage ? (
        <Alert
          showIcon
          type="error"
          message={t('Failed to load plugins')}
          description={errorMessage}
          style={{ marginBottom: token.marginLG }}
        />
      ) : null}
      <Table
        rowKey={(record) => record.packageName || record.name || record.displayName || 'unknown-plugin'}
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};

export default PluginManagerPage;
