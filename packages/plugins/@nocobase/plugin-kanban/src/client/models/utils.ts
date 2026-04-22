/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const KANBAN_UNKNOWN_COLUMN_KEY = '__unknown__';
export const DEFAULT_KANBAN_PAGE_SIZE = 10;
export const DEFAULT_KANBAN_COLUMN_WIDTH = 300;

export const KANBAN_COLOR_OPTIONS = [
  'default',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
  'magenta',
];

const KANBAN_COLOR_VALUE_MAP: Record<string, string> = {
  default: '#d9d9d9',
  red: '#ff4d4f',
  volcano: '#fa541c',
  orange: '#fa8c16',
  gold: '#faad14',
  lime: '#a0d911',
  green: '#52c41a',
  cyan: '#13c2c2',
  blue: '#1677ff',
  geekblue: '#2f54eb',
  purple: '#722ed1',
  magenta: '#eb2f96',
};

export type KanbanGroupOption = {
  value: string;
  label: string;
  color?: string;
  enabled?: boolean;
  isUnknown?: boolean;
};

export type KanbanGroupingValue = {
  groupField?: string;
  groupOptions?: KanbanGroupOption[];
  groupTitleField?: string;
  groupColorField?: string;
};

export type KanbanColumnRecord = {
  id: string | number;
  [key: string]: any;
};

export type KanbanColumn = {
  key: string;
  value: string;
  label: string;
  color?: string;
  isUnknown?: boolean;
  records: KanbanColumnRecord[];
};

type KanbanCollectionIdentity = {
  filterTargetKey?: string | string[];
  getFilterByTK?: (record: any) => any;
};

export const KANBAN_GROUP_FIELD_INTERFACES = ['select', 'm2o'] as const;

const MULTIPLE_GROUP_FIELD_INTERFACES = new Set(['m2m', 'o2m']);
const ASSOCIATION_GROUP_FIELD_INTERFACES = new Set(['m2o', 'm2m', 'o2m', 'obo', 'oho']);

const normalizeFilterTargetKey = (filterTargetKey: any) => {
  if (typeof filterTargetKey === 'string') {
    return filterTargetKey;
  }

  if (Array.isArray(filterTargetKey) && filterTargetKey.length === 1) {
    return filterTargetKey[0];
  }

  return undefined;
};

const toStringValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value);
};

const getAssociationTargetValue = (
  value: any,
  field?: { targetKey?: string; targetCollection?: { filterTargetKey?: string | string[] } },
) => {
  const targetKey = field?.targetKey || normalizeFilterTargetKey(field?.targetCollection?.filterTargetKey);

  if (!targetKey || !value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value?.[targetKey];
};

const extractRelationValue = (
  value: any,
  field?: {
    name?: string;
    interface?: string;
    targetKey?: string;
    targetCollection?: { filterTargetKey?: string | string[] };
  },
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return null;
  }

  return toStringValue(
    getAssociationTargetValue(value, field) ?? value.id ?? value.value ?? value.filterByTk ?? value.key,
  );
};

const extractRelationValues = (
  value: any,
  field?: {
    name?: string;
    interface?: string;
    targetKey?: string;
    targetCollection?: { filterTargetKey?: string | string[] };
  },
): string[] => {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => extractRelationValue(item, field)).filter(Boolean) as string[];
  }

  if (Array.isArray(value?.rows)) {
    return value.rows.map((item: any) => extractRelationValue(item, field)).filter(Boolean) as string[];
  }

  const relationValue = extractRelationValue(value, field);
  return relationValue ? [relationValue] : [];
};

const flattenAnd = (filter: Record<string, any> | undefined) => {
  if (!filter) {
    return [] as Record<string, any>[];
  }

  if (Array.isArray(filter.$and)) {
    return filter.$and.filter(Boolean);
  }

  return [filter];
};

