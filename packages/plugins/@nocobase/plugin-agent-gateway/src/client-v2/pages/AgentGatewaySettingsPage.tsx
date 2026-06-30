/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CopyOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';

interface AgentGatewayApiResponse<T> {
  data?: {
    data?: T;
  };
}

interface AgentGatewayApi {
  request<T>(config: {
    url: string;
    method: 'get' | 'post';
    data?: Record<string, unknown>;
  }): Promise<AgentGatewayApiResponse<T>>;
}

interface AgentGatewayContext {
  api: AgentGatewayApi;
  message?: {
    success(content: string): void;
    error(content: string): void;
  };
}

interface NodeRecord {
  id: string;
  nodeKey: string;
  displayName?: string;
  status?: string;
  tokenLast4?: string;
  capabilitiesJson?: Record<string, unknown>;
  metadataJson?: {
    currentConcurrency?: number | null;
    daemonVersion?: string | null;
    heartbeatAt?: string | null;
    hostInfo?: Record<string, unknown>;
  };
  registeredAt?: string;
  lastHeartbeatAt?: string;
}

interface AgentProfileRecord {
  id: string;
  profileKey: string;
  displayName?: string;
  agentType?: string;
  driver?: string;
  status?: string;
  capabilitiesJson?: Record<string, unknown>;
  runtimeSnapshotJson?: Record<string, unknown>;
}

interface InvitationFormValues {
  expectedNodeKey?: string;
  expiresInSeconds?: number;
  serverUrl?: string;
}

interface InvitationResult {
  invitationId: string;
  invitationKey?: string;
  registerCommand: string;
  expiresAt: string;
  tokenLast4?: string;
}

function getResponseData<T>(response: AgentGatewayApiResponse<T>, fallback: T) {
  return response.data?.data ?? fallback;
}

function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatJson(value?: Record<string, unknown>) {
  if (!value || Object.keys(value).length === 0) {
    return '-';
  }

  return JSON.stringify(value, null, 2);
}

function statusTag(value?: string) {
  const status = value || 'unknown';
  const colorByStatus: Record<string, string> = {
    active: 'green',
    inactive: 'default',
    disabled: 'red',
    pending: 'orange',
  };

  return <Tag color={colorByStatus[status] || 'default'}>{status}</Tag>;
}

