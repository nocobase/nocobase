/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CopyOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
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
  Switch,
  Table,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';
import {
  AgentGatewayContext,
  JsonPreview,
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
    currentConcurrency?: number | null;
    daemonVersion?: string | null;
    heartbeatAt?: string | null;
    hostInfo?: Record<string, unknown>;
  };
  registeredAt?: string;
  lastHeartbeatAt?: string;
  disabledAt?: string | null;
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

interface SkillUploadFormValues {
  skillKey?: string;
  displayName?: string;
  versionLabel?: string;
}

interface SkillUploadResult {
  skillId?: string;
  skillKey?: string;
  skillVersionId: string;
  versionLabel?: string;
  status?: string;
  idempotent?: boolean;
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.split(',').pop() || '' : result);
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

export default function AgentGatewaySettingsPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [form] = Form.useForm<InvitationFormValues>();
  const [skillUploadForm] = Form.useForm<SkillUploadFormValues>();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [invitationResult, setInvitationResult] = useState<InvitationResult | null>(null);
  const [skillUploadOpen, setSkillUploadOpen] = useState(false);
  const [skillZipContentBase64, setSkillZipContentBase64] = useState('');
  const [skillUploadResult, setSkillUploadResult] = useState<SkillUploadResult | null>(null);

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
        url: `agent-gateway/nodes:update/${encodeURIComponent(node.id)}`,
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

  const uploadSkillVersionRequest = useRequest(
    async (values: SkillUploadFormValues & { contentBase64: string }) => {
      const response = await ctx.api.request<SkillUploadResult>({
        url: 'agent-gateway/skill-versions:upload-zip',
        method: 'post',
        data: { ...values },
      });
      return getRequiredResponseData(response, t('Failed to upload skill'));
    },
    {
      manual: true,
      onSuccess(result) {
        setSkillUploadResult(result);
        ctx.message?.success(t('Skill uploaded'));
      },
      onError() {
        ctx.message?.error(t('Failed to upload skill'));
      },
    },
  );

  const closeInvitationModal = useCallback(() => {
    setInvitationOpen(false);
    setInvitationResult(null);
    form.resetFields();
  }, [form]);

  const closeSkillUploadModal = useCallback(() => {
    setSkillUploadOpen(false);
    setSkillZipContentBase64('');
    setSkillUploadResult(null);
    skillUploadForm.resetFields();
  }, [skillUploadForm]);

  const submitInvitation = useCallback(async () => {
    const values = await form.validateFields();
    createInvitationRequest.run(values);
  }, [createInvitationRequest, form]);

  const submitSkillUpload = useCallback(async () => {
    const values = await skillUploadForm.validateFields();
    if (!skillZipContentBase64) {
      ctx.message?.error(t('Skill ZIP file is required'));
      return;
    }
    uploadSkillVersionRequest.run({
      ...values,
      contentBase64: skillZipContentBase64,
    });
  }, [ctx.message, skillUploadForm, skillZipContentBase64, t, uploadSkillVersionRequest]);

  const handleSkillZipBeforeUpload = useCallback<NonNullable<UploadProps['beforeUpload']>>(
    async (file) => {
      if (!file) {
        setSkillZipContentBase64('');
        return false;
      }
      try {
        setSkillZipContentBase64(await readFileAsBase64(file));
      } catch {
        setSkillZipContentBase64('');
        ctx.message?.error(t('Failed to read skill ZIP file'));
      }
      return false;
    },
    [ctx.message, t],
  );

  const handleSkillZipRemove = useCallback(() => {
    setSkillZipContentBase64('');
    return true;
  }, []);

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
      {
        title: t('Enabled'),
        key: 'enabled',
        width: 120,
        render: (_value: unknown, record) => (
          <Switch
            aria-label={t('Toggle node status')}
            checked={(record.status || 'active') !== 'disabled'}
            checkedChildren={t('Enabled')}
            unCheckedChildren={t('Disabled')}
            loading={updateNodeStatusRequest.loading}
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
        render: (value: Record<string, unknown> | undefined) => <JsonPreview value={value} />,
      },
    ],
    [t],
  );

  return (
    <section aria-label={t('Agent Gateway Nodes')}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('Agent Gateway')}
          </Typography.Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refreshNodes}>
              {t('Refresh')}
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setSkillUploadOpen(true)}>
              {t('Upload skill')}
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
            <Descriptions.Item label={t('Disabled at')} span={2}>
              {formatDateTime(selectedNode.disabledAt || undefined)}
            </Descriptions.Item>
            <Descriptions.Item label={t('Capabilities')} span={2}>
              <JsonPreview value={selectedNode.capabilitiesJson} />
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

      <Modal
        title={t('Upload skill')}
        open={skillUploadOpen}
        onCancel={closeSkillUploadModal}
        onOk={submitSkillUpload}
        confirmLoading={uploadSkillVersionRequest.loading}
        okText={t('Upload')}
        cancelText={t('Close')}
        destroyOnClose
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Form<SkillUploadFormValues> form={skillUploadForm} layout="vertical">
            <Form.Item
              label={t('Skill key')}
              name="skillKey"
              rules={[{ required: true, message: t('Skill key is required') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label={t('Display name')} name="displayName">
              <Input />
            </Form.Item>
            <Form.Item
              label={t('Version label')}
              name="versionLabel"
              rules={[{ required: true, message: t('Version label is required') }]}
            >
              <Input placeholder="v1" />
            </Form.Item>
            <Form.Item label={t('Skill ZIP file')} required>
              <Upload
                accept=".zip,application/zip"
                beforeUpload={handleSkillZipBeforeUpload}
                maxCount={1}
                onRemove={handleSkillZipRemove}
              >
                <Button icon={<UploadOutlined />}>{t('Select ZIP')}</Button>
              </Upload>
            </Form.Item>
          </Form>

          {skillUploadResult ? (
            <Alert
              type="success"
              showIcon
              message={t('Skill uploaded')}
              description={
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Typography.Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ margin: 0 }}>
                    {skillUploadResult.skillVersionId}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">
                    {[skillUploadResult.skillKey, skillUploadResult.versionLabel, skillUploadResult.status]
                      .filter(Boolean)
                      .join(' / ')}
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