export const getDefaultKanbanColor = (index: number, fallback?: string) => {
  if (fallback) {
    return fallback;
  }

  return KANBAN_COLOR_OPTIONS[index % KANBAN_COLOR_OPTIONS.length];
};

export const resolveKanbanColorValue = (color?: string) => {
  if (!color) {
    return KANBAN_COLOR_VALUE_MAP.default;
  }

  if (KANBAN_COLOR_VALUE_MAP[color]) {
    return KANBAN_COLOR_VALUE_MAP[color];
  }

  return color;
};

export const toKanbanAlphaColor = (color?: string, alpha = 1) => {
  const resolvedColor = resolveKanbanColorValue(color);

  if (resolvedColor.startsWith('#')) {
    const normalized = resolvedColor.slice(1);
    const hex =
      normalized.length === 3
        ? normalized
            .split('')
            .map((char) => char + char)
            .join('')
        : normalized;

    if (hex.length === 6) {
      const red = Number.parseInt(hex.slice(0, 2), 16);
      const green = Number.parseInt(hex.slice(2, 4), 16);
      const blue = Number.parseInt(hex.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
  }

  const rgbMatch = resolvedColor.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const [red = '217', green = '217', blue = '217'] = rgbMatch[1].split(',').map((item) => item.trim());
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  return resolvedColor;
};

export const normalizeKanbanCardOpenMode = (value?: string) => {
  if (value === 'modal') {
    return 'dialog';
  }

  if (value === 'page') {
    return 'embed';
  }

  return value === 'dialog' || value === 'embed' ? value : 'drawer';
};

export const normalizeKanbanPopupSize = (value?: string) => {
  return value === 'small' || value === 'large' ? value : 'medium';
};

export const isKanbanGroupField = (field: any) => {
  return !!field?.interface && KANBAN_GROUP_FIELD_INTERFACES.includes(field.interface) && !isMultipleGroupField(field);
};

export const isAssociationGroupField = (field: any) => {
  return ASSOCIATION_GROUP_FIELD_INTERFACES.has(field?.interface);
};

export const isMultipleGroupField = (field: any) => {
  return MULTIPLE_GROUP_FIELD_INTERFACES.has(field?.interface);
};

export const getKanbanCollectionFields = (collection: any) => {
  if (typeof collection?.getFields === 'function') {
    return collection.getFields();
  }

  return collection?.fields || collection?.options?.fields || [];
};

export const getKanbanCollectionFieldMetadata = (collection: any) => {
  return getKanbanCollectionFields(collection).map((field: any) => ({
    name: field?.name,
    interface: field?.interface,
    foreignKey: field?.foreignKey,
    scopeKey: field?.scopeKey || field?.options?.scopeKey,
    uiSchema: field?.uiSchema
      ? {
          title: field.uiSchema.title,
        }
      : undefined,
  }));
};

export const getKanbanFieldScopeKey = (field: any) => {
  return field?.scopeKey || field?.options?.scopeKey;
};

export const getKanbanGroupFieldSortScopeKeys = (field?: any) => {
  if (!field?.name) {
    return [] as string[];
  }

  if (!isAssociationGroupField(field) || !field?.foreignKey) {
    return [field.name];
  }

  return [...new Set([field.foreignKey, field.name].filter(Boolean))];
};

export const getKanbanPreferredSortScopeKey = (field?: any) => {
  return getKanbanGroupFieldSortScopeKeys(field)[0];
};

export const shouldMigrateKanbanSortFieldScope = (options: { groupField?: any; sortField?: any }) => {
  const { groupField, sortField } = options;
  const currentScopeKey = getKanbanFieldScopeKey(sortField);

  if (!currentScopeKey || !groupField?.name || !isAssociationGroupField(groupField) || !groupField?.foreignKey) {
    return false;
  }

  return currentScopeKey === groupField.name && currentScopeKey !== groupField.foreignKey;
};

export const getKanbanDefaultSortFieldName = (groupFieldName?: string) => {
  if (!groupFieldName) {
    return undefined;
  }

  return `${groupFieldName}_sort`;
};

export const getKanbanCollectionField = (collection: any, fieldName?: string) => {
  if (!fieldName) {
    return undefined;
  }

  if (typeof collection?.getField === 'function') {
    return collection.getField(fieldName);
  }

  return getKanbanCollectionFields(collection).find((field: any) => field?.name === fieldName);
};

export const getKanbanCollectionFilterTargetKey = (collection: any) => {
  if (typeof collection?.getFilterTargetKey === 'function') {
    return collection.getFilterTargetKey();
  }

  return (
    normalizeFilterTargetKey(collection?.filterTargetKey) ||
    collection?.targetKey ||
    getKanbanCollectionFields(collection).find((field: any) => field?.primaryKey)?.name ||
    'id'
  );
};

export const getKanbanFieldFilterPath = (field?: {
  name?: string;
  interface?: string;
  targetKey?: string;
  targetCollection?: { filterTargetKey?: string | string[] };
}) => {
  if (!field?.name) {
    return undefined;
  }

  if (!isAssociationGroupField(field)) {
    return field.name;
  }

  const targetKey = field.targetKey || normalizeFilterTargetKey(field.targetCollection?.filterTargetKey) || 'id';

  return `${field.name}.${targetKey}`;
};

export const getKanbanCollectionTitleField = (collection: any) => {
  return (
    collection?.titleField || collection?.titleCollectionField?.name || getKanbanCollectionFilterTargetKey(collection)
  );
};

export const getKanbanCollectionSelectableFields = (collection: any) => {
  return getKanbanCollectionFields(collection).filter((field: any) => {
    return field?.name && !isMultipleGroupField(field);
  });
};

export const getKanbanCollectionFieldOptions = (collection: any) => {
  return getKanbanCollectionSelectableFields(collection).map((field: any) => ({
    label: field.title || field.uiSchema?.title || field.name,
    value: field.name,
  }));
};

export const getKanbanFieldEnumColor = (field: any, value: any) => {
  const normalizedValue = toStringValue(extractRelationValue(value, field) ?? value);
  if (!normalizedValue) {
    return undefined;
  }

  const enumOptions = Array.isArray(field?.uiSchema?.enum) ? field.uiSchema.enum : [];
  const matchedOption = enumOptions.find((item: any) => {
    return String(item?.value ?? item?.name ?? item?.id ?? '') === normalizedValue;
  });

  return matchedOption?.color;
};

export const resolveKanbanFieldColorValue = (field: any, value: any) => {
  const enumColor = getKanbanFieldEnumColor(field, value);
  if (enumColor) {
    return enumColor;
  }

  const normalizedValue = toStringValue(extractRelationValue(value, field) ?? value);
  if (!normalizedValue) {
    return undefined;
  }

  if (
    KANBAN_COLOR_OPTIONS.includes(normalizedValue) ||
    normalizedValue.startsWith('#') ||
    /^rgba?\(/i.test(normalizedValue)
  ) {
    return normalizedValue;
  }

  return undefined;
};

export const getKanbanGroupFieldCandidates = (collection: any) => {
  return getKanbanCollectionFields(collection)
    .filter((field: any) => isKanbanGroupField(field))
    .map((field: any) => ({
      label: field.title || field.uiSchema?.title || field.name,
      value: field.name,
    }));
};

export const getKanbanInlineGroupOptions = (field?: any, savedOptions: Array<Partial<KanbanGroupOption>> = []) => {
  if (!field) {
    return [] as KanbanGroupOption[];
  }

  const enumOptions = field?.uiSchema?.enum;
  if (!Array.isArray(enumOptions)) {
    return [] as KanbanGroupOption[];
  }

  return normalizeKanbanGroupOptions(
    enumOptions.map((item: any) => ({
      value: item.value,
      label: item.label ?? item.title ?? item.uiSchema?.title ?? item.name,
      color: item.color,
    })),
    savedOptions,
  );
};

const getKanbanGroupOptionLabel = (item: Partial<KanbanGroupOption> & Record<string, any>) => {
  const resolvedLabel = item?.label ?? item?.title ?? item?.uiSchema?.title ?? item?.name;

  if (typeof resolvedLabel === 'string' || typeof resolvedLabel === 'number' || typeof resolvedLabel === 'boolean') {
    return String(resolvedLabel);
  }

  return String(item?.value ?? '');
};

export const areKanbanGroupOptionsEqual = (
  left: Array<Partial<KanbanGroupOption>> = [],
  right: Array<Partial<KanbanGroupOption>> = [],
) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => {
    const next = right[index];
    return (
      String(item?.value ?? '') === String(next?.value ?? '') &&
      String(item?.label ?? '') === String(next?.label ?? '') &&
      String(item?.color ?? '') === String(next?.color ?? '') &&
      Boolean(item?.isUnknown) === Boolean(next?.isUnknown)
    );
  });
};

export const isSameKanbanGroupingValue = (
  left?: { groupField?: string; groupOptions?: KanbanGroupOption[] },
  right?: { groupField?: string; groupOptions?: KanbanGroupOption[] },
) => {
  return (
    String(left?.groupField ?? '') === String(right?.groupField ?? '') &&
    areKanbanGroupOptionsEqual(left?.groupOptions || [], right?.groupOptions || [])
  );
};

export const normalizeKanbanGroupOptions = (
  sourceOptions: Array<Partial<KanbanGroupOption>>,
  savedOptions: Array<Partial<KanbanGroupOption>> = [],
  options: {
    useDefaultColors?: boolean;
    preserveSavedColors?: boolean;
  } = {},
) => {
  const { useDefaultColors = false, preserveSavedColors = true } = options;
  const savedMap = new Map(savedOptions.map((item) => [String(item.value), item]));
  const sourceMap = new Map(sourceOptions.map((item) => [String(item.value ?? ''), item]));
  const mergedOptions = [
    ...savedOptions.map((item) => sourceMap.get(String(item.value ?? ''))).filter(Boolean),
    ...sourceOptions.filter((item) => !savedMap.has(String(item.value ?? ''))),
  ].filter((item): item is Partial<KanbanGroupOption> => Boolean(item));

  return mergedOptions.map((item) => {
    const value = String(item.value ?? '');
    const saved = savedMap.get(value);
    const sourceColor = typeof item.color === 'string' && item.color !== 'default' ? item.color : undefined;
    const savedColor =
      preserveSavedColors && typeof saved?.color === 'string' && saved.color !== 'default' ? saved.color : undefined;
    const resolvedColor = sourceColor || savedColor || (useDefaultColors ? getDefaultKanbanColor(0) : undefined);

    return {
      value,
      label: saved?.label ? String(saved.label) : getKanbanGroupOptionLabel(item),
      color: resolvedColor,
      isUnknown: item.isUnknown ?? saved?.isUnknown,
    } satisfies KanbanGroupOption;
  });
};

export const reorderKanbanGroupOptions = (
  options: KanbanGroupOption[] = [],
  activeValue?: string,
  overValue?: string,
) => {
  if (!activeValue || !overValue || activeValue === overValue) {
    return options;
  }

  const oldIndex = options.findIndex((item) => item.value === activeValue);
  const newIndex = options.findIndex((item) => item.value === overValue);
  if (oldIndex < 0 || newIndex < 0) {
    return options;
  }

  const next = [...options];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return next;
};

export const orderKanbanGroupOptionsBySelection = (
  options: KanbanGroupOption[] = [],
  selectedValues: Array<string | number> = [],
) => {
  const selectedValueKeys = selectedValues.map((value) => String(value));
  const selectedValueKeySet = new Set(selectedValueKeys);
  const optionMap = new Map(options.map((item) => [String(item.value), item]));

  const orderedSelected = selectedValueKeys
    .map((value) => optionMap.get(value))
    .filter((item): item is KanbanGroupOption => Boolean(item))
    .map((item) => ({ ...item }));

  const remaining = options.filter((item) => !selectedValueKeySet.has(String(item.value))).map((item) => ({ ...item }));

  return [...orderedSelected, ...remaining];
};

export const getEnabledKanbanGroupOptions = (options: KanbanGroupOption[] = []) => {
  return options.filter((item) => !item.isUnknown);
};

export const getUnknownKanbanColumn = () => {
  return {
    value: KANBAN_UNKNOWN_COLUMN_KEY,
    key: KANBAN_UNKNOWN_COLUMN_KEY,
    label: 'Unknown',
    color: 'default',
    isUnknown: true,
    records: [] as KanbanColumnRecord[],
  } satisfies KanbanColumn & KanbanGroupOption;
};

export const getRecordGroupValues = (record: any, field: { name: string; interface?: string }) => {
  const fieldValue = record?.[field?.name];

  if (isAssociationGroupField(field)) {
    return isMultipleGroupField(field)
      ? extractRelationValues(fieldValue, field)
      : extractRelationValues(fieldValue, field).slice(0, 1);
  }

  const scalarValue = toStringValue(fieldValue);
  return scalarValue ? [scalarValue] : [];
};

export const getRecordKanbanColumnKey = (options: {
  record: any;
  groupField?: { name: string; interface?: string };
  groupOptions?: Array<Pick<KanbanGroupOption, 'value'>>;
}) => {
  const { record, groupField, groupOptions = [] } = options;

  if (!groupField) {
    return undefined;
  }

  const recordValues = new Set(getRecordGroupValues(record, groupField).map((value) => String(value)));
  const matchedOption = groupOptions.find((item) => recordValues.has(String(item.value)));

  return matchedOption ? String(matchedOption.value) : KANBAN_UNKNOWN_COLUMN_KEY;
};

export const getKanbanRecordKeyValue = (record: any, collection?: KanbanCollectionIdentity) => {
  if (!record) {
    return undefined;
  }

  try {
    const filterByTk = collection?.getFilterByTK?.(record);
    if (filterByTk !== undefined && filterByTk !== null && filterByTk !== '') {
      return filterByTk;
    }
  } catch (error) {
    // ignore invalid getFilterByTK fallthroughs and continue with field-based lookup
  }

  const filterTargetKey = collection?.filterTargetKey;
  if (typeof filterTargetKey === 'string') {
    return record?.[filterTargetKey];
  }

  if (Array.isArray(filterTargetKey) && filterTargetKey.length === 1) {
    return record?.[filterTargetKey[0]];
  }

  if (Array.isArray(filterTargetKey) && filterTargetKey.length > 1) {
    return Object.fromEntries(filterTargetKey.map((key) => [key, record?.[key]]));
  }

  return record?.id;
};

export const stringifyKanbanRecordKey = (value: any): string | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? '')).join('-');
    }

    const keys = Object.keys(value).sort();
    return keys.map((key) => `${key}:${String(value[key] ?? '')}`).join('|');
  }

  return String(value);
};

