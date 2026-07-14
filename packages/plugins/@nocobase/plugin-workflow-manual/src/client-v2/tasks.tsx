/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReloadOutlined } from '@ant-design/icons';
import {
  CollectionFilter,
  type CompiledFilter,
  ExtendCollectionsProvider,
  stripModernClientPrefix,
} from '@nocobase/client-v2';
import { useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import {
  getWorkflowTaskRecordKey,
  TASK_STATUS as WORKFLOW_TASK_STATUS,
  type TaskTypeOptions,
  useWorkflowTaskRecord,
  type WorkflowTaskRecord,
  type WorkflowTaskRequestParams,
  type WorkflowTaskStatus,
} from '@nocobase/plugin-workflow/client-v2';
import { App, Button, Card, Descriptions, Result, Space, Tag, Tooltip } from 'antd';
import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { TaskStatusOptions, TASK_STATUS, TASK_TYPE_MANUAL } from '../common/constants';
import { workflowManualTaskCollections } from './collections';
import { NAMESPACE, useT } from './locale';

type RecordObject = Record<string, unknown>;

const TASK_LIST_APPENDS = [
  'node.id',
  'node.title',
  'job.id',
  'job.status',
  'job.result',
  'workflow.id',
  'workflow.title',
  'workflow.enabled',
  'execution.id',
  'execution.status',
];

const TASK_LIST_EXCEPT = ['node.config', 'workflow.config', 'workflow.options'];
const MANUAL_TASK_FILTER_QUERY_KEY = 'workflowManualTasksFilter';
const DEFAULT_MANUAL_TASK_FILTER = {
  $and: [{ title: { $includes: '' } }, { 'workflow.title': { $includes: '' } }],
};

const STATUS_FILTER_MAP: Partial<Record<WorkflowTaskStatus, WorkflowTaskRequestParams>> = {
  [WORKFLOW_TASK_STATUS.PENDING]: {
    filter: {
      status: TASK_STATUS.PENDING,
      'execution.status': 0,
    },
  },
  [WORKFLOW_TASK_STATUS.COMPLETED]: {
    filter: {
      status: [TASK_STATUS.RESOLVED, TASK_STATUS.ABORTED, TASK_STATUS.REJECTED],
    },
  },
};

function isRecordObject(value: unknown): value is RecordObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getValue(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((current, key) => (isRecordObject(current) ? current[key] : undefined), source);
}

function getStringValue(record: WorkflowTaskRecord, path: string) {
  const value = getValue(record, path);
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

function isEmptyFilterValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isEmptyFilterValue);
  }
  if (isRecordObject(value)) {
    return Object.values(value).every(isEmptyFilterValue);
  }
  return false;
}

function isEmptyFilter(filter: unknown) {
  return !isRecordObject(filter) || isEmptyFilterValue(filter);
}

function readTaskFilter(): RecordObject | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const raw = new URLSearchParams(window.location.search).get(MANUAL_TASK_FILTER_QUERY_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    const filter: unknown = JSON.parse(raw);
    return isRecordObject(filter) && !isEmptyFilter(filter) ? filter : undefined;
  } catch {
    return undefined;
  }
}

function mergeFilters(baseFilter: RecordObject | undefined, taskFilter: RecordObject | undefined) {
  if (isEmptyFilter(baseFilter)) {
    return taskFilter ?? {};
  }
  if (isEmptyFilter(taskFilter)) {
    return baseFilter ?? {};
  }
  return {
    $and: [baseFilter, taskFilter],
  };
}

