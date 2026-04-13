/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { FlowSurfaceBadRequestError } from './errors';

export const CHART_DEFAULT_DATA_SOURCE_KEY = 'main';
export const CHART_QUERY_MODES = ['builder', 'sql'] as const;
export const CHART_VISUAL_MODES = ['basic', 'custom'] as const;
export const CHART_BASIC_VISUAL_TYPES = [
  'line',
  'area',
  'bar',
  'barHorizontal',
  'pie',
  'doughnut',
  'funnel',
  'scatter',
] as const;
export const CHART_QUERY_AGGREGATIONS = ['sum', 'count', 'avg', 'max', 'min'] as const;
export const CHART_SORT_DIRECTIONS = ['asc', 'desc'] as const;
export const CHART_SORT_NULLS = ['default', 'first', 'last'] as const;
export const CHART_LABEL_TYPES = ['value', 'percent'] as const;
export const CHART_FUNNEL_SORTS = ['descending', 'ascending'] as const;

export type ChartBuilderQueryOutput = {
  alias: string;
  source?: 'builder' | 'sql';
  kind?: 'dimension' | 'measure';
  field?: string | string[];
  aggregation?: (typeof CHART_QUERY_AGGREGATIONS)[number];
  distinct?: boolean;
  format?: string;
};

export type ChartCapabilityHint = {
  key: string;
  title: string;
  description: string;
};

export type ChartStyleValueSupport = {
  type: 'boolean' | 'number' | 'string';
  enumValues?: string[];
  min?: number;
  max?: number;
  description?: string;
};

type NormalizedBasicChartVisual = {
  mode: 'basic';
  builder: Partial<Record<string, any>>;
};

type NormalizedCustomChartVisual = {
  mode: 'custom';
  raw: string;
};

type NormalizedChartVisual = NormalizedBasicChartVisual | NormalizedCustomChartVisual;

const EMPTY_FILTER_GROUP = {
  logic: '$and',
  items: [],
} as const;

const CHART_SAFE_DEFAULT_HINTS: ChartCapabilityHint[] = [
  {
    key: 'builder_basic_minimal',
    title: 'Use builder + basic first',
    description:
      "Prefer query.mode='builder' with visual.mode='basic', a single measure, explicit mappings, and no sorting on the first attempt.",
  },
  {
    key: 'block_outer_props_only',
    title: 'Keep block chrome minimal',
    description:
      'Expose only the minimal block chrome settings first, then add richer chart query or visual settings only when the first render is stable.',
  },
];

const CHART_RISKY_PATTERN_HINTS: ChartCapabilityHint[] = [
  {
    key: 'basic_multi_measure',
    title: 'Basic visual with multiple measures',
    description: 'Basic visual mappings with multiple measures often need manual tuning and browser verification.',
  },
  {
    key: 'custom_visual_raw',
    title: 'Custom visual raw option',
    description: "visual.mode='custom' relies on raw ECharts option code and is not schema-validated by FlowSurfaces.",
  },
  {
    key: 'events_raw',
    title: 'Raw chart events',
    description: 'events.raw executes custom JS against the chart instance and should always be browser-verified.',
  },
];

const CHART_UNSUPPORTED_PATTERN_HINTS: ChartCapabilityHint[] = [
  {
    key: 'builder_measure_sorting',
    title: 'Builder sorting on derived measure outputs',
    description:
      'Builder query.sorting cannot target aggregated measure outputs or custom measure aliases because the current runtime rejects that shape.',
  },
];

const CHART_QUERY_MODE_SET = new Set<string>(CHART_QUERY_MODES);
const CHART_VISUAL_MODE_SET = new Set<string>(CHART_VISUAL_MODES);
const CHART_BASIC_VISUAL_TYPE_SET = new Set<string>(CHART_BASIC_VISUAL_TYPES);
const CHART_QUERY_AGGREGATION_SET = new Set<string>(CHART_QUERY_AGGREGATIONS);
const CHART_SORT_DIRECTION_SET = new Set<string>(CHART_SORT_DIRECTIONS);
const CHART_SORT_NULLS_SET = new Set<string>(CHART_SORT_NULLS);
const CHART_LABEL_TYPE_SET = new Set<string>(CHART_LABEL_TYPES);
const CHART_FUNNEL_SORT_SET = new Set<string>(CHART_FUNNEL_SORTS);
const CHART_MAPPING_KEYS = new Set(['x', 'y', 'category', 'value', 'series', 'size']);
const CHART_STYLE_KEYS = new Set([
  'legend',
  'tooltip',
  'label',
  'boundaryGap',
  'xAxisLabelRotate',
  'yAxisSplitLine',
  'smooth',
  'stack',
  'radiusInner',
  'radiusOuter',
  'labelType',
  'sort',
  'minSize',
  'maxSize',
]);
const CHART_COMMON_STYLE_KEYS = new Set(['legend', 'tooltip', 'label']);
const CHART_STYLE_KEYS_BY_TYPE: Record<string, Set<string>> = {
  line: new Set(['legend', 'tooltip', 'label', 'boundaryGap', 'xAxisLabelRotate', 'yAxisSplitLine', 'smooth']),
  area: new Set(['legend', 'tooltip', 'label', 'boundaryGap', 'xAxisLabelRotate', 'yAxisSplitLine', 'smooth', 'stack']),
  bar: new Set(['legend', 'tooltip', 'label', 'boundaryGap', 'xAxisLabelRotate', 'yAxisSplitLine', 'stack']),
  barHorizontal: new Set(['legend', 'tooltip', 'label', 'boundaryGap', 'xAxisLabelRotate', 'yAxisSplitLine', 'stack']),
  scatter: new Set(['legend', 'tooltip', 'label', 'xAxisLabelRotate', 'yAxisSplitLine']),
  pie: new Set(['legend', 'tooltip', 'label', 'radiusInner', 'radiusOuter', 'labelType']),
  doughnut: new Set(['legend', 'tooltip', 'label', 'radiusInner', 'radiusOuter', 'labelType']),
  funnel: new Set(['legend', 'tooltip', 'label', 'sort', 'minSize', 'maxSize']),
};
const CHART_MAPPING_KEYS_BY_TYPE: Record<string, Set<string>> = {
  line: new Set(['x', 'y', 'series']),
  area: new Set(['x', 'y', 'series']),
  bar: new Set(['x', 'y', 'series']),
  barHorizontal: new Set(['x', 'y', 'series']),
  scatter: new Set(['x', 'y', 'series', 'size']),
  pie: new Set(['category', 'value']),
  doughnut: new Set(['category', 'value']),
  funnel: new Set(['category', 'value']),
};
const CHART_REQUIRED_MAPPING_KEYS_BY_TYPE: Record<string, Set<string>> = {
  line: new Set(['x', 'y']),
  area: new Set(['x', 'y']),
  bar: new Set(['x', 'y']),
  barHorizontal: new Set(['x', 'y']),
  scatter: new Set(['x', 'y']),
  pie: new Set(['category', 'value']),
  doughnut: new Set(['category', 'value']),
  funnel: new Set(['category', 'value']),
};
const CHART_STYLE_SUPPORT_BY_KEY: Record<string, ChartStyleValueSupport> = {
  legend: {
    type: 'boolean',
    description: 'Show or hide legend',
  },
  tooltip: {
    type: 'boolean',
    description: 'Show or hide tooltip',
  },
  label: {
    type: 'boolean',
    description: 'Show or hide series labels',
  },
  boundaryGap: {
    type: 'boolean',
    description: 'Whether the category axis keeps boundary gap',
  },
  xAxisLabelRotate: {
    type: 'number',
    min: 0,
    max: 90,
    description: 'Rotate x-axis labels in degrees',
  },
  yAxisSplitLine: {
    type: 'boolean',
    description: 'Show or hide y-axis split lines',
  },
  smooth: {
    type: 'boolean',
    description: 'Render smooth curves for line and area charts',
  },
  stack: {
    type: 'boolean',
    description: 'Stack compatible series together',
  },
  radiusInner: {
    type: 'number',
    min: 0,
    max: 100,
    description: 'Inner radius percentage; when radiusOuter is also set it must be less than or equal to radiusOuter',
  },
  radiusOuter: {
    type: 'number',
    min: 0,
    max: 100,
    description:
      'Outer radius percentage; when radiusInner is also set it must be greater than or equal to radiusInner',
  },
  labelType: {
    type: 'string',
    enumValues: [...CHART_LABEL_TYPES],
    description: 'Pie or doughnut label content mode',
  },
  sort: {
    type: 'string',
    enumValues: [...CHART_FUNNEL_SORTS],
    description: 'Funnel ordering direction',
  },
  minSize: {
    type: 'number',
    min: 0,
    max: 100,
    description: 'Funnel minimum percentage size; when maxSize is also set it must be less than or equal to maxSize',
  },
  maxSize: {
    type: 'number',
    min: 0,
    max: 100,
    description: 'Funnel maximum percentage size; when minSize is also set it must be greater than or equal to minSize',
  },
};

