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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AGENT_GATEWAY_API_ACTIONS } from '../../shared/apiContract';
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
  requestAgentGatewayAction,
  uploadAgentGatewayFile,
} from './AgentGatewayPageUtils';

const TASK_TEMPLATE_DRAWER_WIDTH = 1040;
const TASK_TEMPLATE_DETAIL_QUERY_PARAM = 'templateId';

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

function getSkillVersionIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item)) : [];
}

function isFormValidationError(value: unknown) {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return Array.isArray(record.errorFields);
}

function getTaskTemplateIdFromLocationSearch() {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return new URLSearchParams(window.location.search).get(TASK_TEMPLATE_DETAIL_QUERY_PARAM) || undefined;
}

function replaceTaskTemplateIdInLocationSearch(templateId?: string) {
  if (typeof window === 'undefined') {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (templateId) {
    params.set(TASK_TEMPLATE_DETAIL_QUERY_PARAM, templateId);
  } else {
    params.delete(TASK_TEMPLATE_DETAIL_QUERY_PARAM);
  }
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

function useInitialTaskTemplateDetailQuery() {
  return useState(() => getTaskTemplateIdFromLocationSearch())[0];
}

export default function AgentGatewayTaskTemplatesPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [templateForm] = Form.useForm<TaskTemplateFormValues>();
  const [skillUploadForm] = Form.useForm<SkillUploadFormValues>();
  const initialTemplateId = useInitialTaskTemplateDetailQuery();
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplateRecord | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(initialTemplateId);
  const [skillUploadOpen, setSkillUploadOpen] = useState(false);
  const [skillZipFile, setSkillZipFile] = useState<File | null>(null);
  const [skillUploadResult, setSkillUploadResult] = useState<SkillUploadResult | null>(null);

  const templatesRequest = useRequest(async () => {
    const response = await requestAgentGatewayAction<TaskTemplateRecord[]>(
      ctx.api,
      AGENT_GATEWAY_API_ACTIONS.listTaskTemplates,
      {
        method: 'get',
        params: {
          includeDisabled: true,
        },
      },
    );
    return getResponseData(response, []);
  });

  const optionsRequest = useRequest(async () => {
    const response = await requestAgentGatewayAction<BuildRunOptions>(
      ctx.api,
      AGENT_GATEWAY_API_ACTIONS.listRunOptions,
      {
        method: 'get',
      },
    );
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
        skillVersionIdsJson: values.skillVersionIds || [],
        artifactRoot: values.artifactRoot,
        artifactsJson: getTaskArtifactDeclarations(values.artifactDeclarations),
      };

      if (editingTemplate) {
        const response = await requestAgentGatewayAction<TaskTemplateRecord>(
          ctx.api,
          AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate,
          {
            method: 'post',
            targetKey: editingTemplate.id,
            data: payload,
          },
        );
        return getRequiredResponseData(response, t('Failed to save task template'));
      }

      const response = await requestAgentGatewayAction<TaskTemplateRecord>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.createTaskTemplate,
        {
          method: 'post',
          data: payload,
        },
      );
      return getRequiredResponseData(response, t('Failed to save task template'));
    },
    {
      manual: true,
      onSuccess() {
        setTemplateDrawerOpen(false);
        setEditingTemplate(null);
        setSelectedTemplateId(undefined);
        replaceTaskTemplateIdInLocationSearch();
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
    async (values: SkillUploadFormValues & { file: File }) => {
      const { file, ...skillValues } = values;
      const uploadId = await uploadAgentGatewayFile(ctx.api, file, 'skill-version');
      const response = await requestAgentGatewayAction<SkillUploadResult>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload,
        {
          method: 'post',
          data: { ...skillValues, uploadId },
        },
      );
      return getRequiredResponseData(response, t('Failed to upload skill'));
    },
    {
      manual: true,
      onSuccess(result) {
        const currentSkillVersionIds = getSkillVersionIds(templateForm.getFieldValue('skillVersionIds'));
        templateForm.setFieldValue('skillVersionIds', [...new Set([...currentSkillVersionIds, result.skillVersionId])]);
        setSkillUploadResult(result);
        setSkillZipFile(null);
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
      const response = await requestAgentGatewayAction<TaskTemplateRecord>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate,
        {
          method: 'post',
          targetKey: template.id,
          data: {
            status: enabled ? 'active' : 'disabled',
          },
        },
      );
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
    setSelectedTemplateId(undefined);
    replaceTaskTemplateIdInLocationSearch();
    templateForm.resetFields();
    templateForm.setFieldsValue({
      cwd: optionsRequest.data?.defaultCwd || '.',
      skillVersionIds: [],
      artifactDeclarations: [],
    });
    setTemplateDrawerOpen(true);
  }, [optionsRequest.data?.defaultCwd, templateForm]);

  const openEditTemplateDrawer = useCallback(
    (template: TaskTemplateRecord, options?: { updateLocation?: boolean }) => {
      setEditingTemplate(template);
      setSelectedTemplateId(template.id);
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
      if (options?.updateLocation !== false) {
        replaceTaskTemplateIdInLocationSearch(template.id);
      }
    },
    [optionsRequest.data?.defaultCwd, templateForm],
  );

  const closeTemplateDrawer = useCallback(() => {
    setTemplateDrawerOpen(false);
    setEditingTemplate(null);
    setSelectedTemplateId(undefined);
    replaceTaskTemplateIdInLocationSearch();
    templateForm.resetFields();
  }, [templateForm]);

  const syncTemplateDetailFromLocation = useCallback(() => {
    const templateId = getTaskTemplateIdFromLocationSearch();
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setTemplateDrawerOpen(false);
      setEditingTemplate(null);
      templateForm.resetFields();
    }
  }, [templateForm]);

  const openSkillUploadModal = useCallback(() => {
    setSkillZipFile(null);
    setSkillUploadResult(null);
    skillUploadForm.setFieldsValue(DEFAULT_SKILL_UPLOAD_FORM_VALUES);
    setSkillUploadOpen(true);
  }, [skillUploadForm]);

  const closeSkillUploadModal = useCallback(() => {
    setSkillUploadOpen(false);
    setSkillZipFile(null);
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
      if (!skillZipFile) {
        ctx.message?.error(t('Skill ZIP file is required'));
        return;
      }
      uploadSkillVersionRequest.run({
        ...values,
        file: skillZipFile,
      });
    } catch (error) {
      if (!isFormValidationError(error)) {
        ctx.message?.error(t('Failed to upload skill'));
      }
    }
  }, [ctx.message, skillUploadForm, skillZipFile, t, uploadSkillVersionRequest]);

  const handleSkillZipBeforeUpload = useCallback<NonNullable<UploadProps['beforeUpload']>>(
    async (file) => {
      try {
        setSkillZipFile(file);
      } catch {
        setSkillZipFile(null);
        ctx.message?.error(t('Failed to read skill ZIP file'));
      }
      return false;
    },
    [ctx.message, t],
  );

  const handleSkillZipRemove = useCallback<NonNullable<UploadProps['onRemove']>>(() => {
    setSkillZipFile(null);
    return true;
  }, []);

  useEffect(() => {
    syncTemplateDetailFromLocation();
    window.addEventListener('popstate', syncTemplateDetailFromLocation);
    return () => {
      window.removeEventListener('popstate', syncTemplateDetailFromLocation);
    };
  }, [syncTemplateDetailFromLocation]);

  useEffect(() => {
    if (!selectedTemplateId || !templatesRequest.data) {
      return;
    }
    const template = templatesRequest.data.find((record) => record.id === selectedTemplateId);
    if (!template || (templateDrawerOpen && editingTemplate?.id === template.id)) {
      return;
    }
    openEditTemplateDrawer(template, { updateLocation: false });
  }, [editingTemplate?.id, openEditTemplateDrawer, selectedTemplateId, templateDrawerOpen, templatesRequest.data]);

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
