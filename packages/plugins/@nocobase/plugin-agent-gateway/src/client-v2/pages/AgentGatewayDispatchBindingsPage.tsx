/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';
import {
  AgentGatewayContext,
  JsonPreview,
  JsonRecord,
  getApiErrorMessage,
  getObjectRecord,
  getRequiredResponseData,
  getResponseData,
  parseJsonField,
} from './AgentGatewayPageUtils';

interface DispatchBindingRecord {
  id: string;
  bindingKey: string;
  status?: string;
  collectionName?: string;
  sourceCollection?: string;
  outputAgentRunField?: string;
  promptTemplateId?: string;
  agentProfileId?: string | null;
  nodeId?: string | null;
  agentProfileField?: string | null;
  nodeField?: string | null;
  skillFieldsJson?: JsonRecord | string[];
  fieldMappingsJson?: JsonRecord | string[];
  filterJson?: JsonRecord;
  payloadMappingJson?: JsonRecord;
  enabled?: boolean;
  priority?: number;
}

interface PromptTemplateOption {
  id: string;
  templateKey: string;
  displayName?: string;
}

interface BindingFormValues {
  bindingKey: string;
  collectionName: string;
  outputAgentRunField: string;
  promptTemplateId: string;
  agentProfileId?: string;
  nodeId?: string;
  agentProfileField?: string;
  nodeField?: string;
  priority?: number;
  fieldMappingsJson?: string;
  skillFieldsJson?: string;
  filterJson?: string;
  payloadMappingJson?: string;
}

function stringifyJsonField(value: unknown, fallback: unknown) {
  const source = value === undefined || value === null ? fallback : value;
  return JSON.stringify(source, null, 2);
}

function getBindingEnabled(binding: DispatchBindingRecord) {
  if (typeof binding.enabled === 'boolean') {
    return binding.enabled;
  }
  return (binding.status || 'active') === 'active';
}

export default function AgentGatewayDispatchBindingsPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [bindingForm] = Form.useForm<BindingFormValues>();
  const [bindingModalOpen, setBindingModalOpen] = useState(false);
  const [editingBinding, setEditingBinding] = useState<DispatchBindingRecord | null>(null);

  const bindingsRequest = useRequest(async () => {
    const response = await ctx.api.request<DispatchBindingRecord[]>({
      url: 'agent-gateway/dispatch-bindings:list',
      method: 'get',
    });
    return getResponseData(response, []);
  });

  const templatesRequest = useRequest(async () => {
    const response = await ctx.api.request<PromptTemplateOption[]>({
      url: 'agent-gateway/prompt-templates:list',
      method: 'get',
    });
    return getResponseData(response, []);
  });

  const saveBindingRequest = useRequest(
    async (values: BindingFormValues) => {
      const payload = {
        bindingKey: values.bindingKey,
        collectionName: values.collectionName,
        outputAgentRunField: values.outputAgentRunField,
        promptTemplateId: values.promptTemplateId,
        agentProfileId: values.agentProfileId,
        nodeId: values.nodeId,
        agentProfileField: values.agentProfileField,
        nodeField: values.nodeField,
        priority: values.priority ?? 0,
        fieldMappingsJson: parseJsonField(values.fieldMappingsJson, {}),
        skillFieldsJson: parseJsonField(values.skillFieldsJson, {}),
        filterJson: parseJsonField(values.filterJson, {}),
        payloadMappingJson: parseJsonField(values.payloadMappingJson, {}),
      };

      if (editingBinding) {
        const response = await ctx.api.request<DispatchBindingRecord>({
          url: `agent-gateway/dispatch-bindings:update/${encodeURIComponent(editingBinding.id)}`,
          method: 'post',
          data: payload,
        });
        return getRequiredResponseData(response, t('Failed to save dispatch binding'));
      }

      const response = await ctx.api.request<DispatchBindingRecord>({
        url: 'agent-gateway/dispatch-bindings:create',
        method: 'post',
        data: payload,
      });
      return getRequiredResponseData(response, t('Failed to save dispatch binding'));
    },
    {
      manual: true,
      onSuccess() {
        setBindingModalOpen(false);
        setEditingBinding(null);
        bindingForm.resetFields();
        bindingsRequest.refresh();
        ctx.message?.success(t('Dispatch binding saved'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to save dispatch binding')));
      },
    },
  );

  const updateBindingStatusRequest = useRequest(
    async (binding: DispatchBindingRecord, enabled: boolean) => {
      const response = await ctx.api.request<DispatchBindingRecord>({
        url: `agent-gateway/dispatch-bindings:update/${encodeURIComponent(binding.id)}`,
        method: 'post',
        data: {
          enabled,
        },
      });
      return getRequiredResponseData(response, t('Failed to update dispatch binding status'));
    },
    {
      manual: true,
      onSuccess() {
        bindingsRequest.refresh();
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to update dispatch binding status')));
      },
    },
  );

  const openCreateBindingModal = useCallback(() => {
    setEditingBinding(null);
    bindingForm.resetFields();
    bindingForm.setFieldsValue({
      priority: 0,
      fieldMappingsJson: '{}',
      skillFieldsJson: '{}',
      filterJson: '{}',
      payloadMappingJson: '{}',
    });
    setBindingModalOpen(true);
  }, [bindingForm]);

  const openEditBindingModal = useCallback(
    (binding: DispatchBindingRecord) => {
      setEditingBinding(binding);
      bindingForm.setFieldsValue({
        bindingKey: binding.bindingKey,
        collectionName: binding.collectionName || binding.sourceCollection || '',
        outputAgentRunField: binding.outputAgentRunField || '',
        promptTemplateId: binding.promptTemplateId || '',
        agentProfileId: binding.agentProfileId || undefined,
        nodeId: binding.nodeId || undefined,
        agentProfileField: binding.agentProfileField || undefined,
        nodeField: binding.nodeField || undefined,
        priority: binding.priority || 0,
        fieldMappingsJson: stringifyJsonField(binding.fieldMappingsJson, {}),
        skillFieldsJson: stringifyJsonField(binding.skillFieldsJson, {}),
        filterJson: stringifyJsonField(binding.filterJson, {}),
        payloadMappingJson: stringifyJsonField(binding.payloadMappingJson, {}),
      });
      setBindingModalOpen(true);
    },
    [bindingForm],
  );

  const closeBindingModal = useCallback(() => {
    setBindingModalOpen(false);
    setEditingBinding(null);
    bindingForm.resetFields();
  }, [bindingForm]);

  const submitBinding = useCallback(async () => {
    try {
      const values = await bindingForm.validateFields();
      saveBindingRequest.run(values);
    } catch (error) {
      if (!Array.isArray(getObjectRecord(error).errorFields)) {
        ctx.message?.error(t('JSON format is invalid'));
      }
    }
  }, [bindingForm, ctx.message, saveBindingRequest, t]);

  const bindingColumns = useMemo<ColumnsType<DispatchBindingRecord>>(
    () => [
      {
        title: t('Binding key'),
        dataIndex: 'bindingKey',
        key: 'bindingKey',
      },
      {
        title: t('Collection name'),
        dataIndex: 'collectionName',
        key: 'collectionName',
        render: (value: string | undefined, record) => value || record.sourceCollection || '-',
      },
      {
        title: t('Output run field'),
        dataIndex: 'outputAgentRunField',
        key: 'outputAgentRunField',
        render: (value: string | undefined) => value || '-',
      },
      {
        title: t('Prompt template'),
        dataIndex: 'promptTemplateId',
        key: 'promptTemplateId',
        render: (value: string | undefined) => value || '-',
      },
      {
        title: t('Status'),
        key: 'enabled',
        width: 120,
        render: (_value: unknown, record) => (
          <Switch
            aria-label={t('Toggle dispatch binding status')}
            checked={getBindingEnabled(record)}
            checkedChildren={t('Enabled')}
            unCheckedChildren={t('Disabled')}
            loading={updateBindingStatusRequest.loading}
            onChange={(checked) => updateBindingStatusRequest.run(record, checked)}
          />
        ),
      },
      {
        title: t('Priority'),
        dataIndex: 'priority',
        key: 'priority',
        render: (value: number | undefined) => value ?? 0,
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 72,
        render: (_value: unknown, record) => (
          <Tooltip title={t('Edit dispatch binding')}>
            <Button
              aria-label={t('Edit dispatch binding')}
              icon={<EditOutlined />}
              onClick={() => openEditBindingModal(record)}
            />
          </Tooltip>
        ),
      },
    ],
    [openEditBindingModal, t, updateBindingStatusRequest],
  );

  return (
    <section aria-label={t('Dispatch Bindings')}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('Dispatch Bindings')}
          </Typography.Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={bindingsRequest.refresh}>
              {t('Refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateBindingModal}>
              {t('New binding')}
            </Button>
          </Space>
        </Space>

        <Table<DispatchBindingRecord>
          columns={bindingColumns}
          dataSource={bindingsRequest.data || []}
          loading={bindingsRequest.loading}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text strong>{t('Field mappings')}</Typography.Text>
                <JsonPreview value={record.fieldMappingsJson} />
                <Typography.Text strong>{t('Skill fields')}</Typography.Text>
                <JsonPreview value={record.skillFieldsJson} />
              </Space>
            ),
          }}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No dispatch bindings yet')} />,
          }}
          pagination={false}
        />
      </Space>

      <Modal
        title={editingBinding ? t('Edit dispatch binding') : t('Create dispatch binding')}
        open={bindingModalOpen}
        onCancel={closeBindingModal}
        onOk={submitBinding}
        confirmLoading={saveBindingRequest.loading}
        okText={t('Save')}
        cancelText={t('Close')}
        width={720}
        destroyOnClose
      >
        <Form<BindingFormValues> form={bindingForm} layout="vertical">
          <Form.Item
            label={t('Binding key')}
            name="bindingKey"
            rules={[
              { required: true, message: t('Binding key is required') },
              {
                pattern: /^[A-Za-z][A-Za-z0-9_.:-]*$/,
                message: t('Binding key format is invalid'),
              },
            ]}
          >
            <Input placeholder="ticket-dispatch" />
          </Form.Item>
          <Form.Item
            label={t('Collection name')}
            name="collectionName"
            rules={[{ required: true, message: t('Collection name is required') }]}
          >
            <Input placeholder="tickets" />
          </Form.Item>
          <Form.Item
            label={t('Output run field')}
            name="outputAgentRunField"
            rules={[{ required: true, message: t('Output run field is required') }]}
          >
            <Input placeholder="agentRun" />
          </Form.Item>
          <Form.Item
            label={t('Prompt template')}
            name="promptTemplateId"
            rules={[{ required: true, message: t('Prompt template is required') }]}
          >
            <Select
              showSearch
              loading={templatesRequest.loading}
              optionFilterProp="label"
              options={(templatesRequest.data || []).map((template) => ({
                value: template.id,
                label: template.displayName || template.templateKey,
              }))}
            />
          </Form.Item>
          <Form.Item label={t('Node ID')} name="nodeId">
            <Input />
          </Form.Item>
          <Form.Item label={t('Profile ID')} name="agentProfileId">
            <Input />
          </Form.Item>
          <Form.Item label={t('Node selection field')} name="nodeField">
            <Input />
          </Form.Item>
          <Form.Item label={t('Profile selection field')} name="agentProfileField">
            <Input />
          </Form.Item>
          <Form.Item label={t('Priority')} name="priority">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={t('Field mappings JSON')} name="fieldMappingsJson">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label={t('Skill fields JSON')} name="skillFieldsJson">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label={t('Filter JSON')} name="filterJson">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label={t('Payload mapping JSON')} name="payloadMappingJson">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}
