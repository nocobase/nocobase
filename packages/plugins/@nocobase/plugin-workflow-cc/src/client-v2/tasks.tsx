/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { CollectionFilter } from '@nocobase/client-v2';
import { useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import type { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import {
  TASK_STATUS as WORKFLOW_TASK_STATUS,
  getWorkflowTaskRegistry,
  useWorkflowTaskCounts,
  useWorkflowTaskRecord,
  type TaskTypeOptions,
  type WorkflowTaskApiClient,
  type WorkflowTaskFlowContext,
  type WorkflowTaskRecord,
  type WorkflowTaskRequestParams,
  type WorkflowTaskStatus,
} from '@nocobase/plugin-workflow/client-v2';
import { useMemoizedFn } from 'ahooks';
import { App, Button, Card, Descriptions, Flex, Space, Tag, Tooltip, theme } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { TASK_STATUS as CC_TASK_STATUS, TASK_TYPE_CC } from '../common/constants';
import { RemoteFlowModelRenderer } from './flow/RemoteFlowModelRenderer';
import { useTempAssociationSources } from './hooks/useTempAssociationSources';
import { NAMESPACE, useT } from './locale';
import { registerWorkflowCcCollections } from './utils/registerWorkflowCcCollections';
import { useWorkflowPluginCompat, type CanvasNodeLike, type WorkflowLike } from './workflowPluginCompat';

type RecordObject = Record<string, unknown>;

type CCTaskCardModel = FlowModel & {
  getCurrentRecord?: () => WorkflowTaskRecord;
};

type TaskCanvasNodeLike = CanvasNodeLike & {
  upstreamId?: number | string;
};

const TASK_LIST_APPENDS = [
  'node.id',
  'node.title',
  'node.updatedAt',
  'node.config',
  'workflow.id',
  'workflow.title',
  'workflow.enabled',
  'workflow.config',
  'workflow.nodes',
  'workflow.nodes.title',
  'workflow.nodes.key',
  'workflow.nodes.config',
  'execution.id',
  'execution.status',
];

const TASK_POPUP_APPENDS = ['node', 'job', 'workflow', 'workflow.nodes', 'execution', 'execution.jobs'];

const CC_TASK_FILTER_QUERY_KEY = 'workflowCcTasksFilter';
const DEFAULT_CC_TASK_FILTER = {
  $and: [{ title: { $includes: '' } }, { 'workflow.title': { $includes: '' } }],
};
const MOBILE_FILTER_POPOVER_WIDTH = 312;
const MOBILE_FILTER_CONTENT_MIN_WIDTH = 288;
const MOBILE_ACTION_BUTTON_HEIGHT = 28;
const MOBILE_ACTION_BUTTON_MIN_WIDTH = 44;

const STATUS_FILTER_MAP: Partial<Record<WorkflowTaskStatus, WorkflowTaskRequestParams>> = {
  [WORKFLOW_TASK_STATUS.PENDING]: {
    filter: {
      status: CC_TASK_STATUS.UNREAD,
    },
  },
  [WORKFLOW_TASK_STATUS.COMPLETED]: {
    filter: {
      status: CC_TASK_STATUS.READ,
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

function getRecordValue<T extends object = RecordObject>(record: WorkflowTaskRecord, path: string) {
  const value = getValue(record, path);
  return isRecordObject(value) ? (value as T) : undefined;
}

function getArrayRecordValue(record: WorkflowTaskRecord, path: string) {
  const value = getValue(record, path);
  return Array.isArray(value) ? value.filter(isRecordObject) : [];
}

function getTaskTitle(record: WorkflowTaskRecord, t: ReturnType<typeof useT>) {
  return (
    getStringValue(record, 'title') ??
    getStringValue(record, 'node.title') ??
    getStringValue(record, 'workflow.title') ??
    t('CC')
  );
}

function getStatusLabel(status: unknown, t: ReturnType<typeof useT>) {
  return status === CC_TASK_STATUS.READ ? t('Read') : t('Unread');
}

function getStatusColor(status: unknown) {
  return status === CC_TASK_STATUS.READ ? 'green' : 'gold';
}

function isEmptyFilterValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isEmptyFilterValue);
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isEmptyFilterValue);
  }
  return false;
}

function isEmptyFilter(filter: unknown) {
  return !isRecordObject(filter) || isEmptyFilterValue(filter);
}

function readTaskFilter(): Record<string, unknown> | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const raw = new URLSearchParams(window.location.search).get(CC_TASK_FILTER_QUERY_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    const filter = JSON.parse(raw);
    return isRecordObject(filter) && !isEmptyFilter(filter) ? filter : undefined;
  } catch {
    return undefined;
  }
}

