/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource } from '@nocobase/flow-engine';
import type { KanbanBlockModel } from '../../KanbanBlockModel';
import {
  createKanbanColumnFilter,
  DEFAULT_KANBAN_PAGE_SIZE,
  getEnabledKanbanGroupOptions,
  getKanbanRecordKey,
  getKanbanRecordKeyValue,
  mergeKanbanFilters,
} from '../../utils';

export type DropResult = {
  source: { droppableId: string; index: number };
  destination?: { droppableId: string; index: number } | null;
};

export type ColumnState = {
  items: any[];
  page: number;
  hasNext: boolean;
  count?: number;
  loading: boolean;
  error?: string;
  loadedRefreshToken: number;
};

export type RuntimeColumn = {
  key: string;
  value: string;
  label: string;
  color: string;
  isUnknown?: boolean;
};

export type KanbanDesignSettingsHost = {
  columnKey: string;
  recordKey?: string;
  index: number;
};

export type ColumnRefreshMeta = {
  token: number;
  reason: 'global' | 'drag';
  activeRecordKey?: string;
};

export type KanbanRuntimeRecord = {
  id?: string | number;
  __kanbanRecordKey?: string;
  __kanbanRecordKeyValue?: any;
  __kanbanColumnKey?: string;
  [key: string]: any;
};

export const createInitialColumnState = (loading = true): ColumnState => ({
  items: [],
  page: 1,
  hasNext: false,
  loading,
  loadedRefreshToken: -1,
});

export const getRuntimeRecordKey = (
  record: KanbanRuntimeRecord,
  collection?: { filterTargetKey?: string | string[]; getFilterByTK?: (record: any) => any },
) => {
  return record?.__kanbanRecordKey || getKanbanRecordKey(record, collection);
};

export const normalizeKanbanRuntimeRecord = (
  record: any,
  collection?: { filterTargetKey?: string | string[]; getFilterByTK?: (record: any) => any },
): KanbanRuntimeRecord => {
  const recordKeyValue = getKanbanRecordKeyValue(record, collection);
  const recordKey =
    recordKeyValue === undefined || recordKeyValue === null || recordKeyValue === ''
      ? undefined
      : String(recordKeyValue);

  if (!recordKey) {
    return record;
  }

  return {
    ...record,
    __kanbanRecordKey: recordKey,
    __kanbanRecordKeyValue: recordKeyValue,
  };
};

export const dedupeColumnItemsByRecordKey = (
  items: KanbanRuntimeRecord[],
  collection?: { filterTargetKey?: string | string[]; getFilterByTK?: (record: any) => any },
) => {
  const seenIds = new Set<string>();

  return items.filter((item) => {
    const recordId = getRuntimeRecordKey(item, collection);
    if (recordId === undefined || recordId === null) {
      return true;
    }

    const normalizedId = String(recordId);
    if (seenIds.has(normalizedId)) {
      return false;
    }

    seenIds.add(normalizedId);
    return true;
  });
};

export const getKanbanCardRenderKey = (options: { columnKey: string; record: any; index: number }) => {
  const { columnKey, record, index } = options;
  const recordId = record?.__kanbanRecordKey ?? record?.id;

  return recordId === undefined || recordId === null ? `${columnKey}-${index}` : String(recordId);
};

export const getKanbanDesignSettingsHost = (options: {
  enabled: boolean;
  columns: RuntimeColumn[];
  itemsByColumn: Record<string, KanbanRuntimeRecord[]>;
  collection?: { filterTargetKey?: string | string[]; getFilterByTK?: (record: any) => any };
}): KanbanDesignSettingsHost | null => {
  const { enabled, columns, itemsByColumn, collection } = options;

  if (!enabled) {
    return null;
  }

  for (const column of columns) {
    const items = itemsByColumn[column.key] || [];
    if (!items.length) {
      continue;
    }

    const recordKey = getRuntimeRecordKey(items[0], collection);
    return {
      columnKey: column.key,
      recordKey: recordKey == null ? undefined : String(recordKey),
      index: 0,
    };
  }

  return null;
};