export default function AgentGatewaySettingsPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [form] = Form.useForm<InvitationFormValues>();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [invitationResult, setInvitationResult] = useState<InvitationResult | null>(null);

  const nodesRequest = useRequest(
    async () => {
      const response = await ctx.api.request<NodeRecord[]>({
        url: 'agent-gateway/nodes:list',
        method: 'get',
      });
      return getResponseData(response, []);
    },
    {
      onSuccess(records) {
        if (!selectedNodeId && records[0]) {
          setSelectedNodeId(records[0].id);
        }
      },
    },
  );

  const selectedNode = useMemo(
    () => nodesRequest.data?.find((node) => node.id === selectedNodeId),
    [nodesRequest.data, selectedNodeId],
  );

  const profilesRequest = useRequest(
    async () => {
      if (!selectedNodeId) {
        return [];
      }

      const response = await ctx.api.request<AgentProfileRecord[]>({
        url: `agent-gateway/nodes/${selectedNodeId}/profiles:list`,
        method: 'get',
      });
      return getResponseData(response, []);
    },
    {
      refreshDeps: [selectedNodeId],
    },
  );

  const createInvitationRequest = useRequest(
    async (values: InvitationFormValues) => {
      const response = await ctx.api.request<InvitationResult>({
        url: 'agent-gateway/node-invitations:create',
        method: 'post',
        data: values as Record<string, unknown>,
      });
      return getResponseData(response, null as unknown as InvitationResult);
    },
    {
      manual: true,
      onSuccess(result) {
        setInvitationResult(result);
        ctx.message?.success(t('Invitation created'));
      },
      onError() {
        ctx.message?.error(t('Failed to create invitation'));
      },
    },
  );

  const closeInvitationModal = useCallback(() => {
    setInvitationOpen(false);
    setInvitationResult(null);
    form.resetFields();
  }, [form]);

  const submitInvitation = useCallback(async () => {
    const values = await form.validateFields();
    createInvitationRequest.run(values);
  }, [createInvitationRequest, form]);

  const refreshNodes = useCallback(() => {
    nodesRequest.refresh();
    profilesRequest.refresh();
  }, [nodesRequest, profilesRequest]);

  const nodeColumns = useMemo<ColumnsType<NodeRecord>>(
    () => [
      {
        title: t('Node key'),
        dataIndex: 'nodeKey',
        key: 'nodeKey',
      },
      {
        title: t('Display name'),
        dataIndex: 'displayName',
        key: 'displayName',
        render: (value: string | undefined, record) => value || record.nodeKey,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        render: (value: string | undefined) => statusTag(value),
      },
      {
        title: t('Current concurrency'),
        dataIndex: ['metadataJson', 'currentConcurrency'],
        key: 'currentConcurrency',
        render: (value: number | null | undefined) => value ?? '-',
      },
      {
        title: t('Token fingerprint'),
        dataIndex: 'tokenLast4',
        key: 'tokenLast4',
        render: (value: string | undefined) => (value ? `...${value}` : '-'),
      },
      {
        title: t('Last heartbeat'),
        dataIndex: 'lastHeartbeatAt',
        key: 'lastHeartbeatAt',
        render: (value: string | undefined) => formatDateTime(value),
      },
    ],
    [t],
  );

  const profileColumns = useMemo<ColumnsType<AgentProfileRecord>>(
    () => [
      {
        title: t('Profile key'),
        dataIndex: 'profileKey',
        key: 'profileKey',
      },
      {
        title: t('Display name'),
        dataIndex: 'displayName',
        key: 'displayName',
        render: (value: string | undefined, record) => value || record.profileKey,
      },
      {
        title: t('Agent type'),
        dataIndex: 'agentType',
        key: 'agentType',
      },
      {
        title: t('Driver'),
        dataIndex: 'driver',
        key: 'driver',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        render: (value: string | undefined) => statusTag(value),
      },
      {
        title: t('Capabilities'),
        dataIndex: 'capabilitiesJson',
        key: 'capabilitiesJson',
        render: (value: Record<string, unknown> | undefined) => (
          <Typography.Text code style={{ whiteSpace: 'pre-wrap' }}>
            {formatJson(value)}
          </Typography.Text>
        ),
      },
    ],
    [t],
  );

  return (
    <section aria-label={t('Agent Gateway')}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('Agent Gateway')}
          </Typography.Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refreshNodes}>
              {t('Refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setInvitationOpen(true)}>
              {t('Create invitation')}
            </Button>
          </Space>
        </Space>

        <Table<NodeRecord>
          columns={nodeColumns}
          dataSource={nodesRequest.data || []}
          loading={nodesRequest.loading}
          rowKey="id"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No nodes yet')} /> }}
          pagination={false}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedNodeId ? [selectedNodeId] : [],
            onChange: (keys) => setSelectedNodeId(String(keys[0] || '')),
          }}
          onRow={(record) => ({
            onClick: () => setSelectedNodeId(record.id),
          })}
        />

        {selectedNode ? (
          <Descriptions bordered size="small" column={2} title={t('Node detail')}>
            <Descriptions.Item label={t('Node key')}>{selectedNode.nodeKey}</Descriptions.Item>
            <Descriptions.Item label={t('Status')}>{statusTag(selectedNode.status)}</Descriptions.Item>
            <Descriptions.Item label={t('Daemon version')}>
              {selectedNode.metadataJson?.daemonVersion || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('Registered at')}>
              {formatDateTime(selectedNode.registeredAt)}
            </Descriptions.Item>
            <Descriptions.Item label={t('Last heartbeat')} span={2}>
              {formatDateTime(selectedNode.lastHeartbeatAt)}
            </Descriptions.Item>
            <Descriptions.Item label={t('Capabilities')} span={2}>
              <Typography.Text code style={{ whiteSpace: 'pre-wrap' }}>
                {formatJson(selectedNode.capabilitiesJson)}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        ) : null}

        <Table<AgentProfileRecord>
          columns={profileColumns}
          dataSource={profilesRequest.data || []}
          loading={profilesRequest.loading}
          rowKey="id"
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No agent profiles yet')} />,
          }}
          pagination={false}
          title={() => t('Agent profiles')}
        />
      </Space>

      <Modal
        title={t('Create invitation')}
        open={invitationOpen}
        onCancel={closeInvitationModal}
        onOk={submitInvitation}
        confirmLoading={createInvitationRequest.loading}
        okText={t('Create')}
        cancelText={t('Close')}
        destroyOnClose
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Form<InvitationFormValues>
            form={form}
            layout="vertical"
            initialValues={{
              expiresInSeconds: 86400,
            }}
          >
            <Form.Item label={t('Expected node key')} name="expectedNodeKey">
              <Input placeholder="node-1" />
            </Form.Item>
            <Form.Item
              label={t('Expires in seconds')}
              name="expiresInSeconds"
              rules={[{ type: 'number', min: 60, message: t('Expiration must be at least 60 seconds') }]}
            >
              <InputNumber min={60} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('Server URL')} name="serverUrl">
              <Input placeholder="https://nocobase.example.test" />
            </Form.Item>
          </Form>

          {invitationResult ? (
            <Alert
              type="success"
              showIcon
              message={t('Register command')}
              description={
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Typography.Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ margin: 0 }}>
                    {invitationResult.registerCommand}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">
                    {t('Expires at')}: {formatDateTime(invitationResult.expiresAt)}
                  </Typography.Text>
                </Space>
              }
            />
          ) : null}
        </Space>
      </Modal>
    </section>
  );
}
