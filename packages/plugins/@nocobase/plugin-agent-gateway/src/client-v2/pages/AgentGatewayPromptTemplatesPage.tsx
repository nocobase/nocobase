/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Alert, Button, Empty, Form, Input, Modal, Space, Switch, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';
import {
  AgentGatewayContext,
  getApiErrorMessage,
  getRequiredResponseData,
  getResponseData,
} from './AgentGatewayPageUtils';

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

export default function AgentGatewayPromptTemplatesPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [templateForm] = Form.useForm<PromptTemplateFormValues>();
  const [previewForm] = Form.useForm<PromptPreviewFormValues>();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplateRecord | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<PromptTemplateRecord | null>(null);
  const [previewResult, setPreviewResult] = useState<PromptPreviewResult | null>(null);
  const [previewError, setPreviewError] = useState('');

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
    <section aria-label={t('Prompt Templates')}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
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
