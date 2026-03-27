/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type { FlowDynamicHint, FlowJsonSchema, FlowSchemaDocs, FlowSubModelSlotSchema } from '../types';

export const JSON_SCHEMA_DRAFT_07 = 'http://json-schema.org/draft-07/schema#';

export function stableStringify(input: any): string {
  if (Array.isArray(input)) {
    return `[${input.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (_.isPlainObject(input)) {
    const entries = Object.entries(input)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${JSON.stringify(key)}:${stableStringify(value)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(input) ?? 'null';
}

export function deepFreezePlainGraph<T>(input: T, seen = new WeakSet<object>()): T {
  if (Array.isArray(input)) {
    if (seen.has(input)) {
      return input;
    }
    seen.add(input);
    for (const item of input) {
      deepFreezePlainGraph(item, seen);
    }
    return Object.freeze(input);
  }

  if (!_.isPlainObject(input)) {
    return input;
  }

  const objectValue = input as Record<string, any>;
  if (seen.has(objectValue)) {
    return input;
  }

  seen.add(objectValue);
  for (const value of Object.values(objectValue)) {
    deepFreezePlainGraph(value, seen);
  }
  return Object.freeze(objectValue) as T;
}

export function hashString(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index++) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function deepMergeReplaceArrays<T>(base: T, patch: any): T {
  if (typeof patch === 'undefined') {
    return _.cloneDeep(base);
  }
  if (typeof base === 'undefined') {
    return _.cloneDeep(patch);
  }
  return _.mergeWith({}, _.cloneDeep(base), _.cloneDeep(patch), (_objValue, srcValue) => {
    if (Array.isArray(srcValue)) {
      return _.cloneDeep(srcValue);
    }
    return undefined;
  });
}

export function mergeSchemas(base?: FlowJsonSchema, patch?: FlowJsonSchema): FlowJsonSchema | undefined {
  if (!base && !patch) return undefined;
  if (!base) return _.cloneDeep(patch);
  if (!patch) return _.cloneDeep(base);
  return deepMergeReplaceArrays(base, patch);
}

function normalizeFlowHintMetadata(metadata?: FlowDynamicHint['x-flow']): FlowDynamicHint['x-flow'] | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const slotRules =
    metadata.slotRules && typeof metadata.slotRules === 'object' && !Array.isArray(metadata.slotRules)
      ? _.pickBy(
          {
            slotKey: metadata.slotRules.slotKey,
            type: metadata.slotRules.type,
            allowedUses: Array.isArray(metadata.slotRules.allowedUses)
              ? metadata.slotRules.allowedUses.filter(Boolean)
              : metadata.slotRules.allowedUses,
          },
          (value) => value !== undefined,
        )
      : undefined;

  const normalized = _.pickBy(
    {
      slotRules: slotRules && Object.keys(slotRules).length > 0 ? slotRules : undefined,
      contextRequirements: Array.isArray(metadata.contextRequirements)
        ? metadata.contextRequirements.filter(Boolean)
        : metadata.contextRequirements,
      unresolvedReason: metadata.unresolvedReason,
      recommendedFallback: metadata.recommendedFallback,
    },
    (value) => value !== undefined,
  ) as FlowDynamicHint['x-flow'];

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeFlowHint(hint: FlowDynamicHint): FlowDynamicHint {
  const normalizedHint = { ...hint };
  const flowMetadata = normalizeFlowHintMetadata(hint['x-flow']);
  if (flowMetadata) {
    normalizedHint['x-flow'] = flowMetadata;
  } else {
    delete normalizedHint['x-flow'];
  }
  return normalizedHint;
}

export function normalizeSchemaHints(hints?: FlowDynamicHint[]): FlowDynamicHint[] {
  return Array.isArray(hints)
    ? _.uniqBy(
        hints.map((item) => normalizeFlowHint(item)),
        (item) => `${item.kind}:${item.path || ''}:${item.message}`,
      )
    : [];
}

export function normalizeSchemaDocs(docs?: FlowSchemaDocs): FlowSchemaDocs {
  return {
    description: docs?.description,
    examples: Array.isArray(docs?.examples) ? _.cloneDeep(docs.examples) : [],
    minimalExample: docs?.minimalExample === undefined ? undefined : _.cloneDeep(docs.minimalExample),
    commonPatterns: Array.isArray(docs?.commonPatterns) ? _.cloneDeep(docs.commonPatterns) : [],
    antiPatterns: Array.isArray(docs?.antiPatterns) ? _.cloneDeep(docs.antiPatterns) : [],
    dynamicHints: normalizeSchemaHints(docs?.dynamicHints),
  };
}

export function normalizeStringArray(values?: string[]): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return _.uniq(values.map((item) => String(item || '').trim()).filter(Boolean));
}

export function createFlowHint(hint: FlowDynamicHint, metadata?: FlowDynamicHint['x-flow']): FlowDynamicHint {
  const result = { ...hint };
  const flowMetadata = normalizeFlowHintMetadata({
    ...(hint['x-flow'] || {}),
    ...(metadata || {}),
  });
  if (flowMetadata) {
    result['x-flow'] = flowMetadata;
  } else {
    delete result['x-flow'];
  }
  return result;
}

export function collectAllowedUses(slot?: FlowSubModelSlotSchema): string[] {
  if (!slot) {
    return [];
  }
  if (Array.isArray(slot.uses)) {
    return slot.uses.filter(Boolean);
  }
  return slot.use ? [slot.use] : [];
}

export function buildSkeletonFromSchema(
  schema?: FlowJsonSchema,
  options: {
    propertyName?: string;
    depth?: number;
  } = {},
): any {
  if (!schema) return undefined;
  if (schema.default !== undefined) return _.cloneDeep(schema.default);
  if (schema.const !== undefined) return _.cloneDeep(schema.const);
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return _.cloneDeep(schema.enum[0]);

  const depth = options.depth || 0;
  if (depth > 4) {
    return undefined;
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (type === 'object' || (!type && _.isPlainObject(schema.properties))) {
    const result: Record<string, any> = {};
    const properties = (schema.properties || {}) as Record<string, FlowJsonSchema>;
    const required = new Set<string>(schema.required || []);
    for (const [key, value] of Object.entries(properties)) {
      const child = buildSkeletonFromSchema(value, {
        propertyName: key,
        depth: depth + 1,
      });
      const includeOptionalTopLevelShell =
        depth === 0 &&
        ['stepParams', 'subModels', 'flowRegistry'].includes(key) &&
        child !== undefined &&
        ((_.isPlainObject(child) && Object.keys(child).length > 0) || Array.isArray(child));
      if (
        !includeOptionalTopLevelShell &&
        !required.has(key) &&
        value.default === undefined &&
        value.const === undefined
      ) {
        continue;
      }
      if (child !== undefined) {
        result[key] = child;
      }
    }
    return result;
  }

  if (type === 'array') {
    return [];
  }
  if (type === 'boolean') {
    return false;
  }
  if (type === 'integer' || type === 'number') {
    return 0;
  }
  if (type === 'string') {
    const propertyName = options.propertyName || 'value';
    if (propertyName === 'uid') {
      return 'todo-uid';
    }
    return '';
  }
  if (schema.oneOf?.length) {
    return buildSkeletonFromSchema(schema.oneOf[0], {
      propertyName: options.propertyName,
      depth: depth + 1,
    });
  }
  if (schema.anyOf?.length) {
    return buildSkeletonFromSchema(schema.anyOf[0], {
      propertyName: options.propertyName,
      depth: depth + 1,
    });
  }
  return undefined;
}

export function toSchemaTitle(input: any, fallback: string): string {
  if (typeof input === 'string') {
    return input;
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input);
  }
  return fallback;
}