function getTaskFilterRoute(
  filter: RecordObject | undefined,
  location: { pathname: string; search?: string; hash?: string },
) {
  const searchParams = new URLSearchParams(location.search);
  if (isEmptyFilter(filter)) {
    searchParams.delete(MANUAL_TASK_FILTER_QUERY_KEY);
  } else {
    searchParams.set(MANUAL_TASK_FILTER_QUERY_KEY, JSON.stringify(filter));
  }
  const search = searchParams.toString();
  return `${location.pathname}${search ? `?${search}` : ''}${location.hash ?? ''}`;
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateTime(value: unknown) {
  const text = typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
  if (!text) {
    return '-';
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())} ${padDatePart(
    date.getHours(),
  )}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`;
}

function ManualTaskStatusTag({ record }: { record: WorkflowTaskRecord }) {
  const t = useT();
  const status = record.status;
  const executionStatus = getValue(record, 'execution.status');
  if (status == null && executionStatus != null && executionStatus !== 0) {
    return <Tag>{t('Unprocessed')}</Tag>;
  }

  const option = TaskStatusOptions.find((item) => item.value === status);
  if (!option) {
    return <Tag>{status == null ? '-' : String(status)}</Tag>;
  }
  return <Tag color={option.color}>{t(option.label)}</Tag>;
}

function WorkflowManualTaskItem() {
  const { record } = useWorkflowTaskRecord();
  const t = useT();
  const title = getStringValue(record, 'title') ?? getStringValue(record, 'node.title') ?? t('Task');
  const workflowTitle = getStringValue(record, 'workflow.title');

  return (
    <Card size="small" hoverable title={title} extra={workflowTitle}>
      <Descriptions
        column={1}
        size="small"
        items={[
          {
            key: 'createdAt',
            label: t('Created at'),
            children: formatDateTime(record.createdAt),
          },
          {
            key: 'status',
            label: t('Status'),
            children: <ManualTaskStatusTag record={record} />,
          },
        ]}
      />
    </Card>
  );
}

function useWorkflowManualTasksCollection() {
  const flowEngine = useFlowEngine();
  return flowEngine.context.dataSourceManager?.getDataSource?.('main')?.getCollection?.('workflowManualTasks');
}

function WorkflowManualTaskFilterAction({ onlyIcon }: { onlyIcon?: boolean }) {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const collection = useWorkflowManualTasksCollection();
  const filterText = t('Filter');
  const handleFilterChange = useCallback(
    (filter: CompiledFilter) => {
      navigate(getTaskFilterRoute(filter, location), { replace: true });
    },
    [location, navigate],
  );

  const filter = (
    <CollectionFilter
      key={location.search || 'empty-filter'}
      collection={collection}
      initialValue={readTaskFilter() ?? DEFAULT_MANUAL_TASK_FILTER}
      onChange={handleFilterChange}
      t={t}
      filterableFieldNames={['title', 'workflow']}
      buttonText={onlyIcon ? '' : undefined}
      showCount={false}
      buttonProps={{ 'aria-label': onlyIcon ? filterText : undefined }}
    />
  );

  return onlyIcon ? <Tooltip title={filterText}>{filter}</Tooltip> : filter;
}

function WorkflowManualTaskActions({ onlyIcon, reload }: { onlyIcon?: boolean; reload?: () => Promise<void> }) {
  const { message } = App.useApp();
  const t = useT();
  const handleRefresh = useCallback(async () => {
    try {
      await reload?.();
    } catch (error) {
      console.error('Failed to refresh workflow manual tasks', error);
      message.error(t('Load failed'));
    }
  }, [message, reload, t]);

  const refreshButton = (
    <Button icon={<ReloadOutlined />} onClick={handleRefresh} aria-label={t('Refresh')}>
      {onlyIcon ? null : t('Refresh')}
    </Button>
  );

  return (
    <ExtendCollectionsProvider collections={workflowManualTaskCollections}>
      <Space size="small" wrap>
        {onlyIcon ? <Tooltip title={t('Refresh')}>{refreshButton}</Tooltip> : refreshButton}
        <WorkflowManualTaskFilterAction onlyIcon={onlyIcon} />
      </Space>
    </ExtendCollectionsProvider>
  );
}

function normalizeRouterBasename(basename?: string) {
  if (!basename || basename === '/') {
    return '';
  }
  const trimmed = basename.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function stripRouterBasename(path: string, basename?: string) {
  const normalizedBasename = normalizeRouterBasename(basename);
  if (!normalizedBasename) {
    return path;
  }
  if (path === normalizedBasename) {
    return '/';
  }
  return path.startsWith(`${normalizedBasename}/`) ? path.slice(normalizedBasename.length) : path;
}

function getLegacyRouterBasename(basename?: string) {
  const normalizedBasename = normalizeRouterBasename(basename);
  const runtimePublicPath =
    typeof window === 'undefined'
      ? basename
      : (window as Window & { __nocobase_public_path__?: string }).__nocobase_public_path__ || basename;
  const modernPublicPath = normalizeRouterBasename(runtimePublicPath);
  const legacyPublicPath = normalizeRouterBasename(stripModernClientPrefix(modernPublicPath));
  const nestedAppPath =
    normalizedBasename === modernPublicPath
      ? ''
      : modernPublicPath && normalizedBasename.startsWith(`${modernPublicPath}/`)
        ? normalizedBasename.slice(modernPublicPath.length)
        : '';
  return `${legacyPublicPath}${nestedAppPath}`;
}

function getLegacyWorkflowTaskDetailPath(basename: string | undefined, recordKey: unknown) {
  const legacyBasename = getLegacyRouterBasename(basename);
  const encodedRecordKey = recordKey == null ? '' : encodeURIComponent(String(recordKey));
  const fallbackPath = `${legacyBasename}/admin/workflow/tasks/${TASK_TYPE_MANUAL}/pending${
    encodedRecordKey ? `/${encodedRecordKey}` : ''
  }`;
  if (typeof window === 'undefined' || recordKey == null) {
    return fallbackPath;
  }

  const routerPath = stripRouterBasename(window.location.pathname, basename);
  const taskRoutePrefix = '/admin/workflow/tasks/';
  if (routerPath.startsWith(taskRoutePrefix)) {
    const [currentTaskType, status, currentRecordKey, ...rest] = routerPath.slice(taskRoutePrefix.length).split('/');
    const matchesCurrentRecord =
      rest.length === 0 &&
      Boolean(status) &&
      currentTaskType === TASK_TYPE_MANUAL &&
      (currentRecordKey === String(recordKey) || currentRecordKey === encodedRecordKey);
    if (matchesCurrentRecord) {
      const routePath = `${legacyBasename}/admin/workflow/tasks/${TASK_TYPE_MANUAL}/${status}/${encodedRecordKey}`;
      return `${routePath}${window.location.search}${window.location.hash}`;
    }
  }

  return fallbackPath;
}

function WorkflowManualTaskDetail() {
  const { record } = useWorkflowTaskRecord();
  const context = useFlowContext() as
    | {
        router?: {
          basename?: string;
          getBasename?: () => string;
        };
      }
    | undefined;
  const basename = context?.router?.getBasename?.() ?? context?.router?.basename;
  const href = getLegacyWorkflowTaskDetailPath(basename, getWorkflowTaskRecordKey(record));
  const t = useT();

  return (
    <Result
      status="info"
      title={t('Manual task cannot be processed on the new page')}
      subTitle={t(
        'Manual tasks are not yet supported on the new page. Return to the legacy page to process this task.',
      )}
      extra={
        <Button type="primary" href={href}>
          {t('Return to legacy page')}
        </Button>
      }
    />
  );
}

export function useManualTaskActionParams(status: WorkflowTaskStatus) {
  const statusParams = STATUS_FILTER_MAP[status] ?? {};
  const filter = mergeFilters(statusParams.filter as RecordObject | undefined, readTaskFilter());
  return {
    ...statusParams,
    filter,
    appends: TASK_LIST_APPENDS,
    except: TASK_LIST_EXCEPT,
  };
}

export const manualTaskType: TaskTypeOptions = {
  key: TASK_TYPE_MANUAL,
  title: `{{t("My manual tasks", { ns: "${NAMESPACE}" })}}`,
  collection: 'workflowManualTasks',
  action: 'listMine',
  useActionParams: useManualTaskActionParams,
  Actions: WorkflowManualTaskActions,
  Item: WorkflowManualTaskItem,
  Detail: WorkflowManualTaskDetail,
};
