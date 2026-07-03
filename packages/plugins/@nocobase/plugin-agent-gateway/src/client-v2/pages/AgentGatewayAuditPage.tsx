/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Alert, Button, Empty, Form, Input, Select, Space, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { useT } from '../locale';
import {
  AgentGatewayContext,
  JsonPreview,
  JsonRecord,
  formatDateTime,
  getApiErrorMessage,
  getResponseData,
  statusTag,
} from './AgentGatewayPageUtils';

interface AuditRecord {
  id: string;
  action?: string;
  runId?: string | null;
  sessionId?: string | null;
  operatorId?: string | number | null;
  redactedPreview?: string | null;
  contentSize?: number | string | null;
  permissionKey?: string;
  resultStatus?: string;
  provider?: string | null;
  metadataJson?: JsonRecord;
  createdAt?: string;
}

interface AuditFilterFormValues {
  runId?: string;
  action?: string;
  resultStatus?: string;
}

const RESULT_STATUS_OPTIONS = ['accepted', 'denied', 'succeeded', 'failed'];
const ACTION_OPTIONS = [
  'dispatch',
  'resume',
  'message',
  'cancel',
  'interrupt',
  'terminate',
  'readRunDetails',
  'readTerminal',
  'readSessionMessages',
  'readArtifacts',
  'readRawLogs',
  'rawTerminalWrite',
  'rawTerminalWriteDenied',
];

export default function AgentGatewayAuditPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [form] = Form.useForm<AuditFilterFormValues>();
  const [filters, setFilters] = useState<AuditFilterFormValues>({});

  const auditRequest = useRequest(
    async () => {
      const response = await ctx.api.request<AuditRecord[]>({
        url: 'agent-gateway/audits:list',
        method: 'get',
        params: { ...filters },
      });
      return getResponseData(response, []);
    },
    {
      refreshDeps: [filters],
    },
  );

  const columns = useMemo<ColumnsType<AuditRecord>>(
    () => [
      {
        title: t('Created at'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string | undefined) => formatDateTime(value),
      },
      {
        title: t('Action'),
        dataIndex: 'action',
        key: 'action',
        width: 160,
      },
      {
        title: t('Result'),
        dataIndex: 'resultStatus',
        key: 'resultStatus',
        width: 120,
        render: (value: string | undefined) => statusTag(value),
      },
      {
        title: t('Permission'),
        dataIndex: 'permissionKey',
        key: 'permissionKey',
        width: 220,
      },
      {
        title: t('Run ID'),
        dataIndex: 'runId',
        key: 'runId',
        width: 260,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: t('Session ID'),
        dataIndex: 'sessionId',
        key: 'sessionId',
        width: 260,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: t('Preview'),
        dataIndex: 'redactedPreview',
        key: 'redactedPreview',
        render: (value: string | null | undefined) => (
          <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{value || '-'}</Typography.Paragraph>
        ),
      },
    ],
    [t],
  );

  const submitFilters = (values: AuditFilterFormValues) => {
    setFilters({
      runId: values.runId?.trim() || undefined,
      action: values.action,
      resultStatus: values.resultStatus,
    });
  };

  const resetFilters = () => {
    form.resetFields();
    setFilters({});
  };

  const errorMessage = auditRequest.error
    ? getApiErrorMessage(auditRequest.error, t('Failed to load audit records'))
    : '';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('Agent Gateway Audit')}
        </Typography.Title>
        <Tooltip title={t('Refresh audit')}>
          <Button
            aria-label={t('Refresh audit')}
            icon={<ReloadOutlined />}
            loading={auditRequest.loading}
            onClick={auditRequest.refresh}
          />
        </Tooltip>
      </Space>

      <Form form={form} layout="inline" onFinish={submitFilters}>
        <Form.Item label={t('Run ID')} name="runId">
          <Input allowClear placeholder={t('Filter by run ID')} style={{ width: 280 }} />
        </Form.Item>
        <Form.Item label={t('Action')} name="action">
          <Select
            allowClear
            options={ACTION_OPTIONS.map((value) => ({ label: value, value }))}
            style={{ width: 220 }}
          />
        </Form.Item>
        <Form.Item label={t('Result')} name="resultStatus">
          <Select
            allowClear
            options={RESULT_STATUS_OPTIONS.map((value) => ({ label: value, value }))}
            style={{ width: 160 }}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button htmlType="submit" icon={<SearchOutlined />} type="primary">
              {t('Search')}
            </Button>
            <Button onClick={resetFilters}>{t('Reset')}</Button>
          </Space>
        </Form.Item>
      </Form>

      {errorMessage ? <Alert type="warning" showIcon message={errorMessage} /> : null}

      <Table<AuditRecord>
        columns={columns}
        dataSource={auditRequest.data || []}
        expandable={{
          expandedRowRender: (record) => (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text strong>{t('Metadata')}</Typography.Text>
              <JsonPreview value={record.metadataJson} />
              <Typography.Text type="secondary">
                {t('Operator')}: {record.operatorId ?? '-'} / {t('Provider')}: {record.provider || '-'} /{' '}
                {t('Content size')}: {record.contentSize ?? '-'}
              </Typography.Text>
            </Space>
          ),
        }}
        loading={auditRequest.loading}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No audit records yet')} /> }}
        rowKey="id"
        scroll={{ x: 1280 }}
        size="small"
      />
    </Space>
  );
}
