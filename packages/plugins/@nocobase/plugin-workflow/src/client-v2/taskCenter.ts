/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import type { ComponentType, ReactNode } from 'react';
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

export interface WorkflowTaskDetailModalProps {
  children?: ReactNode;
  mobile: boolean;
  onClose: () => void;
  record: WorkflowTaskRecord | null;
  title: ReactNode;
  type: TaskTypeOptions;
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
  DetailModal?: ComponentType<WorkflowTaskDetailModalProps>;
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

interface WorkflowTaskCountsStore {
  counts: WorkflowTaskCounts;
  eventBus?: EventTarget;
  eventHandler?: EventListener;
  inflight?: Promise<void>;
  listeners: Set<() => void>;
  version: number;
}

const workflowTaskCountsStoreMap = new WeakMap<WorkflowTaskFlowContext, Map<string, WorkflowTaskCountsStore>>();

function getWorkflowTaskCountsStore(ctx: WorkflowTaskFlowContext, signature: string) {
  let stores = workflowTaskCountsStoreMap.get(ctx);
  if (!stores) {
    stores = new Map<string, WorkflowTaskCountsStore>();
    workflowTaskCountsStoreMap.set(ctx, stores);
  }

  let store = stores.get(signature);
  if (!store) {
    store = {
      counts: {},
      listeners: new Set(),
      version: 0,
    };
    stores.set(signature, store);
  }
  return store;
}

function setWorkflowTaskCountsStore(store: WorkflowTaskCountsStore, counts: WorkflowTaskCounts) {
  store.version += 1;
  store.counts = counts;
  store.listeners.forEach((listener) => listener());
}

function updateWorkflowTaskCountsStore(
  store: WorkflowTaskCountsStore,
  updater: (previous: WorkflowTaskCounts) => WorkflowTaskCounts,
) {
  setWorkflowTaskCountsStore(store, updater(store.counts));
}

function syncWorkflowTaskCountsEventBus(store: WorkflowTaskCountsStore, eventBus: EventTarget | undefined) {
  if (store.eventBus === eventBus) {
    return;
  }
  if (store.eventBus && store.eventHandler) {
    store.eventBus.removeEventListener('ws:message:workflow:tasks:updated', store.eventHandler);
  }
  store.eventBus = eventBus;
  store.eventHandler = undefined;

  if (!eventBus) {
    return;
  }

  const handleTaskUpdate: EventListener = (event) => {
    if (!('detail' in event)) {
      return;
    }
    const detail = (event as CustomEvent<unknown>).detail;
    if (!isObjectRecord(detail) || typeof detail.type !== 'string') {
      return;
    }
    const taskType = detail.type;
    const stats = detail.stats;
    updateWorkflowTaskCountsStore(store, (previous) => ({
      ...previous,
      [taskType]: normalizeStats(stats),
    }));
  };
  store.eventHandler = handleTaskUpdate;
  eventBus.addEventListener('ws:message:workflow:tasks:updated', handleTaskUpdate);
}

function clearWorkflowTaskCountsEventBus(store: WorkflowTaskCountsStore) {
  if (store.eventBus && store.eventHandler) {
    store.eventBus.removeEventListener('ws:message:workflow:tasks:updated', store.eventHandler);
  }
  store.eventBus = undefined;
  store.eventHandler = undefined;
}

export function useWorkflowTaskCounts(
  ctx: WorkflowTaskFlowContext | undefined,
  taskTypes: WorkflowTaskRegistry | undefined,
) {
  const taskTypeKeys = useMemo(() => getWorkflowTaskTypeKeys(taskTypes), [taskTypes]);
  const taskTypeKeySignature = taskTypeKeys.join('\n');
  const store = useMemo(
    () => (ctx && taskTypeKeySignature ? getWorkflowTaskCountsStore(ctx, taskTypeKeySignature) : undefined),
    [ctx, taskTypeKeySignature],
  );
  const [counts, setCounts] = useState<WorkflowTaskCounts>(() => store?.counts ?? {});

  const loadCounts = useMemoizedFn(async (dedupeInflight: boolean) => {
    if (!ctx?.api || !taskTypeKeys.length || !store) {
      if (store) {
        setWorkflowTaskCountsStore(store, {});
      } else {
        setCounts({});
      }
      return;
    }
    const listMine = ctx.api.resource('userWorkflowTasks').listMine;
    if (!listMine) {
      setWorkflowTaskCountsStore(store, {});
      return;
    }

    if (store.inflight) {
      if (dedupeInflight) {
        await store.inflight;
        return;
      }
      await store.inflight.catch(() => undefined);
    }

    const requestVersion = store.version;
    const promise = listMine({
      filter: {
        type: taskTypeKeys,
      },
    })
      .then((response) => {
        if (store.version === requestVersion) {
          setWorkflowTaskCountsStore(store, normalizeWorkflowTaskCountsResponse(response));
        }
      })
      .finally(() => {
        if (store.inflight === promise) {
          store.inflight = undefined;
        }
      });
    store.inflight = promise;
    await promise;
  });

  const reload = useMemoizedFn(async () => {
    await loadCounts(false);
  });

  useEffect(() => {
    loadCounts(true).catch((error) => {
      console.error('Failed to load workflow task counts', error);
    });
  }, [loadCounts, taskTypeKeySignature]);

  useEffect(() => {
    if (!store) {
      setCounts({});
      return;
    }
    const listener = () => {
      setCounts(store.counts);
    };
    store.listeners.add(listener);
    setCounts(store.counts);
    return () => {
      store.listeners.delete(listener);
      if (store.listeners.size === 0) {
        clearWorkflowTaskCountsEventBus(store);
      }
    };
  }, [store]);

  useEffect(() => {
    if (!store) {
      return;
    }
    syncWorkflowTaskCountsEventBus(store, ctx?.app?.eventBus);
  }, [ctx?.app?.eventBus, store]);

  const total = useMemo(() => Object.values(counts).reduce((sum, item) => sum + (item.pending || 0), 0), [counts]);

  return {
    counts,
    total,
    reload,
  };
}