export const shouldMountUnknownColumn = (options: {
  state?: ColumnState;
  refreshMeta?: ColumnRefreshMeta;
  displayItems?: KanbanRuntimeRecord[];
}) => {
  const { state, refreshMeta, displayItems = [] } = options;

  if (!state) {
    return true;
  }

  const refreshToken = refreshMeta?.token || 0;
  if (refreshToken > state.loadedRefreshToken) {
    return true;
  }

  if (state.loading || state.error) {
    return true;
  }

  return displayItems.length > 0;
};

export const shouldHideUnknownColumn = (options: {
  state?: ColumnState;
  refreshMeta?: ColumnRefreshMeta;
  displayItems?: KanbanRuntimeRecord[];
}) => {
  const { state, refreshMeta, displayItems = [] } = options;

  if (!shouldMountUnknownColumn(options)) {
    return false;
  }

  if (displayItems.length > 0 || state?.error) {
    return false;
  }

  if (!state) {
    return true;
  }

  const refreshToken = refreshMeta?.token || 0;
  return refreshToken > state.loadedRefreshToken || state.loading;
};

export const isKanbanDesignSettingsHost = (options: {
  host: KanbanDesignSettingsHost | null | undefined;
  columnKey: string;
  record: KanbanRuntimeRecord;
  index: number;
  collection?: { filterTargetKey?: string | string[]; getFilterByTK?: (record: any) => any };
}) => {
  const { host, columnKey, record, index, collection } = options;

  if (!host || host.columnKey !== columnKey) {
    return false;
  }

  if (host.recordKey != null) {
    const recordKey = getRuntimeRecordKey(record, collection);
    return recordKey != null && String(recordKey) === host.recordKey;
  }

  return index === host.index;
};

export const removeKanbanColumnOverride = (record: KanbanRuntimeRecord): KanbanRuntimeRecord => {
  if (!record?.__kanbanColumnKey) {
    return record;
  }

  const { __kanbanColumnKey, ...rest } = record;
  return rest;
};

export const applyKanbanColumnOverride = (options: {
  record: KanbanRuntimeRecord;
  sourceColumnKey: string;
  targetColumnKey: string;
}) => {
  const { record, sourceColumnKey, targetColumnKey } = options;

  if (sourceColumnKey === targetColumnKey) {
    return removeKanbanColumnOverride(record);
  }

  return {
    ...record,
    __kanbanColumnKey: targetColumnKey,
  };
};

export const moveKanbanRecordByCoordinates = (options: {
  itemsByColumn: Record<string, KanbanRuntimeRecord[]>;
  sourceColumnKey: string;
  sourceIndex: number;
  targetColumnKey: string;
  targetIndex: number;
}) => {
  const { itemsByColumn, sourceColumnKey, sourceIndex, targetColumnKey, targetIndex } = options;
  const sourceItems = itemsByColumn[sourceColumnKey] || [];

  if (!sourceItems[sourceIndex]) {
    return itemsByColumn;
  }

  if (sourceColumnKey === targetColumnKey) {
    const nextItems = [...sourceItems];
    const [movedRecord] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(Math.max(0, Math.min(targetIndex, nextItems.length)), 0, movedRecord);

    return {
      ...itemsByColumn,
      [sourceColumnKey]: nextItems,
    } as Record<string, KanbanRuntimeRecord[]>;
  }

  const nextSourceItems = [...sourceItems];
  const [movedRecord] = nextSourceItems.splice(sourceIndex, 1);
  const nextTargetItems = [...(itemsByColumn[targetColumnKey] || [])];
  nextTargetItems.splice(Math.max(0, Math.min(targetIndex, nextTargetItems.length)), 0, movedRecord);

  return {
    ...itemsByColumn,
    [sourceColumnKey]: nextSourceItems,
    [targetColumnKey]: nextTargetItems,
  } as Record<string, KanbanRuntimeRecord[]>;
};

