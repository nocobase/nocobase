/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { uid } from '@nocobase/utils/client';
import { Alert, Button, Card, Empty, Flex, Form, Input, Modal, Select, Space, Tag, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { JS_TEMPLATE_KEY_PATTERN, JS_TEMPLATE_SUPPORTED_KINDS, NAMESPACE, type JsTemplateKind } from '../../constants';
import { createJsTemplateEntryStarter } from '../../shared/jsTemplateEntryStarter';
import type { JsTemplateCatalogEntry, JsTemplateCatalogStatus, JsTemplateCreateJobSummary } from '../../shared/types';
import { listJsTemplateCatalog, type ApiClientLike } from '../api/jsTemplatesRequests';
import { useJsTemplateCreateJobs } from '../hooks/useJsTemplateCreateJobs';
import { useJsTemplateProject } from '../hooks/useJsTemplateProject';
import { getJsTemplateSyncErrorTranslationKey } from '../hooks/useJsTemplateSync';
import { invalidateJsTemplateRuntimeCache } from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { invalidateJsTemplateSettingsDescriptorCache } from '../resolvers/JsTemplateSettingsDescriptorCache';

interface CreateJsTemplateFormValues {
  templateName: string;
  title: string;
  description?: string;
  kind: JsTemplateKind;
  sourceProjectName: string;
}

interface FlowContextWithApi {
  api: ApiClientLike;
}

interface Notice {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

const catalogStatuses: JsTemplateCatalogStatus[] = ['ready', 'missing', 'disabled', 'archived'];

export function JsTemplateCatalogPage() {
  const { t } = useTranslation(NAMESPACE);
  const flowContext = useFlowContext() as FlowContextWithApi;
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { createProject } = useJsTemplateProject();
  const {
    jobs: createJobs,
    error: createJobsError,
    addAcceptedJob,
    dismiss: dismissCreateJob,
  } = useJsTemplateCreateJobs();
  const [form] = Form.useForm<CreateJsTemplateFormValues>();
  const [entries, setEntries] = useState<JsTemplateCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<JsTemplateKind>();
  const [status, setStatus] = useState<JsTemplateCatalogStatus>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const observedCreateJobs = useRef<Map<string, JsTemplateCreateJobSummary> | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listJsTemplateCatalog(flowContext.api));
      return true;
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load templates') });
      return false;
    } finally {
      setLoading(false);
    }
  }, [flowContext.api, t]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleSucceededJobs = useCallback(
    async (jobs: JsTemplateCreateJobSummary[]) => {
      for (const job of jobs) {
        invalidateJsTemplateSettingsDescriptorCache(flowContext.api, job.targetProjectId);
        invalidateJsTemplateRuntimeCache(flowContext.api, job.targetProjectId);
      }
      const refreshed = await loadCatalog();
      if (refreshed) {
        const job = jobs[jobs.length - 1];
        setNotice({
          type: 'success',
          message: t('Creation succeeded: {{name}}').replace('{{name}}', job.title || job.name),
        });
      }
    },
    [flowContext.api, loadCatalog, t],
  );

  useEffect(() => {
    const currentJobs = new Map(createJobs.map((job) => [job.id, job]));
    const previousJobs = observedCreateJobs.current;
    observedCreateJobs.current = currentJobs;
    if (!previousJobs) {
      return;
    }

    const succeeded = [...previousJobs.values()].filter(
      (job) => (job.status === 'pending' || job.status === 'running') && !currentJobs.has(job.id),
    );
    const failed = createJobs.find((job) => {
      const previous = previousJobs.get(job.id);
      return (previous?.status === 'pending' || previous?.status === 'running') && job.status === 'failed';
    });

    if (succeeded.length > 0) {
      handleSucceededJobs(succeeded).catch(() => undefined);
    }
    if (failed) {
      const errorKey = getJsTemplateSyncErrorTranslationKey(failed.errorCode, failed.errorReasonCode);
      setNotice({
        type: 'error',
        message: `${t('Creation failed: {{name}}').replace('{{name}}', failed.title || failed.name)}: ${
          errorKey ? t(errorKey) : failed.errorMessage || t('JS Template creation failed')
        }`,
      });
    }
  }, [createJobs, handleSucceededJobs, t]);

  useEffect(() => {
    for (const job of createJobs) {
      if (job.status === 'failed') {
        dismissCreateJob(job.id).catch(() => undefined);
      }
    }
  }, [createJobs, dismissCreateJob]);

  const resetCreateForm = useCallback(() => {
    form.resetFields();
    form.setFieldsValue({
      kind: 'js-block',
      sourceProjectName: createSourceProjectName(),
    });
  }, [form]);

  const openCreate = useCallback(() => {
    resetCreateForm();
    setCreateOpen(true);
  }, [resetCreateForm]);

  const closeCreate = useCallback(() => {
    if (creating) {
      return;
    }
    setCreateOpen(false);
    resetCreateForm();
  }, [creating, resetCreateForm]);

  const createTemplate = async () => {
    const values = await form.validateFields();
    setCreating(true);
    setNotice(null);
    try {
      const title = values.title.trim();
      const description = values.description?.trim() || null;
      const accepted = await createProject({
        name: values.sourceProjectName.trim(),
        title,
        description,
        initialFiles: createJsTemplateEntryStarter({
          kind: values.kind,
          templateName: values.templateName.trim(),
          title,
          description,
        }),
        message: 'Create JS Template entry',
      });
      addAcceptedJob(accepted);
      setCreateOpen(false);
      resetCreateForm();
      setNotice({ type: 'info', message: t('JS Template creation started') });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : t('JS Template creation failed'),
      });
    } finally {
      setCreating(false);
    }
  };

  const openSourceProject = useCallback(
    (entry: JsTemplateCatalogEntry) => {
      const query = new URLSearchParams({ projectId: entry.projectId, panel: 'source' });
      navigate(`/admin/settings/js-templates/source-projects?${query.toString()}`);
    },
    [navigate],
  );

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (kind && entry.kind !== kind) {
        return false;
      }
      if (status && entry.status !== status) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return [entry.title, entry.templateName, entry.projectTitle, entry.projectName]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [entries, kind, search, status]);

  const columns = useMemo<ColumnsType<JsTemplateCatalogEntry>>(
    () => [
      {
        title: t('Template'),
        dataIndex: 'title',
        sorter: (left, right) => compareText(left.title || left.templateName, right.title || right.templateName),
        render: (_value, entry) => (
          <Space direction="vertical" size={0} style={{ maxWidth: 240, minWidth: 0 }}>
            <Typography.Text ellipsis strong style={{ maxWidth: 240 }}>
              {entry.title || entry.templateName}
            </Typography.Text>
            <Typography.Text code ellipsis style={{ maxWidth: 240 }} type="secondary">
              {entry.templateName}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Kind'),
        dataIndex: 'kind',
        sorter: (left, right) => compareText(left.kind, right.kind),
        width: 140,
        render: (value: string) => <Tag>{t(value)}</Tag>,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        sorter: (left, right) => compareText(left.status, right.status),
        width: 130,
        render: (value: JsTemplateCatalogStatus) => <Tag color={getStatusColor(value)}>{t(value)}</Tag>,
      },
      {
        title: t('Usage count'),
        dataIndex: 'usageCount',
        align: 'right',
        sorter: (left, right) => left.usageCount - right.usageCount,
        width: 130,
      },
      {
        title: t('Source Project'),
        key: 'sourceProject',
        sorter: (left, right) =>
          compareText(left.projectTitle || left.projectName, right.projectTitle || right.projectName),
        render: (_value, entry) => (
          <Button onClick={() => openSourceProject(entry)} type="link" style={{ height: 'auto', paddingInline: 0 }}>
            {entry.projectTitle || entry.projectName}
          </Button>
        ),
      },
      {
        title: t('Updated at'),
        dataIndex: 'updatedAt',
        sorter: (left, right) => getDateTimestamp(left.updatedAt) - getDateTimestamp(right.updatedAt),
        width: 190,
        render: (value?: string | null) => formatDate(value),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 130,
        render: (_value, entry) => (
          <Button onClick={() => openSourceProject(entry)} size="small" type="link">
            {t('Manage Source Project')}
          </Button>
        ),
      },
    ],
    [openSourceProject, t],
  );

  return (
    <Card variant="borderless">
      {createJobsError ? (
        <Alert
          message={t('Failed to load creation jobs')}
          showIcon
          style={{ marginBottom: token.margin }}
          type="error"
        />
      ) : null}
      {notice ? (
        <Alert
          closable
          message={notice.message}
          onClose={() => setNotice(null)}
          showIcon
          style={{ marginBottom: token.margin }}
          type={notice.type}
        />
      ) : null}

      <Flex align="center" justify="space-between" gap={token.marginSM} style={{ marginBottom: token.margin }} wrap>
        <Space wrap>
          <Input.Search
            allowClear
            aria-label={t('Search JS Templates')}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search JS Templates')}
            style={{ width: 260 }}
            value={search}
          />
          <Select<JsTemplateKind>
            allowClear
            aria-label={t('Kind')}
            onChange={setKind}
            options={JS_TEMPLATE_SUPPORTED_KINDS.map((value) => ({ label: t(value), value }))}
            placeholder={t('All kinds')}
            style={{ width: 160 }}
            value={kind}
          />
          <Select<JsTemplateCatalogStatus>
            allowClear
            aria-label={t('Status')}
            onChange={setStatus}
            options={catalogStatuses.map((value) => ({ label: t(value), value }))}
            placeholder={t('All statuses')}
            style={{ width: 160 }}
            value={status}
          />
        </Space>
        <Space wrap>
          <Button aria-label={t('Refresh')} icon={<ReloadOutlined />} loading={loading} onClick={loadCatalog}>
            {t('Refresh')}
          </Button>
          <Button aria-label={t('Create JS Template')} icon={<PlusOutlined />} onClick={openCreate} type="primary">
            {t('Create JS Template')}
          </Button>
        </Space>
      </Flex>

      <Table<JsTemplateCatalogEntry>
        columns={columns}
        dataSource={filteredEntries}
        loading={loading}
        locale={{ emptyText: <Empty description={t('No JS Templates yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        pagination={{ pageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 1100 }}
        showIndex={false}
      />

      <Modal
        confirmLoading={creating}
        okText={t('Create')}
        onCancel={closeCreate}
        onOk={createTemplate}
        open={createOpen}
        title={t('Create JS Template')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('Template name')}
            name="templateName"
            rules={[
              { required: true, message: t('Name is required') },
              { pattern: JS_TEMPLATE_KEY_PATTERN, message: t('Name format is invalid') },
            ]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item
            label={t('Template title')}
            name="title"
            rules={[{ required: true, whitespace: true, message: t('Title is required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={t('Kind')} name="kind" rules={[{ required: true }]}>
            <Select options={JS_TEMPLATE_SUPPORTED_KINDS.map((value) => ({ label: t(value), value }))} />
          </Form.Item>
          <Form.Item label={t('Description')} name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            extra={t('The Source Project name is generated automatically and can be changed if needed.')}
            label={t('Source Project name')}
            name="sourceProjectName"
            rules={[
              { required: true, message: t('Name is required') },
              { pattern: /^[a-z][a-z0-9._-]*$/, message: t('Name format is invalid') },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

function createSourceProjectName(): string {
  return `jt_${uid()}`;
}

function compareText(left?: string | null, right?: string | null): number {
  return String(left || '').localeCompare(String(right || ''), undefined, { numeric: true, sensitivity: 'base' });
}

function getDateTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getStatusColor(status: JsTemplateCatalogStatus): string {
  if (status === 'ready') {
    return 'success';
  }
  if (status === 'missing' || status === 'archived') {
    return 'default';
  }
  return 'warning';
}

export default JsTemplateCatalogPage;