export const getKanbanRecordKey = (record: any, collection?: KanbanCollectionIdentity) => {
  return stringifyKanbanRecordKey(getKanbanRecordKeyValue(record, collection));
};

export const getKanbanSameColumnColumnDropMoveParams = (options: {
  items: any[];
  sourceRecord: any;
  collection?: KanbanCollectionIdentity;
}) => {
  const { items, sourceRecord, collection } = options;
  const sourceRecordKey = getKanbanRecordKey(sourceRecord, collection);
  const remainingItems = items.filter((item) => getKanbanRecordKey(item, collection) !== sourceRecordKey);
  const targetRecord = remainingItems[remainingItems.length - 1];
  const targetId = getKanbanRecordKeyValue(targetRecord, collection);

  if (targetId === undefined || targetId === null || targetId === '') {
    return undefined;
  }

  return {
    targetId,
    method: 'insertAfter' as const,
  };
};

export const shouldInsertAfterSameColumnCardMove = (sourceIndex?: number, targetIndex?: number) => {
  return typeof sourceIndex === 'number' && typeof targetIndex === 'number' && targetIndex > sourceIndex;
};

export const getKanbanPreviewInsertIndex = (options: {
  sourceColumnKey: string;
  currentSourceColumnKey: string;
  targetColumnKey: string;
  sourceIndex: number;
  overIndex: number;
  targetIndex: number;
  overType?: string;
}) => {
  const { sourceColumnKey, currentSourceColumnKey, targetColumnKey, sourceIndex, overIndex, targetIndex, overType } =
    options;

  if (overType !== 'card') {
    return targetIndex;
  }

  if (
    sourceColumnKey === targetColumnKey &&
    currentSourceColumnKey === targetColumnKey &&
    shouldInsertAfterSameColumnCardMove(sourceIndex, overIndex)
  ) {
    return targetIndex + 1;
  }

  return targetIndex;
};

