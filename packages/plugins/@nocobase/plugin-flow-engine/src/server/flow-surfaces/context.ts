/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceContextResponse, FlowSurfaceContextVarInfo } from './types';

type CollectionLike = {
  name?: string;
  title?: string;
  dataSourceKey?: string;
  fields?: any[] | Map<string, any> | Record<string, any>;
  getFields?: () => any[];
};

type FlowSurfacePopupContextLevel = {
  uid?: string;
  recordCollection?: CollectionLike | null;
  sourceRecordCollection?: CollectionLike | null;
};

type FlowSurfaceChartQueryOutput = {
  alias: string;
  source?: 'builder' | 'sql';
  type?: string;
  kind?: 'dimension' | 'measure';
  field?: string | string[];
  aggregation?: string;
  format?: string;
};

type FlowSurfaceChartCapabilityHint = {
  key: string;
  title: string;
  description: string;
};

type FlowSurfaceChartMappingSupport = {
  allowed: string[];
  required?: string[];
};

type FlowSurfaceChartStyleSupport = {
  type: 'boolean' | 'number' | 'string';
  enumValues?: string[];
  min?: number;
  max?: number;
  description?: string;
};

type FlowSurfaceChartContext = {
  queryOutputs?: FlowSurfaceChartQueryOutput[];
  aliases?: string[];
  supportedMappings?: Record<string, FlowSurfaceChartMappingSupport>;
  supportedStyles?: Record<string, Record<string, FlowSurfaceChartStyleSupport>>;
  supportedVisualTypes?: string[];
  safeDefaults?: FlowSurfaceChartCapabilityHint[];
  riskyPatterns?: FlowSurfaceChartCapabilityHint[];
  unsupportedPatterns?: FlowSurfaceChartCapabilityHint[];
};

export type FlowSurfaceContextSemantic = {
  collection?: CollectionLike | null;
  recordCollection?: CollectionLike | null;
  formValuesCollection?: CollectionLike | null;
  itemCollections?: Array<CollectionLike | null>;
  itemRootCollection?: CollectionLike | null;
  popupLevels?: FlowSurfacePopupContextLevel[];
  chart?: FlowSurfaceChartContext | null;
};

type FlowSurfaceContextSpecNode = {
  title?: string;
  type?: string;
  interface?: string;
  description?: string;
  enumValues?: string[];
  min?: number;
  max?: number;
  disabled?: boolean;
  disabledReason?: string;
  cycleKey?: string;
  properties?: () => Record<string, FlowSurfaceContextSpecNode>;
};