function hasOwn(input: any, key: string) {
  return Object.prototype.hasOwnProperty.call(input || {}, key);
}

function hasAnyOwn(input: any, keys: string[]) {
  return keys.some((key) => hasOwn(input, key));
}

function hasMeaningfulSemanticPatch(input: any, key: string) {
  if (!hasOwn(input, key)) {
    return false;
  }
  const value = input?.[key];
  if (_.isNull(value)) {
    return true;
  }
  if (_.isPlainObject(value)) {
    return Object.keys(value).length > 0;
  }
  return !_.isUndefined(value);
}

function buildDefinedObject<T extends Record<string, any>>(input: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(input) as Array<[keyof T, T[keyof T]]>) {
    if (!_.isUndefined(value)) {
      result[key] = value;
    }
  }
  return result;
}

function ensurePlainObject(input: any, label: string) {
  if (!_.isPlainObject(input)) {
    throw new FlowSurfaceBadRequestError(`${label} must be an object`);
  }
  return input as Record<string, any>;
}

function normalizeTrimmedString(input: any, label: string, options: { allowEmpty?: boolean } = {}) {
  if (typeof input !== 'string') {
    throw new FlowSurfaceBadRequestError(`${label} must be a string`);
  }
  const normalized = input.trim();
  if (!options.allowEmpty && !normalized) {
    throw new FlowSurfaceBadRequestError(`${label} cannot be empty`);
  }
  return normalized;
}

function normalizeOptionalTrimmedString(input: any, label: string) {
  if (_.isUndefined(input) || _.isNull(input)) {
    return undefined;
  }
  return normalizeTrimmedString(input, label);
}

function normalizeBoolean(input: any, label: string) {
  if (!_.isBoolean(input)) {
    throw new FlowSurfaceBadRequestError(`${label} must be a boolean`);
  }
  return input;
}

function normalizeOptionalBoolean(input: any, label: string) {
  if (_.isUndefined(input) || _.isNull(input)) {
    return undefined;
  }
  return normalizeBoolean(input, label);
}

function normalizeInteger(
  input: any,
  label: string,
  options: {
    min?: number;
    max?: number;
  } = {},
) {
  if (!_.isFinite(input) || !Number.isInteger(input)) {
    throw new FlowSurfaceBadRequestError(`${label} must be an integer`);
  }
  const normalized = Number(input);
  if (!_.isUndefined(options.min) && normalized < options.min) {
    throw new FlowSurfaceBadRequestError(`${label} must be greater than or equal to ${options.min}`);
  }
  if (!_.isUndefined(options.max) && normalized > options.max) {
    throw new FlowSurfaceBadRequestError(`${label} must be less than or equal to ${options.max}`);
  }
  return normalized;
}

function normalizeOptionalInteger(
  input: any,
  label: string,
  options: {
    min?: number;
    max?: number;
  } = {},
) {
  if (_.isUndefined(input) || _.isNull(input)) {
    return undefined;
  }
  return normalizeInteger(input, label, options);
}

function normalizeEnumValue(
  input: any,
  allowed: Set<string>,
  label: string,
  options: {
    fallback?: string;
  } = {},
) {
  if (_.isUndefined(input) || _.isNull(input) || String(input).trim() === '') {
    if (!_.isUndefined(options.fallback)) {
      return options.fallback;
    }
    throw new FlowSurfaceBadRequestError(`${label} is required`);
  }
  const normalized = String(input).trim();
  if (!allowed.has(normalized)) {
    throw new FlowSurfaceBadRequestError(`${label} is invalid: ${normalized}`);
  }
  return normalized;
}

function normalizeOptionalEnumValue(input: any, allowed: Set<string>, label: string) {
  if (_.isUndefined(input) || _.isNull(input) || String(input).trim() === '') {
    return undefined;
  }
  return normalizeEnumValue(input, allowed, label);
}

function normalizeFieldPathValue(input: any, label: string, options: { required?: boolean } = {}) {
  if (_.isUndefined(input) || _.isNull(input)) {
    if (options.required) {
      throw new FlowSurfaceBadRequestError(`${label} is required`);
    }
    return undefined;
  }
  if (typeof input === 'string') {
    const normalized = input.trim();
    if (!normalized) {
      throw new FlowSurfaceBadRequestError(`${label} cannot be empty`);
    }
    return normalized;
  }
  if (Array.isArray(input)) {
    const normalized = input.map((segment) => normalizeTrimmedString(segment, `${label}[]`));
    if (!normalized.length) {
      throw new FlowSurfaceBadRequestError(`${label} cannot be empty`);
    }
    return normalized;
  }
  throw new FlowSurfaceBadRequestError(`${label} must be a string or string[]`);
}

function aliasOfFieldValue(input: any) {
  if (Array.isArray(input)) {
    return input
      .filter(Boolean)
      .map((item) => String(item))
      .join('.');
  }
  return String(input || '').trim();
}

function aliasOfSelection(input: any) {
  const explicitAlias = typeof input?.alias === 'string' ? input.alias.trim() : '';
  if (explicitAlias) {
    return explicitAlias;
  }
  return aliasOfFieldValue(input?.field);
}

function normalizeDirectionLike(input: any, label: string) {
  const raw = normalizeTrimmedString(input, label).toLowerCase();
  if (!CHART_SORT_DIRECTION_SET.has(raw)) {
    throw new FlowSurfaceBadRequestError(`${label} is invalid: ${input}`);
  }
  return raw;
}