export const getKanbanMoveParamsFromPreviewOrder = (options: {
  items: any[];
  activeRecord: any;
  collection?: KanbanCollectionIdentity;
}) => {
  const { items, activeRecord, collection } = options;
  const activeRecordKey = getKanbanRecordKey(activeRecord, collection);

  if (!activeRecordKey) {
    return {};
  }

  const activeIndex = items.findIndex((item) => getKanbanRecordKey(item, collection) === activeRecordKey);
  if (activeIndex < 0) {
    return {};
  }

  if (activeIndex === 0) {
    const nextRecord = items[1];
    const targetId = getKanbanRecordKeyValue(nextRecord, collection);

    return targetId === undefined ? {} : { targetId };
  }

  const previousRecord = items[activeIndex - 1];
  const targetId = getKanbanRecordKeyValue(previousRecord, collection);

  return targetId === undefined ? {} : { targetId, method: 'insertAfter' as const };
};

export const getKanbanCrossColumnMoveParams = (options: {
  overType?: string;
  overRecord?: any;
  targetColumnKey: string;
  groupFieldName?: string;
  groupFieldScopeKey?: string;
  collection?: KanbanCollectionIdentity;
  insertAfter?: boolean;
}) => {
  const { overType, overRecord, targetColumnKey, groupFieldName, groupFieldScopeKey, collection, insertAfter } =
    options;

  if (overType === 'card' && overRecord) {
    const targetId = getKanbanRecordKeyValue(overRecord, collection);

    if (targetId !== undefined && targetId !== null && targetId !== '') {
      return insertAfter ? { targetId, method: 'insertAfter' as const } : { targetId };
    }
  }

  const scopeFieldKey = groupFieldScopeKey || groupFieldName;
  if (!scopeFieldKey) {
    return {};
  }

  return {
    targetScope: {
      [scopeFieldKey]: targetColumnKey === KANBAN_UNKNOWN_COLUMN_KEY ? null : targetColumnKey,
    },
  };
};