const RELATION_FIELD_TYPES = new Set(['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'belongsToArray']);
const NUMERIC_FIELD_TYPES = new Set(['integer', 'float', 'double', 'decimal']);
const BARE_FLOW_CONTEXT_PATH_RE = /^[A-Za-z_][A-Za-z0-9_-]*(\.[A-Za-z_][A-Za-z0-9_-]*)*$/;

export function isBareFlowContextPath(path: string) {
  return BARE_FLOW_CONTEXT_PATH_RE.test(path);
}

function getCollectionFields(collection?: CollectionLike | null) {
  if (!collection) {
    return [];
  }
  if (Array.isArray(collection.fields)) {
    return collection.fields;
  }
  if (collection.fields instanceof Map) {
    return Array.from(collection.fields.values());
  }
  if (collection.fields && typeof collection.fields === 'object') {
    return Object.values(collection.fields);
  }
  if (typeof collection.getFields === 'function') {
    return collection.getFields() || [];
  }
  return [];
}

function getCollectionCycleKey(collection?: CollectionLike | null) {
  if (!collection) {
    return undefined;
  }
  return `collection:${collection.dataSourceKey || 'main'}:${collection.name || collection.title || 'unknown'}`;
}

function getFieldType(field: any) {
  const fieldType = field?.type;
  if (RELATION_FIELD_TYPES.has(fieldType)) {
    return 'object';
  }
  if (NUMERIC_FIELD_TYPES.has(fieldType)) {
    return 'number';
  }
  switch (fieldType) {
    case 'boolean':
      return 'boolean';
    case 'json':
      return 'object';
    case 'array':
      return 'array';
    default:
      return 'string';
  }
}

function getFieldTargetCollection(field: any) {
  const targetCollection =
    typeof field?.targetCollection === 'function' ? field.targetCollection() : field?.targetCollection;
  return targetCollection && typeof targetCollection === 'object' ? targetCollection : null;
}

function isAssociationField(field: any, targetCollection: CollectionLike | null) {
  if (typeof field?.isAssociationField === 'function') {
    return !!field.isAssociationField();
  }
  return !!targetCollection || RELATION_FIELD_TYPES.has(field?.type);
}

function createCollectionFieldSpec(field: any): FlowSurfaceContextSpecNode {
  const targetCollection = getFieldTargetCollection(field);
  return {
    title: field?.title || field?.name,
    type: getFieldType(field),
    interface: field?.interface,
    ...(isAssociationField(field, targetCollection) && targetCollection
      ? {
          cycleKey: getCollectionCycleKey(targetCollection),
          properties: () => buildCollectionProperties(targetCollection),
        }
      : {}),
  };
}

function buildCollectionProperties(collection?: CollectionLike | null) {
  const properties: Record<string, FlowSurfaceContextSpecNode> = {};
  for (const field of getCollectionFields(collection)) {
    if (!field?.name) {
      continue;
    }
    properties[field.name] = createCollectionFieldSpec(field);
  }
  return properties;
}

function createCollectionSpec(
  collection: CollectionLike | null | undefined,
  title: string,
): FlowSurfaceContextSpecNode | null {
  if (!collection) {
    return null;
  }
  return {
    title,
    type: 'object',
    cycleKey: getCollectionCycleKey(collection),
    properties: () => buildCollectionProperties(collection),
  };
}

function createItemSpec(
  currentCollection: CollectionLike | null | undefined,
  parentSpec?: FlowSurfaceContextSpecNode,
): FlowSurfaceContextSpecNode | null {
  if (!currentCollection) {
    return null;
  }
  return {
    title: 'Current item',
    type: 'object',
    properties: () => {
      const properties: Record<string, FlowSurfaceContextSpecNode> = {
        index: {
          title: 'Index (starts from 0)',
          type: 'number',
        },
        length: {
          title: 'Total count',
          type: 'number',
        },
      };
      const valueSpec = createCollectionSpec(currentCollection, 'Attributes');
      if (valueSpec) {
        properties.value = valueSpec;
      }
      if (parentSpec) {
        properties.parentItem = parentSpec;
      }
      return properties;
    },
  };
}

function buildItemChainSpec(
  collections: Array<CollectionLike | null | undefined>,
  rootCollection?: CollectionLike | null,
): FlowSurfaceContextSpecNode | null {
  if (!collections.length) {
    return null;
  }

  let parentSpec: FlowSurfaceContextSpecNode | undefined;
  if (rootCollection) {
    parentSpec = {
      title: 'Parent item',
      type: 'object',
      properties: () => {
        const properties: Record<string, FlowSurfaceContextSpecNode> = {
          index: {
            title: 'Index (starts from 0)',
            type: 'number',
          },
          length: {
            title: 'Total count',
            type: 'number',
          },
        };
        const valueSpec = createCollectionSpec(rootCollection, 'Attributes');
        if (valueSpec) {
          properties.value = valueSpec;
        }
        return properties;
      },
    };
  }

  for (let index = collections.length - 1; index >= 0; index -= 1) {
    const itemSpec = createItemSpec(collections[index], parentSpec);
    if (!itemSpec) {
      continue;
    }
    if (parentSpec) {
      itemSpec.title = 'Parent item';
    }
    parentSpec = itemSpec;
  }

  if (!parentSpec) {
    return null;
  }

  parentSpec.title = 'Current item';
  return parentSpec;
}

function buildPopupChainSpec(levels: FlowSurfacePopupContextLevel[]): FlowSurfaceContextSpecNode | null {
  if (!levels.length) {
    return null;
  }

  const currentLevel = levels[0] || {};
  const parentLevel = levels[1] || null;
  return {
    title: 'Current popup',
    type: 'object',
    properties: () => {
      const properties: Record<string, FlowSurfaceContextSpecNode> = {
        uid: {
          title: 'Popup uid',
          type: 'string',
        },
      };
      const recordSpec = createCollectionSpec(currentLevel.recordCollection, 'Current popup record');
      if (recordSpec) {
        properties.record = recordSpec;
      }
      const sourceRecordSpec = createCollectionSpec(currentLevel.sourceRecordCollection, 'Current popup parent record');
      if (sourceRecordSpec) {
        properties.sourceRecord = sourceRecordSpec;
      }
      if (parentLevel) {
        properties.parent = {
          title: 'Parent popup',
          type: 'object',
          properties: () => {
            const parentProperties: Record<string, FlowSurfaceContextSpecNode> = {
              uid: {
                title: 'Popup uid',
                type: 'string',
              },
            };
            const parentRecordSpec = createCollectionSpec(parentLevel.recordCollection, 'Popup record');
            if (parentRecordSpec) {
              parentProperties.record = parentRecordSpec;
            }
            return parentProperties;
          },
        };
      }
      return properties;
    },
  };
}

function buildChartQueryOutputsSpec(outputs: FlowSurfaceChartQueryOutput[]): FlowSurfaceContextSpecNode | null {
  if (!outputs.length) {
    return null;
  }

  return {
    title: 'Builder query outputs',
    type: 'object',
    properties: () =>
      Object.fromEntries(
        outputs.map((output) => {
          const fieldValue = Array.isArray(output.field) ? output.field.join('.') : output.field;
          const descSegments = [
            output.source === 'sql'
              ? 'SQL preview output'
              : output.kind === 'measure'
                ? 'Measure output'
                : output.kind === 'dimension'
                  ? 'Dimension output'
                  : '',
            fieldValue ? `field=${fieldValue}` : '',
            output.aggregation ? `aggregation=${output.aggregation}` : '',
            output.format ? `format=${output.format}` : '',
          ].filter(Boolean);
          return [
            output.alias,
            {
              title: output.alias,
              type: output.type || 'string',
              ...(descSegments.length ? { description: descSegments.join('; ') } : {}),
            } satisfies FlowSurfaceContextSpecNode,
          ];
        }),
      ),
  };
}

function buildChartAliasesSpec(aliases: string[]): FlowSurfaceContextSpecNode | null {
  if (!aliases.length) {
    return null;
  }

  return {
    title: 'Builder query aliases',
    type: 'object',
    properties: () =>
      Object.fromEntries(
        aliases.map((alias) => [
          alias,
          {
            title: alias,
            type: 'string',
            description:
              'Builder query output alias that can be used by visual.mappings.*. Do not assume it is valid for query.sorting.field; aggregated measure outputs and custom measure aliases remain unsupported there.',
          } satisfies FlowSurfaceContextSpecNode,
        ]),
      ),
  };
}

function buildChartSupportedMappingsSpec(
  supportedMappings?: Record<string, FlowSurfaceChartMappingSupport>,
): FlowSurfaceContextSpecNode | null {
  if (!supportedMappings || !Object.keys(supportedMappings).length) {
    return null;
  }

  return {
    title: 'Supported mappings by visual type',
    type: 'object',
    properties: () =>
      Object.fromEntries(
        Object.entries(supportedMappings).map(([visualType, support]) => [
          visualType,
          {
            title: visualType,
            type: 'object',
            properties: () =>
              Object.fromEntries(
                (support.allowed || []).map((mappingKey) => [
                  mappingKey,
                  {
                    title: mappingKey,
                    type: 'string',
                    description: (support.required || []).includes(mappingKey)
                      ? 'Required mapping key'
                      : 'Optional mapping key',
                  } satisfies FlowSurfaceContextSpecNode,
                ]),
              ),
          } satisfies FlowSurfaceContextSpecNode,
        ]),
      ),
  };
}

function buildChartSupportedStylesSpec(
  supportedStyles?: Record<string, Record<string, FlowSurfaceChartStyleSupport>>,
): FlowSurfaceContextSpecNode | null {
  if (!supportedStyles || !Object.keys(supportedStyles).length) {
    return null;
  }

  return {
    title: 'Supported style keys by visual type',
    type: 'object',
    properties: () =>
      Object.fromEntries(
        Object.entries(supportedStyles).map(([visualType, styles]) => [
          visualType,
          {
            title: visualType,
            type: 'object',
            properties: () =>
              Object.fromEntries(
                Object.entries(styles || {}).map(([styleKey, support]) => [
                  styleKey,
                  {
                    title: styleKey,
                    type: support.type,
                    ...(support.description ? { description: support.description } : {}),
                    ...(support.enumValues?.length ? { enumValues: [...support.enumValues] } : {}),
                    ...(typeof support.min !== 'undefined' ? { min: support.min } : {}),
                    ...(typeof support.max !== 'undefined' ? { max: support.max } : {}),
                  } satisfies FlowSurfaceContextSpecNode,
                ]),
              ),
          } satisfies FlowSurfaceContextSpecNode,
        ]),
      ),
  };
}

function buildChartSupportedVisualTypesSpec(types: string[]): FlowSurfaceContextSpecNode | null {
  if (!types.length) {
    return null;
  }

  return {
    title: 'Supported visual types',
    type: 'object',
    properties: () =>
      Object.fromEntries(
        types.map((type) => [
          type,
          {
            title: type,
            type: 'string',
            description: 'Supported chart visual.type value',
          } satisfies FlowSurfaceContextSpecNode,
        ]),
      ),
  };
}

function buildChartHintListSpec(
  title: string,
  hints: FlowSurfaceChartCapabilityHint[],
): FlowSurfaceContextSpecNode | null {
  if (!hints.length) {
    return null;
  }

  return {
    title,
    type: 'object',
    properties: () =>
      Object.fromEntries(
        hints.map((hint) => [
          hint.key,
          {
            title: hint.title,
            type: 'string',
            description: hint.description,
          } satisfies FlowSurfaceContextSpecNode,
        ]),
      ),
  };
}

function createChartSpec(chart?: FlowSurfaceChartContext | null): FlowSurfaceContextSpecNode | null {
  if (!chart) {
    return null;
  }

  return {
    title: 'Chart helpers',
    type: 'object',
    properties: () => {
      const properties: Record<string, FlowSurfaceContextSpecNode> = {};
      const queryOutputsSpec = buildChartQueryOutputsSpec(chart.queryOutputs || []);
      if (queryOutputsSpec) {
        properties.queryOutputs = queryOutputsSpec;
      }
      const aliasesSpec = buildChartAliasesSpec(chart.aliases || []);
      if (aliasesSpec) {
        properties.aliases = aliasesSpec;
      }
      const supportedMappingsSpec = buildChartSupportedMappingsSpec(chart.supportedMappings);
      if (supportedMappingsSpec) {
        properties.supportedMappings = supportedMappingsSpec;
      }
      const supportedStylesSpec = buildChartSupportedStylesSpec(chart.supportedStyles);
      if (supportedStylesSpec) {
        properties.supportedStyles = supportedStylesSpec;
      }
      const supportedVisualTypesSpec = buildChartSupportedVisualTypesSpec(chart.supportedVisualTypes || []);
      if (supportedVisualTypesSpec) {
        properties.supportedVisualTypes = supportedVisualTypesSpec;
      }
      const safeDefaultsSpec = buildChartHintListSpec('Safe defaults', chart.safeDefaults || []);
      if (safeDefaultsSpec) {
        properties.safeDefaults = safeDefaultsSpec;
      }
      const riskyPatternsSpec = buildChartHintListSpec('Risky patterns', chart.riskyPatterns || []);
      if (riskyPatternsSpec) {
        properties.riskyPatterns = riskyPatternsSpec;
      }
      const unsupportedPatternsSpec = buildChartHintListSpec('Unsupported patterns', chart.unsupportedPatterns || []);
      if (unsupportedPatternsSpec) {
        properties.unsupportedPatterns = unsupportedPatternsSpec;
      }
      return properties;
    },
  };
}

function createSpecMap(input: FlowSurfaceContextSemantic) {
  const specs: Record<string, FlowSurfaceContextSpecNode> = {};

  const collectionSpec = createCollectionSpec(input.collection, 'Current collection');
  if (collectionSpec) {
    specs.collection = collectionSpec;
  }

  const recordSpec = createCollectionSpec(input.recordCollection, 'Current record');
  if (recordSpec) {
    specs.record = recordSpec;
  }

  const formValuesSpec = createCollectionSpec(input.formValuesCollection, 'Current form');
  if (formValuesSpec) {
    specs.formValues = formValuesSpec;
  }

  const itemSpec = buildItemChainSpec(input.itemCollections || [], input.itemRootCollection);
  if (itemSpec) {
    specs.item = itemSpec;
  }

  const popupSpec = buildPopupChainSpec(input.popupLevels || []);
  if (popupSpec) {
    specs.popup = popupSpec;
  }

  const chartSpec = createChartSpec(input.chart);
  if (chartSpec) {
    specs.chart = chartSpec;
  }

  return specs;
}

function materializeSpecNode(
  node: FlowSurfaceContextSpecNode,
  depth: number,
  maxDepth: number,
  visited: Set<string>,
): FlowSurfaceContextVarInfo {
  const output: FlowSurfaceContextVarInfo = {};
  if (typeof node.title !== 'undefined') {
    output.title = node.title;
  }
  if (typeof node.type !== 'undefined') {
    output.type = node.type;
  }
  if (typeof node.interface !== 'undefined') {
    output.interface = node.interface;
  }
  if (typeof node.description !== 'undefined') {
    output.description = node.description;
  }
  if (Array.isArray(node.enumValues) && node.enumValues.length) {
    output.enumValues = [...node.enumValues];
  }
  if (typeof node.min !== 'undefined') {
    output.min = node.min;
  }
  if (typeof node.max !== 'undefined') {
    output.max = node.max;
  }
  if (typeof node.disabled !== 'undefined') {
    output.disabled = node.disabled;
  }
  if (typeof node.disabledReason !== 'undefined') {
    output.disabledReason = node.disabledReason;
  }

  if (depth >= maxDepth || typeof node.properties !== 'function') {
    return output;
  }

  if (node.cycleKey && visited.has(node.cycleKey)) {
    return output;
  }

  const nextVisited = new Set(visited);
  if (node.cycleKey) {
    nextVisited.add(node.cycleKey);
  }

  const properties = node.properties();
  const propertyEntries = Object.entries(properties || {});
  if (!propertyEntries.length) {
    return output;
  }

  output.properties = Object.fromEntries(
    propertyEntries.map(([key, child]) => [key, materializeSpecNode(child, depth + 1, maxDepth, nextVisited)]),
  );
  return output;
}

function resolveSpecAtPath(
  specs: Record<string, FlowSurfaceContextSpecNode>,
  path: string,
): FlowSurfaceContextSpecNode | undefined {
  const segments = String(path || '')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return undefined;
  }

  let current = specs[segments[0]];
  if (!current) {
    return undefined;
  }

  for (let index = 1; index < segments.length; index += 1) {
    const properties = current.properties?.();
    if (!properties) {
      return undefined;
    }
    current = properties[segments[index]];
    if (!current) {
      return undefined;
    }
  }

  return current;
}

export function buildFlowSurfaceContextResponse(input: {
  semantic: FlowSurfaceContextSemantic;
  path?: string;
  maxDepth?: number;
}): FlowSurfaceContextResponse {
  const maxDepthRaw = input.maxDepth ?? 3;
  const maxDepth = Number.isFinite(maxDepthRaw) ? Math.max(1, Math.floor(maxDepthRaw)) : 3;
  const specs = createSpecMap(input.semantic);

  if (input.path) {
    const targetSpec = resolveSpecAtPath(specs, input.path);
    return {
      vars: targetSpec ? { [input.path]: materializeSpecNode(targetSpec, 1, maxDepth, new Set()) } : {},
    };
  }

  return {
    vars: Object.fromEntries(
      Object.entries(specs).map(([key, spec]) => [key, materializeSpecNode(spec, 1, maxDepth, new Set())]),
    ),
  };
}
