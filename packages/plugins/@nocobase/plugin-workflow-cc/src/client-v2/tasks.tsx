/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import type { FlowModel } from '@nocobase/flow-engine';
import {
  TASK_STATUS as WORKFLOW_TASK_STATUS,
  useWorkflowTaskRecord,
  type TaskTypeOptions,
  type WorkflowTaskApiClient,
  type WorkflowTaskFlowContext,
  type WorkflowTaskRecord,
  type WorkflowTaskRequestParams,
  type WorkflowTaskStatus,
} from '@nocobase/plugin-workflow/client-v2';
import { useMemoizedFn } from 'ahooks';
import { App, Button, Card, Descriptions, Flex, Space, Tag, Tooltip, Typography } from 'antd';
import React, { useCallback, useMemo } from 'react';

import { TASK_STATUS as CC_TASK_STATUS, TASK_TYPE_CC } from '../common/constants';
import { RemoteFlowModelRenderer } from './flow/RemoteFlowModelRenderer';
import { useTempAssociationSources } from './hooks/useTempAssociationSources';
import { NAMESPACE, useT } from './locale';
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
  return <Tag>{getStatusLabel(record.status, t)}</Tag>;
}

function WorkflowCcTaskFallbackItem() {
  const { record } = useWorkflowTaskRecord();
  const t = useT();
  const title = getTaskTitle(record, t);
  const workflowTitle = getStringValue(record, 'workflow.title');

  return (
    <Card size="small" title={t(title)} extra={workflowTitle ? t(workflowTitle) : undefined}>
      <Descriptions
        column={1}
        size="small"
        items={[
          {
            key: 'createdAt',
            label: t('Created at'),
            children: getStringValue(record, 'createdAt') ?? '-',
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
  const { record, refresh } = useWorkflowTaskRecord();
  const ctx = useFlowContext() as WorkflowTaskFlowContext | undefined;
  const { message } = App.useApp();
  const t = useT();
  const status = record.status;
  const action = status === CC_TASK_STATUS.READ ? 'unread' : 'read';
  const title = status === CC_TASK_STATUS.READ ? t('Mark as unread') : t('Mark as read');
  const type = status === CC_TASK_STATUS.READ ? 'default' : 'primary';

  const handleReadAction = useMemoizedFn(async () => {
    const recordId = record.id;
    if (recordId === undefined || recordId === null) {
      return;
    }
    try {
      await ctx?.api.resource('workflowCcTasks')[action]?.({
        filterByTk: recordId,
      });
      await refresh?.();
    } catch (error) {
      console.error('Failed to update workflow CC task status', error);
      message.error(t('Load failed'));
    }
  });

  return (
    <Button type={type} onClick={handleReadAction}>
      {title}
    </Button>
  );
}

function WorkflowCcTaskFallbackDetail() {
  const { record } = useWorkflowTaskRecord();
  const t = useT();
  const title = getTaskTitle(record, t);

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between" gap="small">
        <Typography.Title level={5}>{t(title)}</Typography.Title>
        <WorkflowCcTaskDetailActions />
      </Flex>
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
            children: getStringValue(record, 'createdAt') ?? '-',
          },
          {
            key: 'updatedAt',
            label: t('Updated at'),
            children: getStringValue(record, 'updatedAt') ?? '-',
          },
          {
            key: 'readAt',
            label: t('Read at'),
            children: getStringValue(record, 'readAt') ?? '-',
          },
        ]}
      />
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
        <Flex justify="end">
          <WorkflowCcTaskDetailActions />
        </Flex>
        <RemoteFlowModelRenderer uid={ccUid} onModelLoaded={handleModelLoaded} />
      </Flex>
    );
  }

  return <WorkflowCcTaskFallbackDetail />;
}

function WorkflowCcTaskActions({ onlyIcon, reload }: { onlyIcon?: boolean; reload?: () => Promise<void> }) {
  const ctx = useFlowContext() as WorkflowTaskFlowContext | undefined;
  const { message } = App.useApp();
  const t = useT();

  const handleRefresh = useMemoizedFn(async () => {
    try {
      await reload?.();
    } catch (error) {
      console.error('Failed to refresh workflow CC tasks', error);
      message.error(t('Load failed'));
    }
  });

  const handleReadAll = useMemoizedFn(async () => {
    try {
      await ctx?.api.resource('workflowCcTasks').read?.();
      await reload?.();
    } catch (error) {
      console.error('Failed to mark workflow CC tasks as read', error);
      message.error(t('Load failed'));
    }
  });

  const refreshButton = (
    <Button icon={<ReloadOutlined />} onClick={handleRefresh} aria-label={t('Refresh')}>
      {onlyIcon ? null : t('Refresh')}
    </Button>
  );
  const readAllButton = (
    <Button icon={<CheckOutlined />} onClick={handleReadAll} aria-label={t('Mark all as read')}>
      {onlyIcon ? null : t('Mark all as read')}
    </Button>
  );

  return (
    <Space>
      {onlyIcon ? <Tooltip title={t('Refresh')}>{refreshButton}</Tooltip> : refreshButton}
      {onlyIcon ? <Tooltip title={t('Mark all as read')}>{readAllButton}</Tooltip> : readAllButton}
    </Space>
  );
}

export function useCcTaskActionParams(status: WorkflowTaskStatus) {
  const statusParams = STATUS_FILTER_MAP[status] ?? {};
  return {
    ...statusParams,
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