export const buildKanbanBoardDisplayItems = (options: {
  columnItems: Array<{ columnKey: string; items: any[] }>;
  collection?: KanbanCollectionIdentity;
  groupField?: { name: string; interface?: string };
  groupOptions?: Array<Pick<KanbanGroupOption, 'value'>>;
}) => {
  const { columnItems, collection, groupField, groupOptions = [] } = options;
  const displayItemsByColumn: Record<string, any[]> = {};
  const recordsById = new Map<
    string,
    Array<{
      record: any;
      sourceColumnKey: string;
      effectiveColumnKey: string;
      explicitColumnOverride: boolean;
    }>
  >();

  columnItems.forEach(({ columnKey, items }) => {
    displayItemsByColumn[columnKey] = displayItemsByColumn[columnKey] || [];

    items.forEach((record) => {
      const effectiveColumnKey =
        record?.__kanbanColumnKey ||
        getRecordKanbanColumnKey({
          record,
          groupField,
          groupOptions,
        }) ||
        KANBAN_UNKNOWN_COLUMN_KEY;
      const recordId = getKanbanRecordKey(record, collection);

      if (recordId === undefined || recordId === null) {
        displayItemsByColumn[effectiveColumnKey] = displayItemsByColumn[effectiveColumnKey] || [];
        displayItemsByColumn[effectiveColumnKey].push(record);
        return;
      }

      const normalizedId = String(recordId);
      const candidates = recordsById.get(normalizedId) || [];
      candidates.push({
        record,
        sourceColumnKey: columnKey,
        effectiveColumnKey,
        explicitColumnOverride: Boolean(record?.__kanbanColumnKey),
      });
      recordsById.set(normalizedId, candidates);
    });
  });

  recordsById.forEach((candidates) => {
    const selectedCandidate =
      candidates.find((candidate) => candidate.explicitColumnOverride) ||
      candidates.find((candidate) => candidate.sourceColumnKey === candidate.effectiveColumnKey) ||
      candidates[0];

    if (!selectedCandidate) {
      return;
    }

    const { effectiveColumnKey, record } = selectedCandidate;
    displayItemsByColumn[effectiveColumnKey] = displayItemsByColumn[effectiveColumnKey] || [];
    displayItemsByColumn[effectiveColumnKey].push(record);
  });

  return displayItemsByColumn;
};

