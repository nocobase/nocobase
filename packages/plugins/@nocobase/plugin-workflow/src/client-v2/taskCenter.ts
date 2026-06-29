/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import type { ComponentType } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const TASK_STATUS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;

export const TASK_STATUS_VALUES = [TASK_STATUS.PENDING, TASK_STATUS.COMPLETED, TASK_STATUS.ALL] as const;

export type WorkflowTaskStatus = (typeof TASK_STATUS_VALUES)[number];

export const WORKFLOW_TASKS_PAGE_SIZE = 20;

export type WorkflowTaskRecord = Record<string, unknown>;
export type WorkflowTaskRequestParams = Record<string, unknown>;
export type WorkflowTaskStats = Record<string, number | undefined> & {
  pending?: number;
  completed?: number;
  all?: number;
};
export type WorkflowTaskCounts = Record<string, WorkflowTaskStats>;

export interface WorkflowTaskActionsProps {
  onlyIcon?: boolean;
  reload?: () => Promise<void>;
}

export interface WorkflowTaskRecordContextValue {
  record: WorkflowTaskRecord;
  openRecord?: (record: WorkflowTaskRecord) => void;
  refresh?: () => Promise<void>;
}

export const WorkflowTaskRecordContext = createContext<WorkflowTaskRecordContextValue | null>(null);

export function useWorkflowTaskRecord() {
  const context = useContext(WorkflowTaskRecordContext);
  if (!context) {
    throw new Error('useWorkflowTaskRecord must be used within WorkflowTaskRecordContext');
  }
  return context;
}

export interface WorkflowTaskResource {
  [action: string]: ((params?: WorkflowTaskRequestParams) => Promise<unknown>) | undefined;
}

export interface WorkflowTaskApiClient {
  resource: (name: string) => WorkflowTaskResource;
}

export interface WorkflowTaskRegistry {
  get: (key: string) => TaskTypeOptions | undefined;
  getKeys: () => Iterable<string>;
  getEntities?: () => Iterable<[string, TaskTypeOptions]>;
}

export interface WorkflowTaskPlugin {
  taskTypes: WorkflowTaskRegistry;
}

export interface WorkflowTaskFlowContext {
  api: WorkflowTaskApiClient;
  app?: {
    eventBus?: EventTarget;
    pm?: {
      get: (name: string) => WorkflowTaskPlugin | undefined;
    };
  };
  router?: {
    navigate: (path: string, options?: { replace?: boolean }) => void;
  };
  t?: (key: string, options?: Record<string, unknown>) => string;
}

export interface TaskTypeOptions {
  key: string;
  title: string;
  collection: string;
  action?: string;
  useActionParams?: (status: WorkflowTaskStatus) => WorkflowTaskRequestParams | undefined;
  Actions?: ComponentType<WorkflowTaskActionsProps>;
  Item: ComponentType;
  Detail: ComponentType;
  getPopupRecord?: (
    apiClient: WorkflowTaskApiClient,
    context: { params: WorkflowTaskRequestParams },
  ) => Promise<unknown>;
  alwaysShow?: boolean;
}

export interface WorkflowTaskListPayload {
  data: WorkflowTaskRecord[];
  meta: Record<string, unknown>;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getObjectValue(value: unknown, key: string) {
  return isObjectRecord(value) ? value[key] : undefined;
}

function normalizeStats(stats: unknown): WorkflowTaskStats {
  if (!isObjectRecord(stats)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [key, typeof value === 'number' ? value : Number(value) || 0]),
  ) as WorkflowTaskStats;
}

export function normalizeWorkflowTaskStatus(status?: string): WorkflowTaskStatus {
  return TASK_STATUS_VALUES.includes(status as WorkflowTaskStatus)
    ? (status as WorkflowTaskStatus)
    : TASK_STATUS.PENDING;
}

export function normalizeWorkflowTaskRecordsResponse(response: unknown): WorkflowTaskListPayload {
  const payload = getObjectValue(response, 'data');
  const records = Array.isArray(payload) ? payload : getObjectValue(payload, 'data');
  const meta = getObjectValue(payload, 'meta');

  return {
    data: Array.isArray(records) ? records.filter(isObjectRecord) : [],
    meta: isObjectRecord(meta) ? meta : {},
  };
}