function toPersistedOrder(direction: string) {
  return direction.toUpperCase();
}

function fromPersistedOrder(input: any) {
  if (_.isUndefined(input) || _.isNull(input) || String(input).trim() === '') {
    return undefined;
  }
  const normalized = String(input).trim().toLowerCase();
  return CHART_SORT_DIRECTION_SET.has(normalized) ? normalized : undefined;
}

function createEmptyFilterGroup() {
  return _.cloneDeep(EMPTY_FILTER_GROUP);
}

function assertAllowedKeys(input: Record<string, any>, allowed: Set<string>, label: string) {
  const unknownKeys = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknownKeys.length) {
    throw new FlowSurfaceBadRequestError(`${label} does not support: ${unknownKeys.join(', ')}`);
  }
}

function mergeReplaceArrays(base: any, patch: any) {
  return _.mergeWith({}, _.cloneDeep(base || {}), _.cloneDeep(patch || {}), (_objValue, srcValue) => {
    if (Array.isArray(srcValue)) {
      return srcValue;
    }
    return undefined;
  });
}

function normalizeChartResourceFromCollectionPath(
  collectionPath: any,
  label: string,
  options: { required?: boolean } = {},
) {
  if (_.isUndefined(collectionPath) || _.isNull(collectionPath)) {
    if (options.required) {
      throw new FlowSurfaceBadRequestError(`${label} is required`);
    }
    return undefined;
  }
  if (!Array.isArray(collectionPath)) {
    throw new FlowSurfaceBadRequestError(`${label} must be a string[]`);
  }
  const collectionName = normalizeTrimmedString(collectionPath[1], `${label}[1]`);
  const dataSourceKey =
    _.isUndefined(collectionPath[0]) || _.isNull(collectionPath[0]) || String(collectionPath[0]).trim() === ''
      ? CHART_DEFAULT_DATA_SOURCE_KEY
      : normalizeTrimmedString(collectionPath[0], `${label}[0]`);
  return {
    dataSourceKey,
    collectionName,
  };
}

function normalizeChartResource(input: any, label: string, options: { required?: boolean } = {}) {
  if (_.isUndefined(input) || _.isNull(input)) {
    if (options.required) {
      throw new FlowSurfaceBadRequestError(`${label} is required`);
    }
    return undefined;
  }
  const normalized = ensurePlainObject(input, label);
  const collectionName = normalizeTrimmedString(normalized.collectionName, `${label}.collectionName`);
  const dataSourceKey =
    _.isUndefined(normalized.dataSourceKey) || _.isNull(normalized.dataSourceKey)
      ? CHART_DEFAULT_DATA_SOURCE_KEY
      : normalizeTrimmedString(normalized.dataSourceKey, `${label}.dataSourceKey`);
  return {
    dataSourceKey,
    collectionName,
  };
}

function normalizeMergedChartResource(query: Record<string, any>, options: { required?: boolean } = {}) {
  if (hasOwn(query, 'resource') && hasOwn(query, 'collectionPath')) {
    const resource = normalizeChartResource(query.resource, 'chart query.resource');
    const collectionPathResource = normalizeChartResourceFromCollectionPath(
      query.collectionPath,
      'chart query.collectionPath',
    );
    if (!_.isEqual(resource, collectionPathResource)) {
      throw new FlowSurfaceBadRequestError(
        'chart query.resource and chart query.collectionPath must reference the same collection',
      );
    }
    return resource;
  }
  if (hasOwn(query, 'resource')) {
    return normalizeChartResource(query.resource, 'chart query.resource', options);
  }
  if (hasOwn(query, 'collectionPath')) {
    return normalizeChartResourceFromCollectionPath(query.collectionPath, 'chart query.collectionPath', options);
  }
  if (options.required) {
    throw new FlowSurfaceBadRequestError('chart query.resource is required');
  }
  return undefined;
}

function normalizeChartMeasure(input: any, index: number) {
  const label = `chart query.measures[${index}]`;
  const normalized = ensurePlainObject(input, label);
  const aggregation = normalizeOptionalEnumValue(
    normalized.aggregation,
    CHART_QUERY_AGGREGATION_SET,
    `${label}.aggregation`,
  );
  return buildDefinedObject({
    field: normalizeFieldPathValue(normalized.field, `${label}.field`, { required: true }),
    aggregation,
    alias: normalizeOptionalTrimmedString(normalized.alias, `${label}.alias`),
    distinct: normalizeOptionalBoolean(normalized.distinct, `${label}.distinct`),
  });
}

function normalizeChartDimension(input: any, index: number) {
  const label = `chart query.dimensions[${index}]`;
  const normalized = ensurePlainObject(input, label);
  return buildDefinedObject({
    field: normalizeFieldPathValue(normalized.field, `${label}.field`, { required: true }),
    format: normalizeOptionalTrimmedString(normalized.format, `${label}.format`),
    alias: normalizeOptionalTrimmedString(normalized.alias, `${label}.alias`),
  });
}

function normalizeChartSortingItem(input: any, index: number) {
  const label = `chart query.sorting[${index}]`;
  const normalized = ensurePlainObject(input, label);
  const directionSource = hasOwn(normalized, 'direction') ? normalized.direction : normalized.order;
  const direction = normalizeDirectionLike(
    directionSource,
    `${label}.${hasOwn(normalized, 'direction') ? 'direction' : 'order'}`,
  );
  return buildDefinedObject({
    field: normalizeFieldPathValue(normalized.field, `${label}.field`, { required: true }),
    order: toPersistedOrder(direction),
    nulls: normalizeOptionalEnumValue(normalized.nulls, CHART_SORT_NULLS_SET, `${label}.nulls`),
  });
}

function normalizeFilterGroupValue(input: any, label: string) {
  if (_.isUndefined(input) || _.isNull(input)) {
    return undefined;
  }
  const normalized = ensurePlainObject(input, label);
  validateFilterGroupPaths(normalized, label);
  return _.cloneDeep(normalized);
}

function validateFilterGroupPaths(input: any, label: string) {
  const items = Array.isArray(input?.items) ? input.items : [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item || typeof item !== 'object') {
      continue;
    }
    if (Array.isArray(item.items)) {
      validateFilterGroupPaths(item, `${label}.items[${index}]`);
      continue;
    }
    if (hasOwn(item, 'path')) {
      const path = item.path;
      if (typeof path !== 'string' || !path.trim()) {
        throw new FlowSurfaceBadRequestError(`${label}.items[${index}].path cannot be empty`);
      }
    }
  }
}

function inferQueryMode(query: Record<string, any>) {
  if (hasOwn(query, 'mode') && !_.isUndefined(query.mode) && !_.isNull(query.mode)) {
    return normalizeEnumValue(query.mode, CHART_QUERY_MODE_SET, 'chart query.mode');
  }
  if (hasAnyOwn(query, ['sql', 'sqlDatasource'])) {
    return 'sql';
  }
  return 'builder';
}