export const buildKanbanColumns = (options: {
  records: any[];
  primaryKey: string;
  groupField: { name: string; interface?: string };
  groupOptions: KanbanGroupOption[];
}) => {
  const { records, primaryKey, groupField, groupOptions } = options;
  const columnMap = new Map(
    groupOptions.map((item) => [
      item.value,
      {
        key: item.value,
        value: item.value,
        label: item.label,
        color: item.color,
        records: [] as KanbanColumnRecord[],
      } satisfies KanbanColumn,
    ]),
  );
  const unknownColumn = getUnknownKanbanColumn();

  records.forEach((record) => {
    const recordWithId = { ...record, id: record?.[primaryKey] ?? record?.id };
    const values = getRecordGroupValues(record, groupField);
    let matched = false;

    values.forEach((value) => {
      const column = columnMap.get(String(value));
      if (!column) {
        return;
      }
      matched = true;
      column.records.push(recordWithId);
    });

    if (!matched) {
      unknownColumn.records.push(recordWithId);
    }
  });

  const orderedColumns: KanbanColumn[] = [];
  groupOptions.forEach((item) => {
    const column = columnMap.get(item.value);
    if (column) {
      orderedColumns.push(column);
    }
  });
  if (unknownColumn.records.length) {
    orderedColumns.unshift(unknownColumn);
  }

  return orderedColumns;
};

export const mergeKanbanFilters = (baseFilter?: Record<string, any>, nextFilter?: Record<string, any>) => {
  const filters = [...flattenAnd(baseFilter), ...flattenAnd(nextFilter)].filter(Boolean);
  if (!filters.length) {
    return undefined;
  }

  return filters.length === 1 ? filters[0] : { $and: filters };
};

export const createKanbanColumnFilter = (options: {
  field?: {
    name?: string;
    interface?: string;
    targetKey?: string;
    targetCollection?: { filterTargetKey?: string | string[] };
  };
  fieldName?: string;
  columnValue?: string;
  enabledValues?: string[];
  isUnknown?: boolean;
}) => {
  const { field, fieldName, columnValue, enabledValues = [], isUnknown } = options;
  const resolvedFieldName = getKanbanFieldFilterPath(field) || fieldName;

  if (!resolvedFieldName) {
    return undefined;
  }

  if (isUnknown) {
    return { [resolvedFieldName]: null };
  }

  if (!columnValue) {
    return undefined;
  }

  return { [resolvedFieldName]: columnValue };
};
