/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { Alert, Col, Modal, Row, Space, Spin, Table, Tabs, theme, Typography } from 'antd';
import type { TabsProps } from 'antd';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../hooks/useApp';
import type { IPluginData } from './types';

type Author =
  | string
  | {
      name: string;
      email?: string;
      url?: string;
    };

interface PackageJSON {
  name: string;
  version: string;
  description?: string;
  repository?: string | { type: string; url: string };
  homepage?: string;
  license?: string;
  author?: Author;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
}

interface DepCompatible {
  name: string;
  result: boolean;
  versionRange: string;
  packageVersion: string;
}

interface IPluginDetailData {
  packageJson: PackageJSON;
  homepage?: string;
  depsCompatible: DepCompatible[] | false;
  isCompatible?: boolean;
  lastUpdated: string;
}

interface IPluginDetailProps {
  plugin: IPluginData;
  onCancel: () => void;
}

export const PluginDetail: FC<IPluginDetailProps> = ({ plugin, onCancel }) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const app = useApp();

  const { data, loading } = useRequest<IPluginDetailData | undefined, []>(
    async () => {
      const response = await app.apiClient.request({
        url: 'pm:get',
        params: { filterByTk: plugin.name },
        skipNotify: true,
      });
      return response?.data?.data as IPluginDetailData | undefined;
    },
    {
      refreshDeps: [plugin.name],
      ready: !!plugin.name,
    },
  );

  const dependenciesCompatibleTableColumns = useMemo(
    () => [
      { title: t('Name'), dataIndex: 'name', key: 'name' },
      { title: t('Version range'), dataIndex: 'versionRange', key: 'versionRange' },
      { title: t("Plugin's version"), dataIndex: 'packageVersion', key: 'packageVersion' },
      {
        title: t('Result'),
        dataIndex: 'result',
        key: 'result',
        render: (result: boolean) => (
          <Typography.Text type={result ? 'success' : 'danger'}>{result ? t('Yes') : t('No')}</Typography.Text>
        ),
      },
    ],
    [t],
  );

  const repository = useMemo(() => {
    const repo = data?.packageJson?.repository;
    if (!repo) return null;
    const url = typeof repo === 'string' ? repo : repo.url;
    return url.replace(/\.git$/, '').replace(/^git\+/, '');
  }, [data]);

  const author = useMemo(() => {
    const a = data?.packageJson?.author;
    if (!a) return null;
    if (typeof a === 'string') return a;
    return a.name;
  }, [data]);

  const infoRow = (label: string, value: React.ReactNode) => (
    <Col span={24}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXXS, marginBottom: token.marginSM }}>
        <Typography.Text type="secondary">{label}</Typography.Text>
        <Typography.Text strong>{value}</Typography.Text>
      </div>
    </Col>
  );

  const tabItems: TabsProps['items'] = [
    {
      key: 'readme',
      label: t('Readme'),
      children: (
        <Row gutter={token.marginLG}>
          {plugin.name && infoRow(t('Name'), plugin.name)}
          {plugin.displayName && infoRow(t('DisplayName'), plugin.displayName)}
          {infoRow(t('PackageName'), plugin.packageName)}
          {repository && infoRow(t('Repository'), repository)}
          {data?.homepage &&
            infoRow(
              t('Homepage'),
              <a href={data.homepage} target="_blank" rel="noreferrer">
                {data.homepage}
              </a>,
            )}
          {plugin.description && infoRow(t('Description'), plugin.description)}
          {data?.packageJson?.license && infoRow(t('License'), data.packageJson.license)}
          {author && infoRow(t('Author'), author)}
          {infoRow(t('Version'), plugin.version)}
        </Row>
      ),
    },
    {
      key: 'dependencies',
      label: t('Dependencies compatibility check'),
      children: (
        <>
          {data?.depsCompatible === false ? (
            <Typography.Text type="danger">
              {t('`dist/externalVersion.js` not found or failed to `require`. Please rebuild this plugin.')}
            </Typography.Text>
          ) : (
            <>
              {data && !data.isCompatible && (
                <Alert
                  showIcon
                  type="error"
                  message={t(
                    'Plugin dependencies check failed, you should change the dependent version to meet the version requirements.',
                  )}
                />
              )}
              <Table
                style={{ marginTop: token.margin }}
                rowKey="name"
                pagination={false}
                columns={dependenciesCompatibleTableColumns}
                dataSource={Array.isArray(data?.depsCompatible) ? data.depsCompatible : []}
              />
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <Modal open footer={false} destroyOnClose width={600} onCancel={onCancel}>
      {loading ? (
        <Spin />
      ) : (
        <>
          <Typography.Title level={3}>{plugin.packageName}</Typography.Title>
          <Space split={<span>&nbsp;•&nbsp;</span>}>
            <span>{plugin.version}</span>
          </Space>
          <Tabs
            style={{ minHeight: '50vh' }}
            items={tabItems}
            defaultActiveKey={plugin.isCompatible === false ? 'dependencies' : 'readme'}
          />
        </>
      )}
    </Modal>
  );
};
