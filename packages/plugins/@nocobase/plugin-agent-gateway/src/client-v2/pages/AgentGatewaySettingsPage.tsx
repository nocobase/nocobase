/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CopyOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
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
  Tag,
  Tooltip,
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

interface PromptTemplateRecord {
  id: string;
  templateKey: string;
  displayName?: string;
  description?: string;
  status?: string;
  templateText?: string;
}

interface PromptTemplateFormValues {
  templateKey: string;
  displayName?: string;
  description?: string;
  templateText: string;
}

interface PromptPreviewFormValues {
  collectionName: string;
  recordId: string;
}

interface PromptPreviewResult {
  templateId: string | null;
  templateKey?: string;
  renderedPrompt: string;
  variables?: Array<{
    expression: string;
    value: string;
  }>;
}

function getResponseData<T>(response: AgentGatewayApiResponse<T>, fallback: T) {
  return response.data?.data ?? fallback;
}

function getRequiredResponseData<T>(response: AgentGatewayApiResponse<T>, message: string) {
  const data = response.data?.data;
  if (data === undefined || data === null) {
    throw new Error(message);
  }
  return data;
}

function getObjectRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const response = getObjectRecord(getObjectRecord(error).response);
  const data = getObjectRecord(response.data);
  const errors = Array.isArray(data.errors) ? data.errors : [];
  const firstError = getObjectRecord(errors[0]);
  const message = firstError.message;
  if (typeof message === 'string' && message) {
    return message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
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
  const [templateForm] = Form.useForm<PromptTemplateFormValues>();
  const [previewForm] = Form.useForm<PromptPreviewFormValues>();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [invitationResult, setInvitationResult] = useState<InvitationResult | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplateRecord | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<PromptTemplateRecord | null>(null);
  const [previewResult, setPreviewResult] = useState<PromptPreviewResult | null>(null);
  const [previewError, setPreviewError] = useState('');

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

  const templatesRequest = useRequest(async () => {
    const response = await ctx.api.request<PromptTemplateRecord[]>({
      url: 'agent-gateway/prompt-templates:list',
      method: 'get',
    });
    return getResponseData(response, []);
  });

  const saveTemplateRequest = useRequest(
    async (values: PromptTemplateFormValues) => {
      const payload = {
        templateKey: values.templateKey,
        displayName: values.displayName,
        description: values.description,
        templateText: values.templateText,
        status: editingTemplate?.status || 'active',
      };

      if (editingTemplate) {
        const response = await ctx.api.request<PromptTemplateRecord>({
          url: `agent-gateway/prompt-templates:update/${encodeURIComponent(editingTemplate.id)}`,
          method: 'post',
          data: payload,
        });
        return getRequiredResponseData(response, t('Failed to save template'));
      }

      const response = await ctx.api.request<PromptTemplateRecord>({
        url: 'agent-gateway/prompt-templates:create',
        method: 'post',
        data: payload,
      });
      return getRequiredResponseData(response, t('Failed to save template'));
    },
    {
      manual: true,
      onSuccess() {
        setTemplateModalOpen(false);
        setEditingTemplate(null);
        templateForm.resetFields();
        templatesRequest.refresh();
        ctx.message?.success(t('Template saved'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to save template')));
      },
    },
  );

  const updateTemplateStatusRequest = useRequest(
    async (template: PromptTemplateRecord, enabled: boolean) => {
      const response = await ctx.api.request<PromptTemplateRecord>({
        url: `agent-gateway/prompt-templates:update/${encodeURIComponent(template.id)}`,
        method: 'post',
        data: {
          status: enabled ? 'active' : 'disabled',
        },
      });
      return getRequiredResponseData(response, t('Failed to update template status'));
    },
    {
      manual: true,
      onSuccess() {
        templatesRequest.refresh();
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to update template status')));
      },
    },
  );

  const previewTemplateRequest = useRequest(
    async (values: PromptPreviewFormValues) => {
      if (!previewTemplate) {
        throw new Error(t('No template selected'));
      }

      const response = await ctx.api.request<PromptPreviewResult>({
        url: 'agent-gateway/prompt-templates:preview',
        method: 'post',
        data: {
          templateId: previewTemplate.id,
          collectionName: values.collectionName,
          recordId: values.recordId,
        },
      });
      return getRequiredResponseData(response, t('Preview failed'));
    },
    {
      manual: true,
      onSuccess(result) {
        setPreviewError('');
        setPreviewResult(result);
      },
      onError(error) {
        setPreviewResult(null);
        setPreviewError(getApiErrorMessage(error, t('Preview failed')));
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

  const openCreateTemplateModal = useCallback(() => {
    setEditingTemplate(null);
    templateForm.resetFields();
    templateForm.setFieldsValue({
      templateKey: '',
      displayName: '',
      description: '',
      templateText: '',
    });
    setTemplateModalOpen(true);
  }, [templateForm]);

  const openEditTemplateModal = useCallback(
    (template: PromptTemplateRecord) => {
      setEditingTemplate(template);
      templateForm.setFieldsValue({
        templateKey: template.templateKey,
        displayName: template.displayName,
        description: template.description,
        templateText: template.templateText || '',
      });
      setTemplateModalOpen(true);
    },
    [templateForm],
  );

  const closeTemplateModal = useCallback(() => {
    setTemplateModalOpen(false);
    setEditingTemplate(null);
    templateForm.resetFields();
  }, [templateForm]);

  const submitTemplate = useCallback(async () => {
    const values = await templateForm.validateFields();
    saveTemplateRequest.run(values);
  }, [saveTemplateRequest, templateForm]);

  const openPreviewModal = useCallback(
    (template: PromptTemplateRecord) => {
      setPreviewTemplate(template);
      setPreviewResult(null);
      setPreviewError('');
      previewForm.resetFields();
      setPreviewModalOpen(true);
    },
    [previewForm],
  );

  const closePreviewModal = useCallback(() => {
    setPreviewModalOpen(false);
    setPreviewTemplate(null);
    setPreviewResult(null);
    setPreviewError('');
    previewForm.resetFields();
  }, [previewForm]);

  const submitPreview = useCallback(async () => {
    const values = await previewForm.validateFields();
    previewTemplateRequest.run(values);
  }, [previewForm, previewTemplateRequest]);

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

  const templateColumns = useMemo<ColumnsType<PromptTemplateRecord>>(
    () => [
      {
        title: t('Template key'),
        dataIndex: 'templateKey',
        key: 'templateKey',
      },
      {
        title: t('Display name'),
        dataIndex: 'displayName',
        key: 'displayName',
        render: (value: string | undefined, record) => value || record.templateKey,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        render: (value: string | undefined, record) => (
          <Switch
            aria-label={t('Toggle template status')}
            checked={(value || 'active') === 'active'}
            checkedChildren={t('Enabled')}
            unCheckedChildren={t('Disabled')}
            loading={updateTemplateStatusRequest.loading}
            onChange={(checked) => updateTemplateStatusRequest.run(record, checked)}
          />
        ),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 112,
        render: (_value: unknown, record) => (
          <Space>
            <Tooltip title={t('Edit template')}>
              <Button
                aria-label={t('Edit template')}
                icon={<EditOutlined />}
                onClick={() => openEditTemplateModal(record)}
              />
            </Tooltip>
            <Tooltip title={t('Preview template')}>
              <Button
                aria-label={t('Preview template')}
                icon={<EyeOutlined />}
                onClick={() => openPreviewModal(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [openEditTemplateModal, openPreviewModal, t, updateTemplateStatusRequest],
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

        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('Prompt Templates')}
          </Typography.Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={templatesRequest.refresh}>
              {t('Refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateTemplateModal}>
              {t('New template')}
            </Button>
          </Space>
        </Space>

        <Table<PromptTemplateRecord>
          columns={templateColumns}
          dataSource={templatesRequest.data || []}
          loading={templatesRequest.loading}
          rowKey="id"
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No prompt templates yet')} />,
          }}
          pagination={false}
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
        title={editingTemplate ? t('Edit template') : t('Create template')}
        open={templateModalOpen}
        onCancel={closeTemplateModal}
        onOk={submitTemplate}
        confirmLoading={saveTemplateRequest.loading}
        okText={t('Save')}
        cancelText={t('Close')}
        destroyOnClose
      >
        <Form<PromptTemplateFormValues> form={templateForm} layout="vertical">
          <Form.Item
            label={t('Template key')}
            name="templateKey"
            rules={[
              { required: true, message: t('Template key is required') },
              {
                pattern: /^[A-Za-z][A-Za-z0-9_.:-]*$/,
                message: t('Template key format is invalid'),
              },
            ]}
          >
            <Input placeholder="ticket-summary" />
          </Form.Item>
          <Form.Item label={t('Display name')} name="displayName">
            <Input placeholder={t('Ticket summary')} />
          </Form.Item>
          <Form.Item label={t('Description')} name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label={t('Template text')}
            name="templateText"
            rules={[{ required: true, message: t('Template text is required') }]}
          >
            <Input.TextArea rows={8} placeholder="Summarize {{record.title}}" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('Preview template')}
        open={previewModalOpen}
        onCancel={closePreviewModal}
        footer={[
          <Button key="close" onClick={closePreviewModal}>
            {t('Close')}
          </Button>,
          <Button
            key="preview"
            type="primary"
            icon={<EyeOutlined />}
            loading={previewTemplateRequest.loading}
            onClick={submitPreview}
          >
            {t('Preview')}
          </Button>,
        ]}
        destroyOnClose
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">{previewTemplate?.templateKey || '-'}</Typography.Text>
          <Form<PromptPreviewFormValues> form={previewForm} layout="vertical">
            <Form.Item
              label={t('Collection name')}
              name="collectionName"
              rules={[{ required: true, message: t('Collection name is required') }]}
            >
              <Input placeholder="posts" />
            </Form.Item>
            <Form.Item
              label={t('Record ID')}
              name="recordId"
              rules={[{ required: true, message: t('Record ID is required') }]}
            >
              <Input />
            </Form.Item>
          </Form>

          {previewError ? <Alert type="error" showIcon message={previewError} /> : null}
          {previewResult ? (
            <Alert
              type="success"
              showIcon
              message={t('Rendered prompt')}
              description={
                <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {previewResult.renderedPrompt}
                </Typography.Paragraph>
              }
            />
          ) : null}
        </Space>
      </Modal>
    </section>
  );
}
