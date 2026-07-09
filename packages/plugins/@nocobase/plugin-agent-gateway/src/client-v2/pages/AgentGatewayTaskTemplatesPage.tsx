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
import { Button, Drawer, Empty, Form, Input, InputNumber, Space, Switch, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';
import {
  AgentGatewayTaskParameterFormItems,
  AgentGatewayTaskParameterFormValues,
  BuildRunOptions,
  BuildTaskArtifactDeclarationPayload,
  getBuildRunnerSelectOptions,
  getBuildRunnerValue,
  getBuildSkillVersionSelectOptions,
  getTaskArtifactDeclarations,
  getTaskArtifactFormValues,
  parseBuildRunnerValue,
} from './AgentGatewayTaskParameterFormItems';
import {
  AgentGatewayContext,
  JsonPreview,
  getApiErrorMessage,
  getRequiredResponseData,
  getResponseData,
} from './AgentGatewayPageUtils';

const TASK_TEMPLATE_DRAWER_WIDTH = 1040;

interface TaskTemplateRecord {
  id: string;
  templateKey: string;
  displayName?: string;
  description?: string;
  status?: string;
  sort?: number;
  defaultTitle?: string;
  defaultPrompt?: string;
  cwd?: string;
  nodeId?: string | null;
  agentProfileId?: string | null;
  skillVersionIdsJson?: string[];
  artifactRoot?: string;
  artifactsJson?: BuildTaskArtifactDeclarationPayload[];
}

interface TaskTemplateFormValues extends AgentGatewayTaskParameterFormValues {
  templateKey: string;
  displayName?: string;
  description?: string;
  sort?: number;
}

function getOptionalRunnerValue(nodeId?: string | null, agentProfileId?: string | null) {
  return nodeId && agentProfileId ? getBuildRunnerValue(nodeId, agentProfileId) : undefined;
}

export default function AgentGatewayTaskTemplatesPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [templateForm] = Form.useForm<TaskTemplateFormValues>();
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplateRecord | null>(null);

  const templatesRequest = useRequest(async () => {
    const response = await ctx.api.request<TaskTemplateRecord[]>({
      url: 'agent-gateway/task-templates:list',
      method: 'get',
      params: {
        includeDisabled: true,
      },
    });
    return getResponseData(response, []);
  });

  const optionsRequest = useRequest(async () => {
    const response = await ctx.api.request<BuildRunOptions>({
      url: 'agent-gateway/task-runs:options',
      method: 'get',
    });
    return getResponseData(response, {});
  });

  const runnerSelectOptions = useMemo(
    () => getBuildRunnerSelectOptions(optionsRequest.data, t),
    [optionsRequest.data, t],
  );
  const skillVersionSelectOptions = useMemo(
    () => getBuildSkillVersionSelectOptions(optionsRequest.data),
    [optionsRequest.data],
  );

  const saveTemplateRequest = useRequest(
    async (values: TaskTemplateFormValues) => {
      const runner = parseBuildRunnerValue(values.runner);
      const payload = {
        templateKey: values.templateKey,
        displayName: values.displayName,
        description: values.description,
        status: editingTemplate?.status || 'active',
        sort: values.sort ?? 0,
        defaultTitle: values.title,
        defaultPrompt: values.prompt,
        cwd: values.cwd || optionsRequest.data?.defaultCwd || '.',
        nodeId: runner.nodeId,
        agentProfileId: runner.agentProfileId,
        skillVersionIds: values.skillVersionIds || [],
        artifactRoot: values.artifactRoot,
        artifacts: getTaskArtifactDeclarations(values.artifactDeclarations),
      };

      if (editingTemplate) {
        const response = await ctx.api.request<TaskTemplateRecord>({
          url: `agent-gateway/task-templates:update/${encodeURIComponent(editingTemplate.id)}`,
          method: 'post',
          data: payload,
        });
        return getRequiredResponseData(response, t('Failed to save task template'));
      }

      const response = await ctx.api.request<TaskTemplateRecord>({
        url: 'agent-gateway/task-templates:create',
        method: 'post',
        data: payload,
      });
      return getRequiredResponseData(response, t('Failed to save task template'));
    },
    {
      manual: true,
      onSuccess() {
        setTemplateDrawerOpen(false);
        setEditingTemplate(null);
        templateForm.resetFields();
        templatesRequest.refresh();
        optionsRequest.refresh();
        ctx.message?.success(t('Task template saved'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to save task template')));
      },
    },
  );

  const updateTemplateStatusRequest = useRequest(
    async (template: TaskTemplateRecord, enabled: boolean) => {
      const response = await ctx.api.request<TaskTemplateRecord>({
        url: `agent-gateway/task-templates:update/${encodeURIComponent(template.id)}`,
        method: 'post',
        data: {
          status: enabled ? 'active' : 'disabled',
        },
      });
      return getRequiredResponseData(response, t('Failed to update task template status'));
    },
    {
      manual: true,
      onSuccess() {
        templatesRequest.refresh();
        optionsRequest.refresh();
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to update task template status')));
      },
    },
  );

  const openCreateTemplateDrawer = useCallback(() => {
    setEditingTemplate(null);
    templateForm.resetFields();
    templateForm.setFieldsValue({
      sort: 0,
      cwd: optionsRequest.data?.defaultCwd || '.',
      skillVersionIds: [],
      artifactDeclarations: [],
    });
    setTemplateDrawerOpen(true);
  }, [optionsRequest.data?.defaultCwd, templateForm]);

  const openEditTemplateDrawer = useCallback(
    (template: TaskTemplateRecord) => {
      setEditingTemplate(template);
      templateForm.setFieldsValue({
        templateKey: template.templateKey,
        displayName: template.displayName,
        description: template.description,
        sort: template.sort || 0,
        title: template.defaultTitle,
        prompt: template.defaultPrompt,
        runner: getOptionalRunnerValue(template.nodeId, template.agentProfileId),
        cwd: template.cwd || optionsRequest.data?.defaultCwd || '.',
        skillVersionIds: template.skillVersionIdsJson || [],
        artifactRoot: template.artifactRoot,
        artifactDeclarations: getTaskArtifactFormValues(template.artifactsJson),
      });
      setTemplateDrawerOpen(true);
    },
    [optionsRequest.data?.defaultCwd, templateForm],
  );

  const closeTemplateDrawer = useCallback(() => {
    setTemplateDrawerOpen(false);
    setEditingTemplate(null);
    templateForm.resetFields();
  }, [templateForm]);

  const submitTemplate = useCallback(async () => {
    try {
      const values = await templateForm.validateFields();
      saveTemplateRequest.run(values);
    } catch {
      // Field-level validation messages are already rendered by the form.
    }
  }, [templateForm, saveTemplateRequest]);

  const templateColumns = useMemo<ColumnsType<TaskTemplateRecord>>(
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
        width: 140,
        render: (value: string | undefined, record) => (
          <Switch
            aria-label={t('Toggle task template status')}
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
        width: 72,
        render: (_value: unknown, record) => (
          <Tooltip title={t('Edit task template')}>
            <Button
              aria-label={t('Edit task template')}
              icon={<EditOutlined />}
              onClick={() => openEditTemplateDrawer(record)}
            />
          </Tooltip>
        ),
      },
    ],
    [openEditTemplateDrawer, t, updateTemplateStatusRequest],
  );

  return (
    <section aria-label={t('Task Templates')}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('Task Templates')}
          </Typography.Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                templatesRequest.refresh();
                optionsRequest.refresh();
              }}
            >
              {t('Refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateTemplateDrawer}>
              {t('New template')}
            </Button>
          </Space>
        </Space>

        <Table<TaskTemplateRecord>
          columns={templateColumns}
          dataSource={templatesRequest.data || []}
          expandable={{
            expandedRowRender: (record) => (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text strong>{t('Default instruction')}</Typography.Text>
                <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {record.defaultPrompt || '-'}
                </Typography.Paragraph>
                <Typography.Text strong>{t('Artifact collection')}</Typography.Text>
                <JsonPreview value={record.artifactsJson || []} />
              </Space>
            ),
          }}
          loading={templatesRequest.loading}
          rowKey="id"
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No task templates yet')} />,
          }}
          pagination={false}
        />
      </Space>

      <Drawer
        title={editingTemplate ? t('Edit task template') : t('Create task template')}
        open={templateDrawerOpen}
        onClose={closeTemplateDrawer}
        width={TASK_TEMPLATE_DRAWER_WIDTH}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeTemplateDrawer}>{t('Close')}</Button>
            <Button type="primary" loading={saveTemplateRequest.loading} onClick={submitTemplate}>
              {t('Save')}
            </Button>
          </Space>
        }
      >
        <Form<TaskTemplateFormValues> form={templateForm} layout="vertical">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
              <Input placeholder="build-on-187" />
            </Form.Item>
            <Form.Item label={t('Display name')} name="displayName">
              <Input placeholder={t('Build on 187')} />
            </Form.Item>
            <Form.Item label={t('Description')} name="description">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item label={t('Sort')} name="sort">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <AgentGatewayTaskParameterFormItems
              t={t}
              loading={optionsRequest.loading}
              runnerSelectOptions={runnerSelectOptions}
              skillVersionSelectOptions={skillVersionSelectOptions}
            />
          </Space>
        </Form>
      </Drawer>
    </section>
  );
}