function validateLooseChartQuery(query: Record<string, any>) {
  inferQueryMode(query);
  if (!hasOwn(query, 'resource') || !hasOwn(query, 'collectionPath')) {
    return;
  }
  const resource = normalizeChartResource(query.resource, 'chart query.resource');
  const collectionPathResource = normalizeChartResourceFromCollectionPath(
    query.collectionPath,
    'chart query.collectionPath',
  );
  if (!_.isEqual(resource, collectionPathResource)) {
    throw new FlowSurfaceBadRequestError(
      'chart query.resource and chart query.collectionPath must reference the same collection',
    );
  }
}

function canStrictNormalizeChartQuery(query: Record<string, any>) {
  validateLooseChartQuery(query);
  const mode = inferQueryMode(query);
  if (mode === 'sql') {
    return typeof query?.sql === 'string' && !!query.sql.trim();
  }
  if (!Array.isArray(query?.measures)) {
    return false;
  }
  return !!normalizeMergedChartResource(query);
}

function mergeChartQuerySection(current: any, patch: any) {
  if (_.isUndefined(patch)) {
    return _.isUndefined(current) ? undefined : _.cloneDeep(current);
  }
  if (_.isNull(patch)) {
    return undefined;
  }
  const normalizedPatch = ensurePlainObject(patch, 'chart query');
  const currentMode = _.isPlainObject(current) ? inferQueryMode(current) : undefined;
  const nextMode = inferQueryMode(normalizedPatch);
  const modeChanged = currentMode && currentMode !== nextMode;
  const base = modeChanged ? {} : current || {};
  const merged = mergeReplaceArrays(base, normalizedPatch);

  if (nextMode !== 'builder') {
    return merged;
  }

  const currentResource = currentMode === 'builder' ? normalizeMergedChartResource(current || {}) : undefined;
  const nextResource = normalizeMergedChartResource(merged, { required: true });
  const resourceChanged = currentMode === 'builder' && !_.isEqual(currentResource, nextResource);
  if (!resourceChanged) {
    return merged;
  }

  return {
    ...merged,
    ...(hasOwn(normalizedPatch, 'measures') ? {} : { measures: [] }),
    ...(hasOwn(normalizedPatch, 'dimensions') ? {} : { dimensions: [] }),
    ...(hasOwn(normalizedPatch, 'sorting') || hasOwn(normalizedPatch, 'orders') ? {} : { sorting: [] }),
    ...(hasOwn(normalizedPatch, 'filter') ? {} : { filter: createEmptyFilterGroup() }),
  };
}

function inferVisualMode(visual: Record<string, any>) {
  if (hasOwn(visual, 'mode') && !_.isUndefined(visual.mode) && !_.isNull(visual.mode)) {
    return normalizeEnumValue(visual.mode, CHART_VISUAL_MODE_SET, 'chart visual.mode');
  }
  if (hasOwn(visual, 'raw')) {
    return 'custom';
  }
  return 'basic';
}

function inferBasicVisualType(visual: Record<string, any>) {
  return normalizeEnumValue(visual.type, CHART_BASIC_VISUAL_TYPE_SET, 'chart visual.type', { fallback: 'line' });
}

function canDeriveSemanticVisualFromOption(option: Record<string, any>) {
  const mode = inferVisualMode(option);
  if (mode === 'custom') {
    const raw = option.raw ?? option.builder?.raw;
    return typeof raw === 'string' && !!raw.trim();
  }

  const builder = _.isPlainObject(option.builder) ? option.builder : option;
  if (!_.isPlainObject(builder)) {
    return false;
  }

  if (typeof builder.type === 'string' && builder.type.trim()) {
    return true;
  }

  const mappingKeys = [
    'xField',
    'yField',
    'seriesField',
    'sizeField',
    'pieCategory',
    'pieValue',
    'doughnutCategory',
    'doughnutValue',
    'funnelCategory',
    'funnelValue',
  ];
  if (mappingKeys.some((key) => hasOwn(builder, key))) {
    return true;
  }

  const scalarCompatibilityChecks: Array<[string, (value: any) => boolean]> = [
    ['legend', _.isBoolean],
    ['tooltip', _.isBoolean],
    ['label', _.isBoolean],
    ['boundaryGap', _.isBoolean],
    ['yAxisSplitLine', _.isBoolean],
    ['smooth', _.isBoolean],
    ['stack', _.isBoolean],
    ['xAxisLabelRotate', _.isFinite],
    ['pieRadiusInner', _.isFinite],
    ['pieRadiusOuter', _.isFinite],
    ['doughnutRadiusInner', _.isFinite],
    ['doughnutRadiusOuter', _.isFinite],
    ['funnelMinSize', _.isFinite],
    ['funnelMaxSize', _.isFinite],
    ['pieLabelType', (value: any) => typeof value === 'string'],
    ['doughnutLabelType', (value: any) => typeof value === 'string'],
    ['funnelSort', (value: any) => typeof value === 'string'],
  ];
  return scalarCompatibilityChecks.some(([key, predicate]) => hasOwn(builder, key) && predicate(builder[key]));
}

function filterVisualStateForType(current: Record<string, any>, type: string) {
  const filteredMappings = _.pick(
    ensurePlainObject(current.mappings || {}, 'chart visual.mappings'),
    Array.from(CHART_MAPPING_KEYS_BY_TYPE[type] || []),
  );
  const filteredStyle = _.pick(
    ensurePlainObject(current.style || {}, 'chart visual.style'),
    Array.from(CHART_STYLE_KEYS_BY_TYPE[type] || []),
  );

  return buildDefinedObject({
    mode: 'basic',
    type,
    ...(Object.keys(filteredMappings).length ? { mappings: filteredMappings } : {}),
    ...(Object.keys(filteredStyle).length ? { style: filteredStyle } : {}),
  });
}

function sanitizeBasicVisualForBuilderQuery(visual: any, query: any) {
  if (!_.isPlainObject(visual) || inferVisualMode(visual) !== 'basic' || query?.mode !== 'builder') {
    return visual;
  }

  const type = inferBasicVisualType(visual);
  const allowedOutputs = collectBuilderQueryOutputFields(query);
  if (!allowedOutputs.size) {
    return buildDefinedObject({
      mode: 'basic',
      type,
      ...(Object.keys(ensurePlainObject(visual.style || {}, 'chart visual.style')).length
        ? { style: _.cloneDeep(visual.style) }
        : {}),
    });
  }

  const filteredMappings = _.pickBy(
    _.pick(
      ensurePlainObject(visual.mappings || {}, 'chart visual.mappings'),
      Array.from(CHART_MAPPING_KEYS_BY_TYPE[type] || []),
    ),
    (value) => {
      const alias = aliasOfFieldValue(value);
      return !!alias && allowedOutputs.has(alias);
    },
  );
  const requiredKeys = Array.from(CHART_REQUIRED_MAPPING_KEYS_BY_TYPE[type] || []);
  const hasAllRequiredMappings =
    !requiredKeys.length || requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(filteredMappings, key));

  return buildDefinedObject({
    mode: 'basic',
    type,
    ...(hasAllRequiredMappings && Object.keys(filteredMappings).length ? { mappings: filteredMappings } : {}),
    ...(Object.keys(ensurePlainObject(visual.style || {}, 'chart visual.style')).length
      ? { style: _.cloneDeep(visual.style) }
      : {}),
  });
}

