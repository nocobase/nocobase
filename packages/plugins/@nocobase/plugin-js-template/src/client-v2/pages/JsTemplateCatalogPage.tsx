/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, EnvironmentOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { uid } from '@nocobase/utils/client';
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { JS_TEMPLATE_KEY_PATTERN, JS_TEMPLATE_SUPPORTED_KINDS, NAMESPACE, type JsTemplateKind } from '../../constants';
import { createJsTemplateEntryStarter } from '../../shared/jsTemplateEntryStarter';
import type {
  JsTemplateCatalogEntry,
  JsTemplateCatalogStatus,
  JsTemplateCreateJobSummary,
  JsTemplateUsageListResult,
} from '../../shared/types';
import {
  deleteJsTemplate,
  listJsTemplateCatalog,
  listJsTemplateUsageLocations,
  type ApiClientLike,
} from '../api/jsTemplatesRequests';
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
const USAGE_PAGE_SIZE = 10;

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
  const [usageEntry, setUsageEntry] = useState<JsTemplateCatalogEntry | null>(null);
  const [usageResult, setUsageResult] = useState<JsTemplateUsageListResult | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const observedCreateJobs = useRef<Map<string, JsTemplateCreateJobSummary> | null>(null);
  const usageRequestSeq = useRef(0);
  const usageRequestedPage = useRef(1);

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

  const loadUsageLocations = useCallback(
    async (entry: JsTemplateCatalogEntry, page: number) => {
      const requestSeq = usageRequestSeq.current + 1;
      usageRequestSeq.current = requestSeq;
      usageRequestedPage.current = page;
      setUsageLoading(true);
      setUsageError(null);
      try {
        const result = await listJsTemplateUsageLocations(flowContext.api, {
          templateId: entry.id,
          page,
          pageSize: USAGE_PAGE_SIZE,
        });
        if (usageRequestSeq.current === requestSeq) {
          setUsageResult(result);
        }
      } catch (error) {
        if (usageRequestSeq.current === requestSeq) {
          setUsageError(error instanceof Error ? error.message : t('Failed to load usage locations'));
        }
      } finally {
        if (usageRequestSeq.current === requestSeq) {
          setUsageLoading(false);
        }
      }
    },
    [flowContext.api, t],
  );

  const openUsageLocations = useCallback(
    (entry: JsTemplateCatalogEntry) => {
      setUsageEntry(entry);
      setUsageResult(null);
      loadUsageLocations(entry, 1);
    },
    [loadUsageLocations],
  );

  const closeUsageLocations = useCallback(() => {
    usageRequestSeq.current += 1;
    usageRequestedPage.current = 1;
    setUsageEntry(null);
    setUsageResult(null);
    setUsageError(null);
    setUsageLoading(false);
  }, []);

  const removeTemplate = useCallback(
    async (entry: JsTemplateCatalogEntry) => {
      setDeletingTemplateId(entry.id);
      setNotice(null);
      try {
        await deleteJsTemplate(flowContext.api, entry.id);
        setNotice({
          type: 'success',
          message: t('JS Template deleted: {{name}}').replace('{{name}}', entry.title || entry.templateName),
        });
        await loadCatalog();
      } catch (error) {
        setNotice({ type: 'error', message: getDeleteErrorMessage(error, t) });
      } finally {
        setDeletingTemplateId(null);
      }
    },
    [flowContext.api, loadCatalog, t],
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
        render: (value: number, entry) => (
          <Button
            aria-label={t('View usage locations for {{name}}').replace('{{name}}', entry.title || entry.templateName)}
            icon={<EnvironmentOutlined />}
            onClick={() => openUsageLocations(entry)}
            size="small"
            type="link"
          >
            {value}
          </Button>
        ),
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
        width: 300,
        render: (_value, entry) => (
          <Space size="small" wrap>
            <Button onClick={() => openUsageLocations(entry)} size="small" type="link">
              {t('Usage locations')}
            </Button>
            <Button onClick={() => openSourceProject(entry)} size="small" type="link">
              {t('Manage Source Project')}
            </Button>
            <Tooltip title={getDeleteDisabledReason(entry, t)}>
              <span>
                <Popconfirm
                  cancelText={t('Cancel')}
                  disabled={Boolean(getDeleteDisabledReason(entry, t))}
                  okButtonProps={{ danger: true, loading: deletingTemplateId === entry.id }}
                  okText={t('Delete')}
                  onConfirm={() => removeTemplate(entry)}
                  title={t('Delete this JS Template?')}
                >
                  <Button
                    aria-label={t('Delete JS Template {{name}}').replace('{{name}}', entry.title || entry.templateName)}
                    danger
                    disabled={Boolean(getDeleteDisabledReason(entry, t))}
                    icon={<DeleteOutlined />}
                    loading={deletingTemplateId === entry.id}
                    size="small"
                    type="text"
                  />
                </Popconfirm>
              </span>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [deletingTemplateId, openSourceProject, openUsageLocations, removeTemplate, t],
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

      <Modal
        footer={<Button onClick={closeUsageLocations}>{t('Close')}</Button>}
        onCancel={closeUsageLocations}
        open={Boolean(usageEntry)}
        title={
          usageEntry
            ? t('Usage locations for {{name}}').replace('{{name}}', usageEntry.title || usageEntry.templateName)
            : t('Usage locations')
        }
      >
        {usageEntry?.status === 'disabled' || usageEntry?.status === 'archived' ? (
          <Alert
            message={
              usageEntry.status === 'archived'
                ? t('This JS Template belongs to an archived Source Project and is read-only.')
                : t('This JS Template belongs to a disabled Source Project.')
            }
            showIcon
            style={{ marginBottom: token.marginSM }}
            type="warning"
          />
        ) : null}
        {usageResult?.meta.hiddenCount ? (
          <Alert
            message={t('{{count}} usage locations are hidden by permissions.').replace(
              '{{count}}',
              String(usageResult.meta.hiddenCount),
            )}
            showIcon
            style={{ marginBottom: token.marginSM }}
            type="info"
          />
        ) : null}
        {usageError ? (
          <Alert
            action={
              usageEntry ? (
                <Button onClick={() => loadUsageLocations(usageEntry, usageRequestedPage.current)} size="small">
                  {t('Retry')}
                </Button>
              ) : null
            }
            message={usageError}
            showIcon
            type="error"
          />
        ) : usageLoading && !usageResult ? (
          <Flex align="center" justify="center" style={{ minHeight: 180 }}>
            <Spin aria-label={t('Loading usage locations')} />
          </Flex>
        ) : (
          <>
            <List
              dataSource={usageResult?.data || []}
              locale={{
                emptyText: <Empty description={t('No usage locations')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
              loading={usageLoading}
              renderItem={(usage) => (
                <List.Item key={usage.id}>
                  <List.Item.Meta
                    description={
                      <Space size="small" wrap>
                        <Typography.Text type="secondary">{usage.ownerTitle}</Typography.Text>
                        <Tag>{t(usage.kind)}</Tag>
                        <Tag color={usage.resolvedStatus === 'active' ? 'success' : 'warning'}>
                          {t(usage.resolvedStatus)}
                        </Tag>
                      </Space>
                    }
                    title={usage.locationTitle}
                  />
                </List.Item>
              )}
            />
            {usageResult && usageResult.meta.count > usageResult.meta.pageSize ? (
              <Flex justify="flex-end" style={{ marginTop: token.marginSM }}>
                <Pagination
                  current={usageResult.meta.page}
                  onChange={(page) => usageEntry && loadUsageLocations(usageEntry, page)}
                  pageSize={usageResult.meta.pageSize}
                  showSizeChanger={false}
                  total={usageResult.meta.count}
                />
              </Flex>
            ) : null}
          </>
        )}
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

function getDeleteDisabledReason(entry: JsTemplateCatalogEntry, t: (key: string) => string): string | undefined {
  if (entry.status === 'archived') {
    return t('Archived JS Templates cannot be deleted.');
  }
  if (entry.usageCount > 0) {
    return t('Detach all effective usages before deleting this JS Template.');
  }
  return undefined;
}

function getDeleteErrorMessage(error: unknown, t: (key: string) => string): string {
  const response = isRecord(error) && isRecord(error.response) ? error.response : null;
  const data = response && isRecord(response.data) ? response.data : null;
  const errors = data && Array.isArray(data.errors) ? data.errors : [];
  const serverError = errors.find(isRecord);
  if (serverError?.code === 'JS_TEMPLATE_USAGE_EXISTS') {
    const details = isRecord(serverError.details) ? serverError.details : null;
    const usageCount = typeof details?.usageCount === 'number' ? details.usageCount : null;
    if (usageCount !== null) {
      return t(
        'This JS Template is still used in {{count}} locations. Detach those usages before deleting it.',
      ).replace('{{count}}', String(usageCount));
    }
    return t('Detach all effective usages before deleting this JS Template.');
  }
  if (serverError?.code === 'JS_TEMPLATE_PROJECT_ARCHIVED') {
    return t('Archived JS Templates cannot be deleted.');
  }
  return t('Failed to delete JS Template');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export default JsTemplateCatalogPage;