function getTaskFilterRoute(
  filter: Record<string, unknown> | undefined,
  location: { pathname: string; search?: string; hash?: string },
) {
  const searchParams = new URLSearchParams(location.search);
  if (isEmptyFilter(filter)) {
    searchParams.delete(CC_TASK_FILTER_QUERY_KEY);
  } else {
    searchParams.set(CC_TASK_FILTER_QUERY_KEY, JSON.stringify(filter));
  }
  const search = searchParams.toString();
  return `${location.pathname}${search ? `?${search}` : ''}${location.hash ?? ''}`;
}

function mergeFilters(
  baseFilter: Record<string, unknown> | undefined,
  taskFilter: Record<string, unknown> | undefined,
) {
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

function getUpstreams(currentNode: TaskCanvasNodeLike | undefined, nodes: TaskCanvasNodeLike[]): TaskCanvasNodeLike[] {
  if (!currentNode || !nodes.length) {
    return [];
  }
  const upstreamId = currentNode.upstreamId;
  const upstreamNode = nodes.find((node) => node.id === upstreamId);
  if (!upstreamNode) {
    return [];
  }
  return [upstreamNode, ...getUpstreams(upstreamNode, nodes)];
}

function useCcTaskFlowModelContext(record: WorkflowTaskRecord) {
  const workflow = getRecordValue<WorkflowLike>(record, 'workflow');
  const node = getRecordValue<TaskCanvasNodeLike>(record, 'node');
  const nodes = getArrayRecordValue(record, 'workflow.nodes') as TaskCanvasNodeLike[];
  const availableUpstreams = useMemo(() => getUpstreams(node, nodes), [node, nodes]);
  const tempAssociationSources = useTempAssociationSources(workflow, availableUpstreams);
  const workflowPlugin = useWorkflowPluginCompat();
  const trigger = workflowPlugin.getTrigger(workflow?.type);

  return {
    availableUpstreams,
    node,
    nodes,
    tempAssociationSources,
    trigger,
    workflow,
  };
}

function WorkflowCcTaskStatusTag({ record }: { record: WorkflowTaskRecord }) {
  const t = useT();
  return <Tag color={getStatusColor(record.status)}>{getStatusLabel(record.status, t)}</Tag>;
}

function WorkflowCcTaskFallbackItem() {
  const { record } = useWorkflowTaskRecord();
  const t = useT();
  const { token } = theme.useToken();
  const title = getTaskTitle(record, t);
  const workflowTitle = getStringValue(record, 'workflow.title');

  return (
    <Card
      hoverable
      size="small"
      title={title}
      extra={workflowTitle}
      style={{ width: '100%' }}
      styles={{
        body: {
          padding: token.paddingSM,
        },
        extra: {
          color: token.colorTextDescription,
        },
        header: {
          minHeight: token.controlHeightLG,
          paddingInline: token.paddingSM,
        },
      }}
    >
      <Descriptions
        column={1}
        styles={{
          label: {
            width: '6em',
          },
        }}
        items={[
          {
            key: 'createdAt',
            label: t('Created at'),
            children: formatDateTime(record.createdAt),
          },
          {
            key: 'status',
            label: t('Status'),
            children: <WorkflowCcTaskStatusTag record={record} />,
          },
        ]}
      />
    </Card>
  );
}

function WorkflowCcTaskItem() {
  const { record } = useWorkflowTaskRecord();
  const { nodes, tempAssociationSources, workflow } = useCcTaskFlowModelContext(record);
  const taskCardUid = getStringValue(record, 'node.config.taskCardUid');
  const taskCardReloadKey = getStringValue(record, 'node.updatedAt');

  const handleModelLoaded = useCallback(
    (model: FlowModel) => {
      const taskCardModel = model as CCTaskCardModel;
      taskCardModel.getCurrentRecord = () => record;
      taskCardModel.context.defineProperty('workflow', {
        get: () => workflow,
        cache: false,
      });
      taskCardModel.context.defineProperty('nodes', {
        get: () => nodes,
        cache: false,
      });
      taskCardModel.context.defineProperty('tempAssociationSources', {
        get: () => tempAssociationSources,
        cache: false,
      });
    },
    [nodes, record, tempAssociationSources, workflow],
  );

  const mapModel = useCallback((model: FlowModel) => model.clone(), []);

  if (taskCardUid) {
    return (
      <RemoteFlowModelRenderer
        uid={taskCardUid}
        onModelLoaded={handleModelLoaded}
        mapModel={mapModel}
        reloadKey={taskCardReloadKey}
      />
    );
  }

  return <WorkflowCcTaskFallbackItem />;
}

function WorkflowCcTaskDetailActions() {
  const { record, refresh, openRecord } = useWorkflowTaskRecord();
  const ctx = useFlowContext() as WorkflowTaskFlowContext | undefined;
  const { message } = App.useApp();
  const t = useT();
  const status = record.status;
  const action = status === CC_TASK_STATUS.READ ? 'unread' : 'read';
  const title = status === CC_TASK_STATUS.READ ? t('Mark as unread') : t('Mark as read');
  const type = status === CC_TASK_STATUS.READ ? 'default' : 'primary';
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReadAction = useMemoizedFn(async () => {
    if (submittingRef.current) {
      return;
    }
    const recordId = record.id;
    if (recordId === undefined || recordId === null) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await ctx?.api.resource('workflowCcTasks')[action]?.({
        filterByTk: recordId,
      });
      openRecord?.({
        ...record,
        status: status === CC_TASK_STATUS.READ ? CC_TASK_STATUS.UNREAD : CC_TASK_STATUS.READ,
      });
      await refresh?.();
    } catch (error) {
      console.error('Failed to update workflow CC task status', error);
      message.error(t('Load failed'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  });

  return (
    <Button type={type} loading={submitting} disabled={submitting} onClick={handleReadAction}>
      {title}
    </Button>
  );
}

function WorkflowCcTaskFallbackDetail() {
  const { record } = useWorkflowTaskRecord();
  const t = useT();

  return (
    <Flex vertical gap="middle">
      <Descriptions
        column={1}
        bordered
        items={[
          {
            key: 'workflow',
            label: t('Workflow'),
            children: getStringValue(record, 'workflow.title') ?? '-',
          },
          {
            key: 'node',
            label: t('CC node'),
            children: getStringValue(record, 'node.title') ?? '-',
          },
          {
            key: 'status',
            label: t('Status'),
            children: <WorkflowCcTaskStatusTag record={record} />,
          },
          {
            key: 'execution',
            label: t('Execution'),
            children: getStringValue(record, 'execution.id') ?? '-',
          },
          {
            key: 'createdAt',
            label: t('Created at'),
            children: formatDateTime(record.createdAt),
          },
          {
            key: 'updatedAt',
            label: t('Updated at'),
            children: formatDateTime(record.updatedAt),
          },
          {
            key: 'readAt',
            label: t('Read at'),
            children: formatDateTime(record.readAt),
          },
        ]}
      />
      <Flex justify="end">
        <WorkflowCcTaskDetailActions />
      </Flex>
    </Flex>
  );
}

function WorkflowCcTaskDetail() {
  const { record } = useWorkflowTaskRecord();
  const { availableUpstreams, node, nodes, tempAssociationSources, trigger, workflow } =
    useCcTaskFlowModelContext(record);
  const ccUid = getStringValue(record, 'node.config.ccUid');

  const handleModelLoaded = useCallback(
    (model: FlowModel) => {
      model.context.defineProperty('flowSettingsEnabled', { value: false });
      model.context.defineProperty('disableBlockGridPadding', { value: true });
      model.context.defineProperty('view', {
        value: {
          inputArgs: {
            availableUpstreams,
            flowContext: {
              execution: getRecordValue(record, 'execution'),
              nodes,
              workflow,
            },
            node,
            trigger,
          },
        },
      });
      model.context.defineProperty('workflow', {
        value: workflow,
      });
      model.context.defineProperty('nodes', {
        value: nodes,
      });
      model.context.defineProperty('tempAssociationSources', {
        value: tempAssociationSources,
        cache: false,
      });
    },
    [availableUpstreams, node, nodes, record, tempAssociationSources, trigger, workflow],
  );

  if (ccUid && node && workflow) {
    return (
      <Flex vertical gap="middle">
        <RemoteFlowModelRenderer uid={ccUid} onModelLoaded={handleModelLoaded} />
        <Flex justify="end">
          <WorkflowCcTaskDetailActions />
        </Flex>
      </Flex>
    );
  }

  return <WorkflowCcTaskFallbackDetail />;
}

function useWorkflowCcTasksCollection() {
  const flowEngine = useFlowEngine() as FlowEngine;
  const getCollection = useMemoizedFn(
    () => flowEngine.dataSourceManager?.getDataSource?.('main')?.getCollection?.('workflowCcTasks'),
  );
  const [collection, setCollection] = useState(() => getCollection());

  useEffect(() => {
    registerWorkflowCcCollections(flowEngine);
    setCollection(getCollection());
  }, [flowEngine, getCollection]);

  return collection;
}

function useMobileActionButtonProps(onlyIcon?: boolean) {
  const { token } = theme.useToken();

  return useMemo(
    () =>
      onlyIcon
        ? {
            style: {
              height: MOBILE_ACTION_BUTTON_HEIGHT,
              minWidth: MOBILE_ACTION_BUTTON_MIN_WIDTH,
              paddingInline: token.paddingSM - token.lineWidth,
            },
          }
        : {},
    [onlyIcon, token.lineWidth, token.paddingSM],
  );
}

function WorkflowCcTaskFilterAction({ onlyIcon }: { onlyIcon?: boolean; reload?: () => Promise<void> }) {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const collection = useWorkflowCcTasksCollection();
  const filterText = t('Filter');
  const initialValue = readTaskFilter() ?? DEFAULT_CC_TASK_FILTER;
  const mobileButtonProps = useMobileActionButtonProps(onlyIcon);

  const handleFilterChange = useMemoizedFn(async (filter: Record<string, unknown> | undefined) => {
    navigate(getTaskFilterRoute(filter, location), { replace: true });
  });

  const filter = (
    <CollectionFilter
      key={location.search || 'empty-filter'}
      collection={collection}
      initialValue={initialValue}
      onChange={handleFilterChange}
      t={t}
      filterableFieldNames={['title', 'workflow']}
      buttonText={onlyIcon ? '' : undefined}
      showCount={false}
      popoverMinWidth={onlyIcon ? MOBILE_FILTER_CONTENT_MIN_WIDTH : undefined}
      popoverProps={
        onlyIcon
          ? {
              placement: 'bottomRight',
              styles: {
                body: {
                  maxWidth: 'calc(100vw - 32px)',
                  overflowX: 'auto',
                  width: MOBILE_FILTER_POPOVER_WIDTH,
                },
              },
            }
          : undefined
      }
      buttonProps={{
        'aria-label': onlyIcon ? filterText : undefined,
        ...mobileButtonProps,
      }}
    />
  );

  return onlyIcon ? <Tooltip title={filterText}>{filter}</Tooltip> : filter;
}

function WorkflowCcTaskActions({ onlyIcon, reload }: { onlyIcon?: boolean; reload?: () => Promise<void> }) {
  const ctx = useFlowContext() as WorkflowTaskFlowContext | undefined;
  const taskTypes = getWorkflowTaskRegistry(ctx);
  const { counts, reload: reloadCounts } = useWorkflowTaskCounts(ctx, taskTypes);
  const { message } = App.useApp();
  const t = useT();
  const mobileButtonProps = useMobileActionButtonProps(onlyIcon);
  const [readAllSubmitted, setReadAllSubmitted] = useState(false);
  const [readAllSubmitting, setReadAllSubmitting] = useState(false);
  const readAllSubmittingRef = useRef(false);
  const pendingCount = counts[TASK_TYPE_CC]?.pending;
  const readAllDisabled = readAllSubmitting || readAllSubmitted || pendingCount === 0;

  useEffect(() => {
    if (typeof pendingCount === 'number' && pendingCount > 0) {
      setReadAllSubmitted(false);
    }
  }, [pendingCount]);

  const handleRefresh = useMemoizedFn(async () => {
    try {
      await reload?.();
    } catch (error) {
      console.error('Failed to refresh workflow CC tasks', error);
      message.error(t('Load failed'));
    }
  });

  const handleReadAll = useMemoizedFn(async () => {
    if (readAllSubmittingRef.current || readAllDisabled) {
      return;
    }
    readAllSubmittingRef.current = true;
    setReadAllSubmitting(true);
    try {
      await ctx?.api.resource('workflowCcTasks').read?.();
      setReadAllSubmitted(true);
      if (reload) {
        await reload();
      } else {
        await reloadCounts();
      }
    } catch (error) {
      console.error('Failed to mark workflow CC tasks as read', error);
      message.error(t('Load failed'));
    } finally {
      readAllSubmittingRef.current = false;
      setReadAllSubmitting(false);
    }
  });

  const refreshButton = (
    <Button icon={<ReloadOutlined />} onClick={handleRefresh} aria-label={t('Refresh')} {...mobileButtonProps}>
      {onlyIcon ? null : t('Refresh')}
    </Button>
  );
  const readAllButton = (
    <Button
      icon={<CheckOutlined />}
      onClick={handleReadAll}
      aria-label={t('Mark all as read')}
      disabled={readAllDisabled}
      loading={readAllSubmitting}
      {...mobileButtonProps}
    >
      {onlyIcon ? null : t('Mark all as read')}
    </Button>
  );

  return (
    <Space size="small" wrap>
      {onlyIcon ? <Tooltip title={t('Refresh')}>{refreshButton}</Tooltip> : refreshButton}
      <WorkflowCcTaskFilterAction onlyIcon={onlyIcon} />
      {onlyIcon ? <Tooltip title={t('Mark all as read')}>{readAllButton}</Tooltip> : readAllButton}
    </Space>
  );
}

export function useCcTaskActionParams(status: WorkflowTaskStatus) {
  const statusParams = STATUS_FILTER_MAP[status] ?? {};
  const filter = mergeFilters(statusParams.filter as Record<string, unknown> | undefined, readTaskFilter());
  return {
    ...statusParams,
    filter,
    appends: TASK_LIST_APPENDS,
    except: ['workflow.options', 'execution.context', 'execution.output'],
  };
}

export const ccTaskType: TaskTypeOptions = {
  key: TASK_TYPE_CC,
  title: `{{t("CC to me", { ns: "${NAMESPACE}" })}}`,
  collection: 'workflowCcTasks',
  action: 'listMine',
  useActionParams: useCcTaskActionParams,
  Actions: WorkflowCcTaskActions,
  Item: WorkflowCcTaskItem,
  Detail: WorkflowCcTaskDetail,
  getPopupRecord: async (apiClient: WorkflowTaskApiClient, { params }: { params: WorkflowTaskRequestParams }) =>
    apiClient.resource('workflowCcTasks').get?.({
      ...params,
      appends: TASK_POPUP_APPENDS,
    }),
};