export function normalizeWorkflowTaskRecordResponse(response: unknown): WorkflowTaskRecord | null {
  const payload = getObjectValue(response, 'data');
  const nestedPayload = getObjectValue(payload, 'data');

  if (isObjectRecord(nestedPayload)) {
    return nestedPayload;
  }
  if (isObjectRecord(payload)) {
    return payload;
  }
  return null;
}

export function normalizeWorkflowTaskCountsResponse(response: unknown): WorkflowTaskCounts {
  const payload = getObjectValue(response, 'data');
  const records = Array.isArray(payload) ? payload : getObjectValue(payload, 'data');

  if (!Array.isArray(records)) {
    return {};
  }

  return records.reduce<WorkflowTaskCounts>((result, record) => {
    if (!isObjectRecord(record) || typeof record.type !== 'string') {
      return result;
    }
    result[record.type] = normalizeStats(record.stats);
    return result;
  }, {});
}

export function getWorkflowTaskRegistry(ctx?: WorkflowTaskFlowContext): WorkflowTaskRegistry | undefined {
  return ctx?.app?.pm?.get('workflow')?.taskTypes;
}

export function getWorkflowTaskTypeKeys(taskTypes?: WorkflowTaskRegistry) {
  return taskTypes ? Array.from(taskTypes.getKeys()) : [];
}

export function getWorkflowTaskRecordKey(record: WorkflowTaskRecord) {
  return record.id ?? record.uid ?? record.key;
}

export function getAvailableWorkflowTaskTypeKeys(
  taskTypes: WorkflowTaskRegistry | undefined,
  counts: WorkflowTaskCounts,
) {
  return getWorkflowTaskTypeKeys(taskTypes).filter((key) => {
    const type = taskTypes?.get(key);
    return Boolean(type?.alwaysShow || counts[key]?.all);
  });
}

export function useWorkflowTaskCounts(
  ctx: WorkflowTaskFlowContext | undefined,
  taskTypes: WorkflowTaskRegistry | undefined,
) {
  const [counts, setCounts] = useState<WorkflowTaskCounts>({});
  const taskTypeKeys = useMemo(() => getWorkflowTaskTypeKeys(taskTypes), [taskTypes]);
  const taskTypeKeySignature = taskTypeKeys.join('\n');

  const reload = useMemoizedFn(async () => {
    if (!ctx?.api || !taskTypeKeys.length) {
      setCounts({});
      return;
    }
    const listMine = ctx.api.resource('userWorkflowTasks').listMine;
    if (!listMine) {
      setCounts({});
      return;
    }
    const response = await listMine({
      filter: {
        type: taskTypeKeys,
      },
    });
    setCounts(normalizeWorkflowTaskCountsResponse(response));
  });

  const handleTaskUpdate = useMemoizedFn((event: Event) => {
    if (!('detail' in event)) {
      return;
    }
    const detail = (event as CustomEvent<unknown>).detail;
    if (!isObjectRecord(detail) || typeof detail.type !== 'string') {
      return;
    }
    setCounts((previous) => ({
      ...previous,
      [detail.type]: normalizeStats(detail.stats),
    }));
  });

  useEffect(() => {
    reload().catch((error) => {
      console.error('Failed to load workflow task counts', error);
    });
  }, [reload, taskTypeKeySignature]);

  useEffect(() => {
    const eventBus = ctx?.app?.eventBus;
    if (!eventBus) {
      return;
    }
    eventBus.addEventListener('ws:message:workflow:tasks:updated', handleTaskUpdate);
    return () => {
      eventBus.removeEventListener('ws:message:workflow:tasks:updated', handleTaskUpdate);
    };
  }, [ctx?.app?.eventBus, handleTaskUpdate]);

  const total = useMemo(() => Object.values(counts).reduce((sum, item) => sum + (item.pending || 0), 0), [counts]);

  return {
    counts,
    total,
    reload,
  };
}
