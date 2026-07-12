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
  Card,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';
import {
  AgentGatewayContext,
  getRequiredResponseData,
  getResponseData,
  formatDateTime,
  statusTag,
} from './AgentGatewayPageUtils';

interface NodeRecord {
  id: string;
  nodeKey: string;
  displayName?: string;
  status?: string;
  tokenLast4?: string;
  capabilitiesJson?: Record<string, unknown>;
  metadataJson?: {
    daemonVersion?: string | null;
    heartbeatAt?: string | null;
    hostInfo?: Record<string, unknown>;
  };
  registeredAt?: string;
  lastHeartbeatAt?: string;
  disabledAt?: string | null;
  online?: boolean;
  onlineReason?: string | null;
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
}

interface InvitationResult {
  invitationId: string;
  invitationKey?: string;
  bootstrapCommand?: string;
  registerCommand: string;
  expiresAt: string;
  tokenLast4?: string;
}

const DAEMON_RESTART_COMMAND =
  'systemctl restart agent-gateway-daemon.service || systemctl --user restart agent-gateway-daemon.service || tmux attach -t agent-gateway-daemon';

const PROFILE_CAPABILITY_KEYS = [
  'terminalOutput',
  'resumeSession',
  'artifacts',
  'interrupt',
  'terminate',
  'structuredEvents',
] as const;

function renderProfileCapabilities(capabilities: Record<string, unknown> | undefined, t: ReturnType<typeof useT>) {
  const enabledCapabilities = PROFILE_CAPABILITY_KEYS.filter((key) => capabilities?.[key] === true);
  if (!enabledCapabilities.length) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }
  return (
    <Space size={[4, 4]} wrap>
      {enabledCapabilities.map((key) => (
        <Tag key={key}>{t(key)}</Tag>
      ))}
    </Space>
  );
}

function getConnectionText(node: Pick<NodeRecord, 'online' | 'onlineReason' | 'status'>, t: ReturnType<typeof useT>) {
  if (node.online === true) {
    return t('Online');
  }

  if (node.onlineReason === 'heartbeat-stale') {
    return t('Offline - stale heartbeat');
  }
  if (node.onlineReason === 'missing-heartbeat') {
    return t('Offline - no heartbeat');
  }
  if (node.onlineReason === 'node-disabled' || node.status === 'disabled') {
    return t('Offline - disabled');
  }

  return t('Offline');
}

function renderNodeConnection(node: NodeRecord, t: ReturnType<typeof useT>) {
  const color = node.online === true ? 'green' : node.status === 'disabled' ? 'red' : 'orange';
  return <Tag color={color}>{getConnectionText(node, t)}</Tag>;
}

function renderEnabledState(status: string | undefined, t: ReturnType<typeof useT>) {
  const enabled = (status || 'active') !== 'disabled';
  return <Tag color={enabled ? 'green' : 'red'}>{enabled ? t('Enabled') : t('Disabled')}</Tag>;
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
        url: 'agentGatewayApi:listNodes',
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
        url: `agentGatewayApi:listNodeProfiles/${selectedNodeId}`,
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
        url: 'agentGatewayApi:createNodeInvitation',
        method: 'post',
        data: values as Record<string, unknown>,
      });
      return getRequiredResponseData(response, t('Failed to create invitation'));
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

  const updateNodeStatusRequest = useRequest(
    async (node: NodeRecord, enabled: boolean) => {
      const response = await ctx.api.request<NodeRecord>({
        url: `agentGatewayApi:updateNode/${encodeURIComponent(node.id)}`,
        method: 'post',
        data: {
          status: enabled ? 'active' : 'disabled',
        },
      });
      return getRequiredResponseData(response, t('Failed to update node status'));
    },
    {
      manual: true,
      onSuccess() {
        nodesRequest.refresh();
        profilesRequest.refresh();
      },
      onError() {
        ctx.message?.error(t('Failed to update node status'));
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
        title: t('Enabled state'),
        dataIndex: 'status',
        key: 'status',
        render: (value: string | undefined) => renderEnabledState(value, t),
      },
      {
        title: t('Connection'),
        key: 'connection',
        render: (_value: unknown, record) => renderNodeConnection(record, t),
      },
      {
        title: t('Last heartbeat'),
        dataIndex: 'lastHeartbeatAt',
        key: 'lastHeartbeatAt',
        render: (value: string | undefined) => formatDateTime(value),
      },
      {
        title: t('Enabled'),
        key: 'enabled',
        width: 120,
        render: (_value: unknown, record) => (
          <Switch
            aria-label={t('Toggle node status')}
            checked={(record.status || 'active') !== 'disabled'}
            loading={updateNodeStatusRequest.loading}
            size="small"
            onChange={(checked) => updateNodeStatusRequest.run(record, checked)}
          />
        ),
      },
    ],
    [t, updateNodeStatusRequest],
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
        render: (value: Record<string, unknown> | undefined) => renderProfileCapabilities(value, t),
      },
    ],
    [t],
  );

  return (
    <section aria-label={t('Agent Gateway Nodes')}>
      <Card variant="borderless">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Flex justify="flex-end">
            <Space>
              <Button icon={<ReloadOutlined />} onClick={refreshNodes}>
                {t('Refresh')}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setInvitationOpen(true)}>
                {t('Create invitation')}
              </Button>
            </Space>
          </Flex>

          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Table<NodeRecord>
              columns={nodeColumns}
              dataSource={nodesRequest.data || []}
              loading={nodesRequest.loading}
              rowKey="id"
              locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No nodes yet')} />,
              }}
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
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Descriptions bordered size="small" column={2} title={t('Node detail')}>
                  <Descriptions.Item label={t('Node key')}>{selectedNode.nodeKey}</Descriptions.Item>
                  <Descriptions.Item label={t('Enabled state')}>
                    {renderEnabledState(selectedNode.status, t)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Connection')}>{renderNodeConnection(selectedNode, t)}</Descriptions.Item>
                  <Descriptions.Item label={t('Last heartbeat')}>
                    {formatDateTime(selectedNode.lastHeartbeatAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Daemon version')}>
                    {selectedNode.metadataJson?.daemonVersion || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Registered at')}>
                    {formatDateTime(selectedNode.registeredAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Disabled at')} span={2}>
                    {formatDateTime(selectedNode.disabledAt || undefined)}
                  </Descriptions.Item>
                </Descriptions>
                {selectedNode.online === false ? (
                  <Alert
                    type="warning"
                    showIcon
                    message={t('Daemon is offline')}
                    description={
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Typography.Text>
                          {t('Restart the Agent Gateway daemon service on this node or rerun the bootstrap command.')}
                        </Typography.Text>
                        <Typography.Paragraph copyable style={{ margin: 0 }}>
                          {DAEMON_RESTART_COMMAND}
                        </Typography.Paragraph>
                      </Space>
                    }
                  />
                ) : null}
              </Space>
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
        </Space>
      </Card>

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
          <Form<InvitationFormValues> form={form} layout="vertical">
            <Form.Item
              label={t('Node key')}
              name="expectedNodeKey"
              rules={[{ required: true, message: t('Node key is required') }]}
            >
              <Input placeholder="remote-196" />
            </Form.Item>
          </Form>

          {invitationResult ? (
            <Alert
              type="success"
              showIcon
              message={t('Bootstrap command')}
              description={
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Typography.Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ margin: 0 }}>
                    {invitationResult.bootstrapCommand || invitationResult.registerCommand}
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
