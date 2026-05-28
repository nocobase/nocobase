/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReloadOutlined } from '@ant-design/icons';
import {
  CollectionFilter,
  DEFAULT_PAGE_SIZE,
  DrawerFormLayout,
  ExtendCollectionsProvider,
  Table,
} from '@nocobase/client-v2';
import { useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Card, Flex, Form, Input, Space, Tag, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import messageLogCollection from '../../collections/messageLog';
import { COLLECTION_NAME } from '../../constant';
import { useNotificationTranslation, useT } from '../locale';
import PluginNotificationManagerClientV2 from '../plugin';
import { getNotificationTypeOptions, withResolvedNotificationTypeEnum } from '../utils/notificationTypeOptions';

// Mirror v1's `nonfilterable: ['receiver', 'reason']` on its `Filter.Action`
// schema. `receiver` isn't on this collection so it would be a no-op; `reason`
// is the one that actually subtracts.
const LOGS_NONFILTERABLE_FIELD_NAMES = ['receiver', 'reason'];

type LogRecord = {
  id: string;
  channelName?: string;
  channelTitle?: string;
  notificationType?: string;
  triggerFrom?: string;
  status?: 'success' | 'failure';
  message?: any;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
};

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

function formatJson(value: any): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDate(value?: string): string {
  if (!value) return '';
  const d = dayjs(value);
  return d.isValid() ? d.format(DATE_FORMAT) : value;
}

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records: LogRecord[] = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const meta = body?.meta || payload?.meta || {};
  return {
    records,
    total: meta.count || meta.total || records.length,
  };
}

function LogDetailDrawer({ record }: { record: LogRecord }) {
  const { t } = useNotificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const plugin = ctx.app.pm.get(PluginNotificationManagerClientV2);
  const isFailure = record.status === 'failure';

  const notificationTypeLabel = record.notificationType
    ? compileT(plugin?.channelTypes.get(record.notificationType)?.title || record.notificationType)
    : '';

  return (
    <DrawerFormLayout title={t('Log detail')} footer={<></>}>
      <Form layout="vertical">
        <Form.Item label={t('ID')}>
          <Input value={record.id} disabled />
        </Form.Item>
        <Form.Item label={t('Channel name')}>
          <Typography.Text>{record.channelName}</Typography.Text>
        </Form.Item>
        <Form.Item label={t('Channel display name')}>
          <Typography.Text>{compileT(record.channelTitle || '')}</Typography.Text>
        </Form.Item>
        <Form.Item label={t('Notification type')}>
          {record.notificationType ? <Tag>{notificationTypeLabel}</Tag> : null}
        </Form.Item>
        <Form.Item label={t('Trigger from')}>
          <Typography.Text>{record.triggerFrom}</Typography.Text>
        </Form.Item>
        <Form.Item label={t('Status')}>
          {record.status === 'success' ? (
            <Tag color="green">{t('Success')}</Tag>
          ) : record.status === 'failure' ? (
            <Tag color="red">{t('Failure')}</Tag>
          ) : null}
        </Form.Item>
        <Form.Item label={t('Message')}>
          <Typography.Text>
            <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {formatJson(record.message)}
            </pre>
          </Typography.Text>
        </Form.Item>
        {isFailure ? (
          <Form.Item label={t('Failed reason')}>
            <Typography.Text>{record.reason}</Typography.Text>
          </Form.Item>
        ) : null}
        <Form.Item label={t('Created at')}>
          <Typography.Text>{formatDate(record.createdAt)}</Typography.Text>
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

function LogsPageInner() {
  const { t } = useNotificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const engine = useFlowEngine();
  const { token } = theme.useToken();
  const resource = useMemo(() => ctx.api.resource(COLLECTION_NAME.logs), [ctx.api]);
  const plugin = ctx.app.pm.get(PluginNotificationManagerClientV2);
  const filterCollection = useMemo(
    () => engine.context.dataSourceManager?.getDataSource?.('main')?.getCollection?.(COLLECTION_NAME.logs),
    [engine],
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filterPayload, setFilterPayload] = useState<any>(undefined);

  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        sort: ['-createdAt'],
        ...(filterPayload ? { filter: filterPayload } : {}),
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page, pageSize, filterPayload],
    },
  );

  const handlePaginationChange = useMemoizedFn((nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }
    setPage(nextPage);
  });

  const openDetail = useMemoizedFn((record: LogRecord) => {
    ctx.viewer.drawer({
      width: '50%',
      closable: true,
      content: () => <LogDetailDrawer record={record} />,
    });
  });

  const channelTypeLabelOf = useMemoizedFn((type?: string) => {
    if (!type) return '';
    const found = plugin?.channelTypes.get(type);
    return compileT(found?.title || type);
  });

  const columns = useMemo<ColumnsType<LogRecord>>(
    () => [
      {
        title: t('Created at'),
        dataIndex: 'createdAt',
        width: 180,
        render: (value: string) => formatDate(value),
      },
      {
        title: t('Trigger from'),
        dataIndex: 'triggerFrom',
        ellipsis: true,
        width: 160,
      },
      {
        title: t('Channel display name'),
        dataIndex: 'channelTitle',
        ellipsis: true,
        width: 200,
        render: (value: string) => (value ? compileT(value) : ''),
      },
      {
        title: t('Notification type'),
        dataIndex: 'notificationType',
        render: (value: string) => (value ? <Tag>{channelTypeLabelOf(value)}</Tag> : null),
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        width: 100,
        render: (value: 'success' | 'failure') =>
          value === 'success' ? (
            <Tag color="green">{t('Success')}</Tag>
          ) : value === 'failure' ? (
            <Tag color="red">{t('Failure')}</Tag>
          ) : null,
      },
      {
        title: t('Failed reason'),
        dataIndex: 'reason',
        ellipsis: true,
        width: 200,
      },
      {
        title: t('Actions'),
        width: 100,
        render: (_, record) => (
          <Space>
            <a onClick={() => openDetail(record)}>{t('View')}</a>
          </Space>
        ),
      },
    ],
    [channelTypeLabelOf, compileT, openDetail, t],
  );

  return (
    <Card variant="borderless">
      <Flex justify="space-between" style={{ marginBottom: token.margin }}>
        <CollectionFilter
          collection={filterCollection}
          nonfilterableFieldNames={LOGS_NONFILTERABLE_FIELD_NAMES}
          onChange={setFilterPayload}
          t={compileT}
        />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
            {t('Refresh')}
          </Button>
        </Space>
      </Flex>
      <Table<LogRecord>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data?.records || []}
        showIndex={false}
        pagination={{
          current: page,
          pageSize,
          total: data?.total || 0,
          onChange: handlePaginationChange,
        }}
      />
    </Card>
  );
}

export default function LogsPage() {
  const ctx = useFlowContext();
  const compileT = useT();
  const plugin = ctx.app.pm.get(PluginNotificationManagerClientV2);
  const collections = useMemo(() => {
    const options = getNotificationTypeOptions(plugin, compileT);
    return [withResolvedNotificationTypeEnum(messageLogCollection, options)];
  }, [plugin, compileT]);
  return (
    <ExtendCollectionsProvider collections={collections}>
      <LogsPageInner />
    </ExtendCollectionsProvider>
  );
}