function sanitizeBasicVisualForSqlQuery(visual: any) {
  if (!_.isPlainObject(visual) || inferVisualMode(visual) !== 'basic') {
    return visual;
  }

  return buildDefinedObject({
    mode: 'basic',
    type: inferBasicVisualType(visual),
    ...(Object.keys(ensurePlainObject(visual.style || {}, 'chart visual.style')).length
      ? { style: _.cloneDeep(visual.style) }
      : {}),
  });
}

function mergeChartVisualSection(current: any, patch: any) {
  if (_.isUndefined(patch)) {
    return _.isUndefined(current) ? undefined : _.cloneDeep(current);
  }
  if (_.isNull(patch)) {
    return undefined;
  }
  const normalizedPatch = ensurePlainObject(patch, 'chart visual');
  const currentMode = _.isPlainObject(current) ? inferVisualMode(current) : undefined;
  const nextMode = inferVisualMode(normalizedPatch);
  const modeChanged = currentMode && currentMode !== nextMode;
  if (modeChanged) {
    return mergeReplaceArrays({}, normalizedPatch);
  }

  if (nextMode !== 'basic') {
    return mergeReplaceArrays(current || {}, normalizedPatch);
  }

  const currentType = currentMode === 'basic' && _.isPlainObject(current) ? inferBasicVisualType(current) : undefined;
  const nextType = inferBasicVisualType(mergeReplaceArrays(current || {}, normalizedPatch));
  if (currentType && currentType !== nextType) {
    return mergeReplaceArrays(filterVisualStateForType(current || {}, nextType), normalizedPatch);
  }

  return mergeReplaceArrays(current || {}, normalizedPatch);
}

function mergeChartSection(current: any, patch: any, label: string) {
  if (_.isUndefined(patch)) {
    return _.isUndefined(current) ? undefined : _.cloneDeep(current);
  }
  if (_.isNull(patch)) {
    return undefined;
  }
  const normalizedPatch = ensurePlainObject(patch, label);
  return mergeReplaceArrays(current || {}, normalizedPatch);
}

function collectBuilderQueryOutputFields(query: any) {
  const outputs = new Set<string>();
  for (const dimension of _.castArray(query?.dimensions || [])) {
    const alias = aliasOfSelection(dimension);
    if (alias) {
      outputs.add(alias);
    }
  }
  for (const measure of _.castArray(query?.measures || [])) {
    const alias = aliasOfSelection(measure);
    if (alias) {
      outputs.add(alias);
    }
  }
  return outputs;
}

function buildBuilderQueryOutputs(query: any): ChartBuilderQueryOutput[] {
  const outputs: ChartBuilderQueryOutput[] = [];
  for (const dimension of _.castArray(query?.dimensions || [])) {
    const alias = aliasOfSelection(dimension);
    if (!alias) {
      continue;
    }
    outputs.push({
      alias,
      source: 'builder',
      kind: 'dimension',
      field: _.cloneDeep(dimension.field),
      format: dimension.format,
    });
  }
  for (const measure of _.castArray(query?.measures || [])) {
    const alias = aliasOfSelection(measure);
    if (!alias) {
      continue;
    }
    outputs.push({
      alias,
      source: 'builder',
      kind: 'measure',
      field: _.cloneDeep(measure.field),
      aggregation: measure.aggregation,
      distinct: measure.distinct,
    });
  }
  return outputs;
}

function assertBuilderSortingFields(query: any, sorting: any[]) {
  const hasAggregation = _.castArray(query?.measures || []).some((item: any) => !!item?.aggregation);
  if (!hasAggregation || !sorting?.length) {
    return;
  }
  const allowedFields = collectBuilderQueryOutputFields(query);
  for (const item of sorting) {
    const alias = aliasOfFieldValue(item.field);
    if (!alias || !allowedFields.has(alias)) {
      throw new FlowSurfaceBadRequestError('chart query.sorting only supports selected dimension/measure fields');
    }
  }
}

function assertBuilderRuntimeCompatibleSorting(query: any, sorting: any[]) {
  if (!sorting?.length) {
    return;
  }

  const unsupportedMeasureOutputs = new Set<string>();
  for (const measure of _.castArray(query?.measures || [])) {
    const outputAlias = aliasOfSelection(measure);
    const rawFieldAlias = aliasOfFieldValue(measure?.field);
    if (!outputAlias) {
      continue;
    }
    if (measure?.aggregation || (rawFieldAlias && outputAlias !== rawFieldAlias)) {
      unsupportedMeasureOutputs.add(outputAlias);
    }
  }

  for (const item of sorting) {
    const sortingField = aliasOfFieldValue(item?.field);
    if (sortingField && unsupportedMeasureOutputs.has(sortingField)) {
      throw new FlowSurfaceBadRequestError(
        'chart query.sorting does not support aggregated measure outputs or custom measure aliases in builder mode',
      );
    }
  }
}

function normalizeBuilderQuery(query: Record<string, any>) {
  const resource = normalizeMergedChartResource(query, { required: true });
  const measures = Array.isArray(query.measures)
    ? query.measures.map((item, index) => normalizeChartMeasure(item, index))
    : (() => {
        throw new FlowSurfaceBadRequestError('chart query.measures must be an array');
      })();
  if (!measures.length) {
    throw new FlowSurfaceBadRequestError('chart query.measures cannot be empty');
  }
  const dimensions = _.isUndefined(query.dimensions)
    ? undefined
    : Array.isArray(query.dimensions)
      ? query.dimensions.map((item, index) => normalizeChartDimension(item, index))
      : (() => {
          throw new FlowSurfaceBadRequestError('chart query.dimensions must be an array');
        })();
  const rawSorting = hasOwn(query, 'sorting') ? query.sorting : query.orders;
  const sorting = _.isUndefined(rawSorting)
    ? undefined
    : Array.isArray(rawSorting)
      ? rawSorting.map((item, index) => normalizeChartSortingItem(item, index))
      : (() => {
          throw new FlowSurfaceBadRequestError('chart query.sorting must be an array');
        })();
  const filter = normalizeFilterGroupValue(query.filter, 'chart query.filter');
  assertBuilderSortingFields({ measures, dimensions }, sorting || []);
  assertBuilderRuntimeCompatibleSorting({ measures, dimensions }, sorting || []);

  return buildDefinedObject({
    mode: 'builder',
    collectionPath: [resource.dataSourceKey, resource.collectionName],
    measures,
    dimensions,
    filter,
    orders: sorting,
    limit: normalizeOptionalInteger(query.limit, 'chart query.limit', { min: 0 }),
    offset: normalizeOptionalInteger(query.offset, 'chart query.offset', { min: 0 }),
  });
}

function normalizeSqlQuery(query: Record<string, any>) {
  const unsupportedKeys = [
    'resource',
    'collectionPath',
    'measures',
    'dimensions',
    'filter',
    'sorting',
    'orders',
    'limit',
    'offset',
  ].filter((key) => hasOwn(query, key));
  if (unsupportedKeys.length) {
    throw new FlowSurfaceBadRequestError(`chart query.mode='sql' does not support: ${unsupportedKeys.join(', ')}`);
  }
  return buildDefinedObject({
    mode: 'sql',
    sql: normalizeTrimmedString(query.sql, 'chart query.sql'),
    sqlDatasource:
      _.isUndefined(query.sqlDatasource) || _.isNull(query.sqlDatasource)
        ? undefined
        : normalizeTrimmedString(query.sqlDatasource, 'chart query.sqlDatasource'),
  });
}