export const areKanbanRecordListsEqual = (
  left: KanbanRuntimeRecord[] = [],
  right: KanbanRuntimeRecord[] = [],
  collection?: { filterTargetKey?: string | string[]; getFilterByTK?: (record: any) => any },
) => {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => {
    const nextItem = right[index];
    return (
      item === nextItem &&
      getRuntimeRecordKey(item, collection) === getRuntimeRecordKey(nextItem, collection) &&
      item?.__kanbanColumnKey === nextItem?.__kanbanColumnKey
    );
  });
};

export const reuseKanbanRecordReferences = (options: {
  previousItems?: KanbanRuntimeRecord[];
  nextItems?: KanbanRuntimeRecord[];
  collection?: { filterTargetKey?: string | string[]; getFilterByTK?: (record: any) => any };
  skipRecordKeys?: Array<string | undefined>;
}) => {
  const { previousItems = [], nextItems = [], collection, skipRecordKeys = [] } = options;
  const previousItemMap = new Map<string, KanbanRuntimeRecord>();
  const skipKeySet = new Set(skipRecordKeys.filter(Boolean).map(String));

  previousItems.forEach((item) => {
    const recordKey = getRuntimeRecordKey(item, collection);
    if (recordKey === undefined || recordKey === null) {
      return;
    }

    const normalizedKey = String(recordKey);
    if (!previousItemMap.has(normalizedKey)) {
      previousItemMap.set(normalizedKey, item);
    }
  });

  return nextItems.map((item) => {
    const recordKey = getRuntimeRecordKey(item, collection);
    if (recordKey === undefined || recordKey === null) {
      return item;
    }

    const normalizedKey = String(recordKey);
    if (skipKeySet.has(normalizedKey)) {
      return item;
    }

    const previousItem = previousItemMap.get(normalizedKey);
    if (!previousItem) {
      return item;
    }

    if (previousItem?.__kanbanColumnKey !== item?.__kanbanColumnKey) {
      return item;
    }

    return previousItem;
  });
};

export const createColumnResource = (
  model: KanbanBlockModel,
  column: RuntimeColumn,
  page: number,
  pageSize?: number,
) => {
  const params = model.getResourceSettingsInitParams();
  const baseResource = model.resource;
  const resource = model.context.createResource(MultiRecordResource);

  resource.setDataSourceKey(params.dataSourceKey);
  resource.setResourceName(params.associationName || params.collectionName);
  if (params.sourceId !== undefined && params.sourceId !== null) {
    resource.setSourceId(params.sourceId as any);
  }
  if (baseResource.getFilterByTk() !== undefined && baseResource.getFilterByTk() !== null) {
    resource.setFilterByTk(baseResource.getFilterByTk());
  }
  if (baseResource.getAppends()?.length) {
    resource.setAppends([...baseResource.getAppends()]);
  }
  if (baseResource.getFields()?.length) {
    resource.setFields([...baseResource.getFields()]);
  }
  if (baseResource.getExcept()?.length) {
    resource.setExcept([...baseResource.getExcept()]);
  }
  if (baseResource.getWhitelist()?.length) {
    resource.setWhitelist([...baseResource.getWhitelist()]);
  }
  if (baseResource.getBlacklist()?.length) {
    resource.setBlacklist([...baseResource.getBlacklist()]);
  }
  if (baseResource.getSort()?.length) {
    resource.setSort([...baseResource.getSort()]);
  }

  resource.setPageSize(pageSize || model.getPageSize() || DEFAULT_KANBAN_PAGE_SIZE);
  resource.setPage(page);

  const groupField = model.getGroupField();
  const enabledValues = getEnabledKanbanGroupOptions(model.getConfiguredGroupOptions()).map((item) => item.value);
  const mergedFilter = mergeKanbanFilters(
    baseResource.getFilter(),
    createKanbanColumnFilter({
      field: groupField,
      columnValue: column.value,
      enabledValues,
      isUnknown: column.isUnknown,
    }),
  );

  if (mergedFilter) {
    resource.setFilter(mergedFilter);
  }

  return resource;
};
