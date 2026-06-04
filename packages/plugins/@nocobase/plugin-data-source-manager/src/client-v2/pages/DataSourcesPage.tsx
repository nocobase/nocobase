/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button, Card, Dropdown, Empty, Space, Switch, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { DataSourceForm } from '../components/DataSourceForm';
import { DATA_SOURCE_MANAGER_SETTINGS_KEY, useT } from '../locale';
import { PluginDataSourceManagerClientV2 } from '../plugin';
import { removeDataSourcesFromRuntime, syncDataSourcesToRuntime } from '../runtime';
import { compileLegacyTemplate } from '../utils/compileLegacyTemplate';

type DataSourceRecord = {
  key: string;
  displayName?: string;
  type?: string;
  status?: string;
  enabled?: boolean;
  collections?: any[];
};

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const meta = body?.meta || payload?.meta || {};

  return {
    records,
    total: meta.count || meta.total || records.length,
  };
}

function statusTag(t: (key: string) => string, value?: string) {
  const statusMap: Record<string, { color: string; label: string }> = {
    loading: { color: 'orange', label: t('Loading') },
    'loading-failed': { color: 'red', label: t('Failed') },
    loaded: { color: 'green', label: t('Loaded') },
    reloading: { color: 'orange', label: t('Reloading') },
  };
  const status = statusMap[value || ''] || { color: 'default', label: value || '-' };
  return <Tag color={status.color}>{status.label}</Tag>;
}

export default function DataSourcesPage() {
  const t = useT();
  const ctx = useFlowContext();
  const { modal } = App.useApp();
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const resource = useMemo(() => ctx.api.resource('dataSources'), [ctx.api]);
  const dataSourceTypes = useMemo(() => [...plugin.types.values()], [plugin]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const request = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        appends: [],
      });
      const result = normalizeListResponse(response);
      syncDataSourcesToRuntime(ctx.dataSourceManager, result.records);
      return result;
    },
    {
      refreshDeps: [page, pageSize],
    },
  );

  const records = useMemo(() => request.data?.records || [], [request.data?.records]);

  const openForm = useCallback(
    (mode: 'create' | 'edit', typeName: string, record?: DataSourceRecord) => {
      const type = plugin.getType(typeName);
      if (!type) {
        return;
      }
      ctx.viewer.drawer({
        width: 650,
        closable: true,
        content: () => (
          <DataSourceForm
            mode={mode}
            type={type}
            initialValues={record}
            onSubmitted={(nextRecord) => {
              if (nextRecord) {
                syncDataSourcesToRuntime(ctx.dataSourceManager, [nextRecord]);
              }
              request.refresh();
            }}
          />
        ),
      });
    },
    [ctx.dataSourceManager, ctx.viewer, plugin, request],
  );

  const openCollections = useCallback(
    (record: DataSourceRecord) => {
      const path = ctx.app.pluginSettingsManager
        .getRoutePath(`${DATA_SOURCE_MANAGER_SETTINGS_KEY}.:name/collections`)
        .replace(':name', encodeURIComponent(record.key));

      ctx.router.navigate(path);
    },
    [ctx.app.pluginSettingsManager, ctx.router],
  );

  const handleRefresh = useCallback(async () => {
    const needReload = records.filter((item) => item.status !== 'loaded').map((item) => item.key);
    await Promise.all(needReload.map((key) => ctx.dataSourceManager.getDataSource(key)?.reload()));
    request.refresh();
  }, [ctx.dataSourceManager, records, request]);

  const handleDelete = useCallback(
    (filterByTk: React.Key | React.Key[]) => {
      const keys = Array.isArray(filterByTk) ? filterByTk : [filterByTk];
      modal.confirm({
        title: t('Delete'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          await resource.destroy({ filterByTk });
          removeDataSourcesFromRuntime(ctx.dataSourceManager, keys);
          setSelectedRowKeys([]);
          request.refresh();
        },
      });
    },
    [ctx.dataSourceManager, modal, request, resource, t],
  );

  const columns = useMemo<ColumnsType<DataSourceRecord>>(
    () => [
      { title: t('Data source name'), dataIndex: 'key', ellipsis: true },
      {
        title: t('Data source display name'),
        dataIndex: 'displayName',
        ellipsis: true,
        render: (value: string) => compileLegacyTemplate(value, t),
      },
      {
        title: t('Type'),
        dataIndex: 'type',
        render: (value: string) =>
          value === 'main' ? t('Main') : compileLegacyTemplate(plugin.getType(value)?.label || value || '-', t),
      },
      { title: t('Status'), dataIndex: 'status', render: (value: string) => statusTag(t, value) },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        render: (value: boolean) => <Switch checked={value} disabled size="small" />,
      },
      {
        title: t('Actions'),
        width: 260,
        render: (_, record) => (
          <Space size={12} wrap>
            <a onClick={() => openCollections(record)}>{t('Configure')}</a>
            {record.key !== 'main' ? (
              <a onClick={() => openForm('edit', record.type || '', record)}>{t('Edit')}</a>
            ) : null}
            {record.key !== 'main' ? <a onClick={() => handleDelete(record.key)}>{t('Delete')}</a> : null}
          </Space>
        ),
      },
    ],
    [handleDelete, openCollections, openForm, plugin, t],
  );

  const createItems = useMemo(
    () =>
      dataSourceTypes.length
        ? dataSourceTypes.map((type) => ({
            key: type.name || '',
            label: compileLegacyTemplate(type.label || type.name, t),
          }))
        : [
            {
              key: '__empty__',
              label: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      {t('No external data source plugin installed')}
                      <br />
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={
                          ctx.api.auth.locale === 'zh-CN'
                            ? 'https://docs-cn.nocobase.com/handbook/data-source-manager'
                            : 'https://docs.nocobase.com/handbook/data-source-manager'
                        }
                      >
                        {t('View documentation')}
                      </a>
                    </span>
                  }
                />
              ),
            },
          ],
    [ctx.api.auth.locale, dataSourceTypes, t],
  );

  return (
    <Card variant="borderless">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            {t('Refresh')}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            disabled={!selectedRowKeys.length}
            onClick={() => handleDelete(selectedRowKeys)}
          >
            {t('Delete')}
          </Button>
          <Dropdown
            menu={{
              items: createItems,
              onClick: ({ key }) => {
                if (key !== '__empty__') {
                  openForm('create', key);
                }
              },
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              {t('Add new')} <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </div>
      <Table<DataSourceRecord>
        rowKey="key"
        loading={request.loading}
        dataSource={records}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          getCheckboxProps: (record) => ({ disabled: record.key === 'main' }),
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          current: page,
          pageSize,
          total: request.data?.total,
          onChange(nextPage, nextPageSize) {
            if (nextPageSize !== pageSize) {
              setPageSize(nextPageSize);
              setPage(1);
              return;
            }
            setPage(nextPage);
          },
        }}
      />
    </Card>
  );
}