function normalizeChartQuery(query: any) {
  const normalized = ensurePlainObject(query, 'chart query');
  const mode = inferQueryMode(normalized);
  return mode === 'sql' ? normalizeSqlQuery(normalized) : normalizeBuilderQuery(normalized);
}

function normalizeCommonChartStyle(style: Record<string, any>) {
  return buildDefinedObject({
    legend: normalizeOptionalBoolean(style.legend, 'chart visual.style.legend'),
    tooltip: normalizeOptionalBoolean(style.tooltip, 'chart visual.style.tooltip'),
    label: normalizeOptionalBoolean(style.label, 'chart visual.style.label'),
  });
}

function normalizeBasicVisual(visual: Record<string, any>): NormalizedBasicChartVisual {
  const type = inferBasicVisualType(visual);
  if (hasOwn(visual, 'raw')) {
    throw new FlowSurfaceBadRequestError("chart visual.mode='basic' does not support raw");
  }
  const mappings = _.isUndefined(visual.mappings) ? {} : ensurePlainObject(visual.mappings, 'chart visual.mappings');
  const style = _.isUndefined(visual.style) ? {} : ensurePlainObject(visual.style, 'chart visual.style');
  const requireRequiredMappings = Object.keys(mappings).length > 0;
  assertAllowedKeys(mappings, CHART_MAPPING_KEYS, 'chart visual.mappings');
  assertAllowedKeys(style, CHART_STYLE_KEYS, 'chart visual.style');

  const allowedStyleKeys = CHART_STYLE_KEYS_BY_TYPE[type] || new Set<string>();
  const invalidStyleKeys = Object.keys(style).filter((key) => !allowedStyleKeys.has(key));
  if (invalidStyleKeys.length) {
    throw new FlowSurfaceBadRequestError(
      `chart visual.type='${type}' does not support style keys: ${invalidStyleKeys.join(', ')}`,
    );
  }

  const builder: Record<string, any> = {
    type,
    ...normalizeCommonChartStyle(style),
  };

  switch (type) {
    case 'line':
    case 'area':
    case 'bar':
    case 'barHorizontal':
      builder.xField = normalizeFieldPathValue(mappings.x, 'chart visual.mappings.x', {
        required: requireRequiredMappings,
      });
      builder.yField = normalizeFieldPathValue(mappings.y, 'chart visual.mappings.y', {
        required: requireRequiredMappings,
      });
      builder.seriesField = normalizeFieldPathValue(mappings.series, 'chart visual.mappings.series');
      builder.boundaryGap = normalizeOptionalBoolean(style.boundaryGap, 'chart visual.style.boundaryGap');
      builder.xAxisLabelRotate = normalizeOptionalInteger(
        style.xAxisLabelRotate,
        'chart visual.style.xAxisLabelRotate',
        {
          min: 0,
          max: 90,
        },
      );
      builder.yAxisSplitLine = normalizeOptionalBoolean(style.yAxisSplitLine, 'chart visual.style.yAxisSplitLine');
      if (type === 'line' || type === 'area') {
        builder.smooth = normalizeOptionalBoolean(style.smooth, 'chart visual.style.smooth');
      }
      if (type === 'area' || type === 'bar' || type === 'barHorizontal') {
        builder.stack = normalizeOptionalBoolean(style.stack, 'chart visual.style.stack');
      }
      break;
    case 'scatter':
      builder.xField = normalizeFieldPathValue(mappings.x, 'chart visual.mappings.x', {
        required: requireRequiredMappings,
      });
      builder.yField = normalizeFieldPathValue(mappings.y, 'chart visual.mappings.y', {
        required: requireRequiredMappings,
      });
      builder.seriesField = normalizeFieldPathValue(mappings.series, 'chart visual.mappings.series');
      builder.sizeField = normalizeFieldPathValue(mappings.size, 'chart visual.mappings.size');
      builder.xAxisLabelRotate = normalizeOptionalInteger(
        style.xAxisLabelRotate,
        'chart visual.style.xAxisLabelRotate',
        {
          min: 0,
          max: 90,
        },
      );
      builder.yAxisSplitLine = normalizeOptionalBoolean(style.yAxisSplitLine, 'chart visual.style.yAxisSplitLine');
      break;
    case 'pie':
    case 'doughnut':
      builder[type === 'pie' ? 'pieCategory' : 'doughnutCategory'] = normalizeFieldPathValue(
        mappings.category,
        'chart visual.mappings.category',
        { required: requireRequiredMappings },
      );
      builder[type === 'pie' ? 'pieValue' : 'doughnutValue'] = normalizeFieldPathValue(
        mappings.value,
        'chart visual.mappings.value',
        { required: requireRequiredMappings },
      );
      builder[type === 'pie' ? 'pieRadiusInner' : 'doughnutRadiusInner'] = normalizeOptionalInteger(
        style.radiusInner,
        'chart visual.style.radiusInner',
        { min: 0, max: 100 },
      );
      builder[type === 'pie' ? 'pieRadiusOuter' : 'doughnutRadiusOuter'] = normalizeOptionalInteger(
        style.radiusOuter,
        'chart visual.style.radiusOuter',
        { min: 0, max: 100 },
      );
      builder[type === 'pie' ? 'pieLabelType' : 'doughnutLabelType'] = normalizeOptionalEnumValue(
        style.labelType,
        CHART_LABEL_TYPE_SET,
        'chart visual.style.labelType',
      );
      {
        const inner = builder[type === 'pie' ? 'pieRadiusInner' : 'doughnutRadiusInner'];
        const outer = builder[type === 'pie' ? 'pieRadiusOuter' : 'doughnutRadiusOuter'];
        if (!_.isUndefined(inner) && !_.isUndefined(outer) && inner > outer) {
          throw new FlowSurfaceBadRequestError(
            'chart visual.style.radiusOuter must be greater than or equal to radiusInner',
          );
        }
      }
      break;
    case 'funnel':
      builder.funnelCategory = normalizeFieldPathValue(mappings.category, 'chart visual.mappings.category', {
        required: requireRequiredMappings,
      });
      builder.funnelValue = normalizeFieldPathValue(mappings.value, 'chart visual.mappings.value', {
        required: requireRequiredMappings,
      });
      builder.funnelSort = normalizeOptionalEnumValue(style.sort, CHART_FUNNEL_SORT_SET, 'chart visual.style.sort');
      builder.funnelMinSize = normalizeOptionalInteger(style.minSize, 'chart visual.style.minSize', {
        min: 0,
        max: 100,
      });
      builder.funnelMaxSize = normalizeOptionalInteger(style.maxSize, 'chart visual.style.maxSize', {
        min: 0,
        max: 100,
      });
      if (
        !_.isUndefined(builder.funnelMinSize) &&
        !_.isUndefined(builder.funnelMaxSize) &&
        builder.funnelMinSize > builder.funnelMaxSize
      ) {
        throw new FlowSurfaceBadRequestError('chart visual.style.maxSize must be greater than or equal to minSize');
      }
      break;
    default:
      break;
  }

  return {
    mode: 'basic',
    builder: buildDefinedObject(builder),
  };
}

