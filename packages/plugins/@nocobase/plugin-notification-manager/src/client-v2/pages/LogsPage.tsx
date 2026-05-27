/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReloadOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, DrawerFormLayout, Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Card, Form, Input, Space, Tag, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { COLLECTION_NAME } from '../../constant';
import { useNotificationTranslation, useT } from '../locale';
import PluginNotificationManagerClientV2 from '../plugin';

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
  const isFailure = record.status === 'failure';

  return (
    <DrawerFormLayout title={t('Log detail')} footer={null}>
      <Form layout="vertical">
        <Form.Item label={t('ID')}>
          <Input value={record.id} disabled />
        </Form.Item>
        <Form.Item label={t('Channel name')}>
          <Input value={record.channelName} disabled />
        </Form.Item>
        <Form.Item label={t('Channel display name')}>
          <Input value={record.channelTitle} disabled />
        </Form.Item>
        <Form.Item label={t('Notification type')}>
          <Input value={compileT(record.notificationType || '')} disabled />
        </Form.Item>
        <Form.Item label={t('Trigger from')}>
          <Input value={record.triggerFrom} disabled />
        </Form.Item>
        <Form.Item label={t('Status')}>
          {record.status === 'success' ? (
            <Tag color="green">{t('Success')}</Tag>
          ) : record.status === 'failure' ? (
            <Tag color="red">{t('Failure')}</Tag>
          ) : null}
        </Form.Item>
        <Form.Item label={t('Message')}>
          <Input.TextArea value={formatJson(record.message)} autoSize={{ minRows: 5 }} disabled />
        </Form.Item>
        {isFailure ? (
          <Form.Item label={t('Failed reason')}>
            <Input.TextArea value={record.reason} autoSize={{ minRows: 2 }} disabled />
          </Form.Item>
        ) : null}
        <Form.Item label={t('Created at')}>
          <Input value={formatDate(record.createdAt)} disabled />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

export default function LogsPage() {
  const { t } = useNotificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const resource = useMemo(() => ctx.api.resource(COLLECTION_NAME.logs), [ctx.api]);
  const plugin = ctx.app.pm.get(PluginNotificationManagerClientV2);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        sort: ['-createdAt'],
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page, pageSize],
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: token.marginSM,
          marginBottom: token.margin,
        }}
      >
        <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
          {t('Refresh')}
        </Button>
      </div>
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
