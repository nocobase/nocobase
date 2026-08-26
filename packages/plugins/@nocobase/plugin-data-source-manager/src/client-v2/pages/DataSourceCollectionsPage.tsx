/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Breadcrumb, Select, Space, Spin, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DATA_SOURCE_MANAGER_SETTINGS_KEY, useT } from '../locale';
import { compileLegacyTemplate } from '../utils/compileLegacyTemplate';
import CollectionsPage from './components/CollectionsPage';

type DataSourceRecord = {
  key: string;
  displayName?: React.ReactNode;
  status?: string;
};

function decodeRouteParam(value?: string) {
  if (!value) {
    return undefined;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function statusTag(t: (key: string) => string, value?: string) {
  const statusMap: Record<string, { color: string; label: string }> = {
    loading: { color: 'orange', label: t('Loading') },
    'loading-failed': { color: 'red', label: t('Failed') },
    loaded: { color: 'green', label: t('Loaded') },
    reloading: { color: 'orange', label: t('Reloading') },
  };
  const status = statusMap[value || ''];

  return status ? <Tag color={status.color}>{status.label}</Tag> : null;
}

export default function DataSourceCollectionsPage() {
  const t = useT();
  const ctx = useFlowContext();
  const params = useParams<{ name?: string; dataSourceKey?: string }>();
  const routeDataSourceKey = decodeRouteParam(params.name || params.dataSourceKey);
  const [dataSourceKey, setDataSourceKey] = useState<string>('main');
  const currentDataSourceKey = routeDataSourceKey || dataSourceKey;
  const request = useRequest(async () => {
    await ctx.dataSourceManager.ensureLoaded({ force: true, keys: ['*'] });
    return ctx.dataSourceManager.getDataSources() as DataSourceRecord[];
  });
  const dataSources = useMemo(() => request.data || [], [request.data]);
  const currentDataSource = useMemo(
    () => dataSources.find((dataSource) => dataSource.key === currentDataSourceKey),
    [currentDataSourceKey, dataSources],
  );
  const getDataSourceLabel = useCallback(
    (dataSource: { key: string; displayName?: React.ReactNode }) =>
      dataSource.key === 'main' ? t('Main') : compileLegacyTemplate(dataSource.displayName || dataSource.key, t),
    [t],
  );
  const dataSourcesPath = useMemo(
    () => ctx.app.pluginSettingsManager.getRoutePath(`${DATA_SOURCE_MANAGER_SETTINGS_KEY}.list`),
    [ctx.app.pluginSettingsManager],
  );
  const handleBackToDataSources = useCallback(() => {
    ctx.router.navigate(dataSourcesPath);
  }, [ctx.router, dataSourcesPath]);

  useEffect(() => {
    if (routeDataSourceKey || !dataSources.length) {
      return;
    }
    if (!dataSources.some((dataSource) => dataSource.key === currentDataSourceKey)) {
      setDataSourceKey(dataSources[0].key);
    }
  }, [currentDataSourceKey, dataSources, routeDataSourceKey]);

  if (request.loading) {
    return <Spin />;
  }

  if (routeDataSourceKey) {
    const dataSourceLabel = currentDataSource ? getDataSourceLabel(currentDataSource) : routeDataSourceKey;

    return (
      <CollectionsPage
        dataSourceKey={routeDataSourceKey}
        title={
          <Breadcrumb
            items={[
              {
                title: <a onClick={handleBackToDataSources}>{t('Data sources')}</a>,
              },
              {
                title: (
                  <Space size={8}>
                    <span>{dataSourceLabel}</span>
                    {statusTag(t, currentDataSource?.status)}
                  </Space>
                ),
              },
            ]}
          />
        }
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Select
        style={{ width: 320 }}
        value={currentDataSourceKey}
        options={dataSources.map((dataSource) => ({
          value: dataSource.key,
          label: getDataSourceLabel(dataSource),
        }))}
        onChange={setDataSourceKey}
      />
      {currentDataSourceKey ? <CollectionsPage dataSourceKey={currentDataSourceKey} /> : null}
    </Space>
  );
}