function normalizeCustomVisual(visual: Record<string, any>): NormalizedCustomChartVisual {
  const unsupportedKeys = ['type', 'mappings', 'style'].filter((key) => hasOwn(visual, key));
  if (unsupportedKeys.length) {
    throw new FlowSurfaceBadRequestError(`chart visual.mode='custom' does not support: ${unsupportedKeys.join(', ')}`);
  }
  return {
    mode: 'custom',
    raw: normalizeTrimmedString(visual.raw, 'chart visual.raw'),
  };
}

function assertBasicVisualMappingsAgainstBuilderQuery(builderVisual: Record<string, any>, query: Record<string, any>) {
  const allowedOutputs = collectBuilderQueryOutputFields(query);
  if (!allowedOutputs.size) {
    return;
  }

  const mappingValues = [
    builderVisual.xField,
    builderVisual.yField,
    builderVisual.seriesField,
    builderVisual.sizeField,
    builderVisual.pieCategory,
    builderVisual.pieValue,
    builderVisual.doughnutCategory,
    builderVisual.doughnutValue,
    builderVisual.funnelCategory,
    builderVisual.funnelValue,
  ]
    .filter((value) => !_.isUndefined(value) && !_.isNull(value))
    .map((value) => aliasOfFieldValue(value));

  for (const value of mappingValues) {
    if (!value || !allowedOutputs.has(value)) {
      throw new FlowSurfaceBadRequestError(
        `chart visual mappings only support query output fields: ${Array.from(allowedOutputs).join(', ')}`,
      );
    }
  }
}

function normalizeChartVisual(visual: any, query?: any): NormalizedChartVisual {
  const normalized = ensurePlainObject(visual, 'chart visual');
  const mode = inferVisualMode(normalized);
  if (mode === 'custom') {
    return normalizeCustomVisual(normalized);
  }
  const visualConfig = normalizeBasicVisual(normalized);
  if (query?.mode === 'builder') {
    assertBasicVisualMappingsAgainstBuilderQuery(visualConfig.builder || {}, query);
  }
  return visualConfig;
}

function normalizeChartEvents(events: any) {
  const normalized = ensurePlainObject(events, 'chart events');
  const unsupportedKeys = Object.keys(normalized).filter((key) => key !== 'raw');
  if (unsupportedKeys.length) {
    throw new FlowSurfaceBadRequestError(`chart events does not support: ${unsupportedKeys.join(', ')}`);
  }
  if (_.isUndefined(normalized.raw) || _.isNull(normalized.raw)) {
    return undefined;
  }
  return {
    mode: 'custom',
    raw: normalizeTrimmedString(normalized.raw, 'chart events.raw'),
  };
}

function deriveChartSortingItem(item: any) {
  if (!_.isPlainObject(item)) {
    return undefined;
  }
  const direction = fromPersistedOrder(item.order) || fromPersistedOrder(item.direction);
  return buildDefinedObject({
    field: _.cloneDeep(item.field),
    direction,
    nulls: item.nulls,
  });
}

function deriveChartQuery(configure: any) {
  const query = configure?.query;
  if (!_.isPlainObject(query)) {
    return undefined;
  }
  if (!canStrictNormalizeChartQuery(query)) {
    return undefined;
  }
  if (query.mode === 'sql') {
    return buildDefinedObject({
      mode: 'sql',
      sql: query.sql,
      sqlDatasource: query.sqlDatasource,
    });
  }
  return buildDefinedObject({
    mode: query.mode || 'builder',
    resource: getChartBuilderResourceInit(configure),
    measures: _.cloneDeep(query.measures),
    dimensions: _.cloneDeep(query.dimensions),
    filter: _.cloneDeep(query.filter),
    sorting: _.castArray(hasOwn(query, 'sorting') ? query.sorting : query.orders)
      .map((item) => deriveChartSortingItem(item))
      .filter(Boolean),
    limit: query.limit,
    offset: query.offset,
  });
}

function deriveChartVisual(configure: any) {
  const option = configure?.chart?.option;
  if (!_.isPlainObject(option)) {
    return undefined;
  }
  if (!canDeriveSemanticVisualFromOption(option)) {
    return undefined;
  }
  if (option.mode === 'custom') {
    return buildDefinedObject({
      mode: 'custom',
      raw: option.raw,
    });
  }
  const builder = _.isPlainObject(option.builder) ? option.builder : _.isPlainObject(option) ? option : {};
  const type = String(builder.type || 'line');
  const style = buildDefinedObject({
    legend: builder.legend,
    tooltip: builder.tooltip,
    label: builder.label,
    boundaryGap: builder.boundaryGap,
    xAxisLabelRotate: builder.xAxisLabelRotate,
    yAxisSplitLine: builder.yAxisSplitLine,
    smooth: builder.smooth,
    stack: builder.stack,
    radiusInner: builder.pieRadiusInner ?? builder.doughnutRadiusInner,
    radiusOuter: builder.pieRadiusOuter ?? builder.doughnutRadiusOuter,
    labelType: builder.pieLabelType ?? builder.doughnutLabelType,
    sort: builder.funnelSort,
    minSize: builder.funnelMinSize,
    maxSize: builder.funnelMaxSize,
  });
  const mappings = buildDefinedObject({
    x: builder.xField,
    y: builder.yField,
    category: builder.pieCategory ?? builder.doughnutCategory ?? builder.funnelCategory,
    value: builder.pieValue ?? builder.doughnutValue ?? builder.funnelValue,
    series: builder.seriesField,
    size: builder.sizeField,
  });
  return buildDefinedObject({
    mode: 'basic',
    type,
    ...(Object.keys(mappings).length ? { mappings } : {}),
    ...(Object.keys(style).length ? { style } : {}),
  });
}

function deriveChartEvents(configure: any) {
  const events = configure?.chart?.events;
  if (!_.isPlainObject(events)) {
    return undefined;
  }
  return buildDefinedObject({
    raw: events.raw,
  });
}

function rebuildChartConfigureFromSemanticState(nextState: Record<string, any>) {
  const nextConfigure: Record<string, any> = {};
  if (nextState.query) {
    nextConfigure.query = normalizeChartQuery(nextState.query);
  }
  if (nextState.visual || nextState.events) {
    nextConfigure.chart = buildDefinedObject({
      option: nextState.visual ? normalizeChartVisual(nextState.visual, nextConfigure.query) : undefined,
      events: nextState.events ? normalizeChartEvents(nextState.events) : undefined,
    });
  }
  return nextConfigure;
}

export function deriveChartSemanticState(configure: any) {
  return buildDefinedObject({
    query: deriveChartQuery(configure),
    visual: deriveChartVisual(configure),
    events: deriveChartEvents(configure),
  });
}

export function getChartBuilderResourceInit(configure: any) {
  const query = configure?.query;
  if (!_.isPlainObject(query) || query.mode === 'sql') {
    return null;
  }
  return normalizeMergedChartResource(query) || null;
}

export function getChartBuilderQueryOutputs(configure: any) {
  const query = deriveChartSemanticState(configure)?.query;
  if (query?.mode !== 'builder') {
    return [];
  }
  return buildBuilderQueryOutputs(query);
}

