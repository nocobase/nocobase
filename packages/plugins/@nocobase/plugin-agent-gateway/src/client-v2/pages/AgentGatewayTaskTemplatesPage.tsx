/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tooltip,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';
import {
  AgentGatewayTaskParameterFormItems,
  AgentGatewayTaskParameterFormValues,
  BuildRunOptions,
  BuildTaskArtifactDeclarationPayload,
  OPENCODE_UI_BATCH_SKILL_KEY,
  getBuildSkillVersionSelectOptions,
  getTaskArtifactDeclarations,
  getTaskArtifactFormValues,
} from './AgentGatewayTaskParameterFormItems';
import {
  AgentGatewayContext,
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
  defaultTitle?: string;
  defaultPrompt?: string;
  cwd?: string;
  skillVersionIdsJson?: string[];
  artifactRoot?: string;
  artifactsJson?: BuildTaskArtifactDeclarationPayload[];
}

interface TaskTemplateFormValues extends AgentGatewayTaskParameterFormValues {
  templateKey: string;
  displayName?: string;
  description?: string;
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

const DEFAULT_SKILL_UPLOAD_FORM_VALUES: SkillUploadFormValues = {
  skillKey: OPENCODE_UI_BATCH_SKILL_KEY,
  displayName: 'NB OpenCode UI Batch',
  versionLabel: 'local',
};

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

function getSkillVersionIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item)) : [];
}

function isFormValidationError(value: unknown) {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return Array.isArray(record.errorFields);
}

export default function AgentGatewayTaskTemplatesPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [templateForm] = Form.useForm<TaskTemplateFormValues>();
  const [skillUploadForm] = Form.useForm<SkillUploadFormValues>();
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplateRecord | null>(null);
  const [skillUploadOpen, setSkillUploadOpen] = useState(false);
  const [skillZipContentBase64, setSkillZipContentBase64] = useState('');
  const [skillUploadResult, setSkillUploadResult] = useState<SkillUploadResult | null>(null);

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

  const skillVersionSelectOptions = useMemo(
    () => getBuildSkillVersionSelectOptions(optionsRequest.data),
    [optionsRequest.data],
  );

  const saveTemplateRequest = useRequest(
    async (values: TaskTemplateFormValues) => {
      const payload = {
        templateKey: values.templateKey,
        displayName: values.displayName,
        description: values.description,
        status: editingTemplate?.status || 'active',
        defaultTitle: values.title,
        defaultPrompt: values.prompt,
        cwd: values.cwd || optionsRequest.data?.defaultCwd || '.',
        nodeId: null,
        agentProfileId: null,
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
        const currentSkillVersionIds = getSkillVersionIds(templateForm.getFieldValue('skillVersionIds'));
        templateForm.setFieldValue('skillVersionIds', [...new Set([...currentSkillVersionIds, result.skillVersionId])]);
        setSkillUploadResult(result);
        setSkillZipContentBase64('');
        skillUploadForm.resetFields();
        setSkillUploadOpen(false);
        optionsRequest.refresh();
        ctx.message?.success(t('Skill uploaded'));
      },
      onError() {
        ctx.message?.error(t('Failed to upload skill'));
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
        title: template.defaultTitle,
        prompt: template.defaultPrompt,
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

  const openSkillUploadModal = useCallback(() => {
    setSkillZipContentBase64('');
    setSkillUploadResult(null);
    skillUploadForm.setFieldsValue(DEFAULT_SKILL_UPLOAD_FORM_VALUES);
    setSkillUploadOpen(true);
  }, [skillUploadForm]);

  const closeSkillUploadModal = useCallback(() => {
    setSkillUploadOpen(false);
    setSkillZipContentBase64('');
    setSkillUploadResult(null);
    skillUploadForm.resetFields();
  }, [skillUploadForm]);

  const submitTemplate = useCallback(async () => {
    try {
      const values = await templateForm.validateFields();
      saveTemplateRequest.run(values);
    } catch {
      // Field-level validation messages are already rendered by the form.
    }
  }, [templateForm, saveTemplateRequest]);

  const submitSkillUpload = useCallback(async () => {
    try {
      const values = await skillUploadForm.validateFields();
      if (!skillZipContentBase64) {
        ctx.message?.error(t('Skill ZIP file is required'));
        return;
      }
      uploadSkillVersionRequest.run({
        ...values,
        contentBase64: skillZipContentBase64,
      });
    } catch (error) {
      if (!isFormValidationError(error)) {
        ctx.message?.error(t('Failed to upload skill'));
      }
    }
  }, [ctx.message, skillUploadForm, skillZipContentBase64, t, uploadSkillVersionRequest]);

  const handleSkillZipBeforeUpload = useCallback<NonNullable<UploadProps['beforeUpload']>>(
    async (file) => {
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

  const handleSkillZipRemove = useCallback<NonNullable<UploadProps['onRemove']>>(() => {
    setSkillZipContentBase64('');
    return true;
  }, []);

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
        width: 112,
        render: (value: string | undefined, record) => (
          <Switch
            aria-label={t('Toggle task template status')}
            checked={(value || 'active') === 'active'}
            loading={updateTemplateStatusRequest.loading}
            size="small"
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
      <Card variant="borderless">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Flex justify="flex-end">
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
          </Flex>

          <Table<TaskTemplateRecord>
            columns={templateColumns}
            dataSource={templatesRequest.data || []}
            loading={templatesRequest.loading}
            rowKey="id"
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No task templates yet')} />,
            }}
            pagination={false}
          />
        </Space>
      </Card>

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
            <AgentGatewayTaskParameterFormItems
              t={t}
              loading={optionsRequest.loading}
              runnerSelectOptions={[]}
              skillVersionSelectOptions={skillVersionSelectOptions}
              showRunner={false}
              onUploadSkill={openSkillUploadModal}
            />
          </Space>
        </Form>
      </Drawer>
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
          <Form<SkillUploadFormValues>
            form={skillUploadForm}
            layout="vertical"
            initialValues={DEFAULT_SKILL_UPLOAD_FORM_VALUES}
          >
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
              <Input placeholder="local" />
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
              description={[skillUploadResult.skillKey, skillUploadResult.versionLabel, skillUploadResult.status]
                .filter(Boolean)
                .join(' / ')}
            />
          ) : null}
        </Space>
      </Modal>
    </section>
  );
}