export function getChartBuilderQueryAliases(configure: any) {
  return Array.from(
    new Set(
      getChartBuilderQueryOutputs(configure)
        .map((output) => (typeof output?.alias === 'string' ? output.alias.trim() : ''))
        .filter((alias): alias is string => !!alias),
    ),
  );
}

export function getChartSupportedVisualTypes() {
  return [...CHART_BASIC_VISUAL_TYPES];
}

export function getChartSupportedMappingsByType() {
  return Object.fromEntries(
    Object.entries(CHART_MAPPING_KEYS_BY_TYPE).map(([type, mappings]) => [
      type,
      {
        allowed: Array.from(mappings),
        required: Array.from(CHART_REQUIRED_MAPPING_KEYS_BY_TYPE[type] || []),
      },
    ]),
  );
}

export function getChartSupportedStylesByType() {
  return _.cloneDeep(
    Object.fromEntries(
      Object.entries(CHART_STYLE_KEYS_BY_TYPE).map(([type, styleKeys]) => [
        type,
        Object.fromEntries(
          Array.from(styleKeys).map((styleKey) => [styleKey, _.cloneDeep(CHART_STYLE_SUPPORT_BY_KEY[styleKey])]),
        ),
      ]),
    ),
  );
}

export function getChartSafeDefaultHints() {
  return _.cloneDeep(CHART_SAFE_DEFAULT_HINTS);
}

export function getChartRiskyPatternHints() {
  return _.cloneDeep(CHART_RISKY_PATTERN_HINTS);
}

export function getChartUnsupportedPatternHints() {
  return _.cloneDeep(CHART_UNSUPPORTED_PATTERN_HINTS);
}

export function getChartVisualMappingAliases(input: any) {
  const visual = input?.visual ? input.visual : input;
  if (!_.isPlainObject(visual)) {
    return [];
  }

  const semanticVisual =
    visual?.mode || visual?.mappings || visual?.type ? visual : deriveChartVisual({ chart: { option: visual } });
  if (!semanticVisual || semanticVisual.mode !== 'basic' || !_.isPlainObject(semanticVisual.mappings)) {
    return [];
  }

  return _.uniq(
    Object.values(semanticVisual.mappings)
      .map((value) => aliasOfFieldValue(value))
      .filter(Boolean),
  );
}

export function canonicalizeChartConfigure(configure: any) {
  if (_.isUndefined(configure) || _.isNull(configure)) {
    return configure;
  }

  ensurePlainObject(configure, 'chart configure');
  const cloned = _.cloneDeep(configure);
  const nextConfigure = _.omit(cloned, ['query', 'chart']) as Record<string, any>;
  const rawQuery = _.isUndefined(cloned.query) ? undefined : ensurePlainObject(cloned.query, 'chart query');
  const rawChart = _.isUndefined(cloned.chart) ? undefined : ensurePlainObject(cloned.chart, 'chart chart');
  const rawOption = _.isUndefined(rawChart?.option) ? undefined : ensurePlainObject(rawChart.option, 'chart option');
  const rawEvents = _.isUndefined(rawChart?.events) ? undefined : ensurePlainObject(rawChart.events, 'chart events');

  if (!_.isUndefined(rawQuery)) {
    nextConfigure.query = canStrictNormalizeChartQuery(rawQuery)
      ? normalizeChartQuery(rawQuery)
      : _.cloneDeep(rawQuery);
  }

  if (!_.isUndefined(rawChart)) {
    const nextChart = _.omit(_.cloneDeep(rawChart), ['option', 'events']) as Record<string, any>;
    const strictQuery = nextConfigure.query;

    if (!_.isUndefined(rawOption)) {
      if (canDeriveSemanticVisualFromOption(rawOption)) {
        const semanticVisual = deriveChartVisual({ chart: { option: rawOption } });
        nextChart.option = semanticVisual
          ? normalizeChartVisual(semanticVisual, strictQuery?.mode === 'builder' ? strictQuery : undefined)
          : _.cloneDeep(rawOption);
      } else {
        if (hasOwn(rawOption, 'mode')) {
          inferVisualMode(rawOption);
        }
        nextChart.option = _.cloneDeep(rawOption);
      }
    }

    if (!_.isUndefined(rawEvents)) {
      if (hasOwn(rawEvents, 'raw') || hasOwn(rawEvents, 'mode')) {
        const semanticEvents = deriveChartEvents({ chart: { events: rawEvents } });
        nextChart.events = semanticEvents ? normalizeChartEvents(semanticEvents) : undefined;
      } else {
        nextChart.events = _.cloneDeep(rawEvents);
      }
    }

    if (Object.keys(nextChart).length) {
      nextConfigure.chart = nextChart;
    }
  }

  return nextConfigure;
}

export function buildChartConfigureFromSemanticChanges(currentConfigure: any, changes: Record<string, any>) {
  if (hasOwn(changes, 'configure') && ['query', 'visual', 'events'].some((key) => hasOwn(changes, key))) {
    throw new FlowSurfaceBadRequestError(
      'chart configure cannot mix legacy configure with semantic query/visual/events changes',
    );
  }

  if (hasOwn(changes, 'configure')) {
    return canonicalizeChartConfigure(changes.configure);
  }

  const hasSemanticChanges = ['query', 'visual', 'events'].some((key) => hasOwn(changes, key));
  if (!hasSemanticChanges) {
    return _.cloneDeep(currentConfigure) || {};
  }

  const nextQueryPatch = hasMeaningfulSemanticPatch(changes, 'query') ? changes.query : undefined;
  const nextVisualPatch = hasMeaningfulSemanticPatch(changes, 'visual') ? changes.visual : undefined;
  const nextEventsPatch = hasMeaningfulSemanticPatch(changes, 'events') ? changes.events : undefined;

  const currentState = deriveChartSemanticState(currentConfigure);
  const nextState = {
    query: mergeChartQuerySection(currentState.query, nextQueryPatch),
    visual: mergeChartVisualSection(currentState.visual, nextVisualPatch),
    events: mergeChartSection(currentState.events, nextEventsPatch, 'chart events'),
  } as Record<string, any>;

  if (
    hasMeaningfulSemanticPatch(changes, 'query') &&
    !hasMeaningfulSemanticPatch(changes, 'visual') &&
    nextState.query?.mode === 'builder' &&
    nextState.visual?.mode === 'basic'
  ) {
    nextState.visual = sanitizeBasicVisualForBuilderQuery(nextState.visual, nextState.query);
  }

  if (
    hasMeaningfulSemanticPatch(changes, 'query') &&
    !hasMeaningfulSemanticPatch(changes, 'visual') &&
    nextState.query?.mode === 'sql' &&
    nextState.visual?.mode === 'basic'
  ) {
    nextState.visual = sanitizeBasicVisualForSqlQuery(nextState.visual);
  }

  return rebuildChartConfigureFromSemanticState(nextState);
}

export function isChartBuilderQuery(configure: any) {
  return !!getChartBuilderResourceInit(configure);
}

export function getChartVisualCommonStyleKeys() {
  return Array.from(CHART_COMMON_STYLE_KEYS);
}
