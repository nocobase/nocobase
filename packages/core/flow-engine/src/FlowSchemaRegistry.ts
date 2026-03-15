/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type { ISchema } from '@formily/json-schema';
import type {
  ActionDefinition,
  FlowActionSchemaManifest,
  FlowSchemaBundleDocument,
  FlowSchemaContextEdge,
  FlowDescendantSchemaPatch,
  FlowSchemaDocs,
  FlowDynamicHint,
  FlowJsonSchema,
  FlowModelSchemaPatch,
  FlowModelSchemaManifest,
  FlowModelMeta,
  FlowSchemaCoverage,
  FlowSchemaDocument,
  FlowModelSchemaExposure,
  FlowSchemaRegistrySummary,
  FlowSubModelContextPathStep,
  FlowSubModelSlotSchema,
  ModelConstructor,
  StepDefinition,
} from './types';

export type RegisteredActionSchema = {
  name: string;
  title?: string;
  definition?: ActionDefinition;
  schema?: FlowJsonSchema;
  docs: FlowSchemaDocs;
  coverage: FlowSchemaCoverage;
  dynamicHints: FlowDynamicHint[];
};

export type RegisteredModelSchema = {
  use: string;
  modelClass?: ModelConstructor;
  stepParamsSchema?: FlowJsonSchema;
  flowRegistrySchema?: FlowJsonSchema;
  subModelSlots?: Record<string, FlowSubModelSlotSchema>;
  flowRegistrySchemaPatch?: FlowJsonSchema;
  title?: string;
  examples: any[];
  docs: FlowSchemaDocs;
  skeleton?: any;
  dynamicHints: FlowDynamicHint[];
  coverage: FlowSchemaCoverage;
  exposure: FlowModelSchemaExposure;
  allowDirectUse: boolean;
  suggestedUses: string[];
};

type StepSchemaResolution = {
  schema?: FlowJsonSchema;
  hints: FlowDynamicHint[];
  coverage: FlowSchemaCoverage['status'];
};

type ModelPatchContribution = {
  patch: FlowModelSchemaPatch;
  source: FlowSchemaCoverage['source'];
  strict?: boolean;
};

type UiSchemaLike =
  | Record<string, ISchema>
  | ((...args: any[]) => Record<string, ISchema> | Promise<Record<string, ISchema>>)
  | undefined;

const JSON_SCHEMA_DRAFT_07 = 'http://json-schema.org/draft-07/schema#';

function stableStringify(input: any): string {
  if (Array.isArray(input)) {
    return `[${input.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (_.isPlainObject(input)) {
    const entries = Object.entries(input)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(input) ?? 'null';
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function deepMergeReplaceArrays<T>(base: T, patch: any): T {
  if (typeof patch === 'undefined') {
    return _.cloneDeep(base);
  }
  if (typeof base === 'undefined') {
    return _.cloneDeep(patch);
  }
  return _.mergeWith({}, _.cloneDeep(base), _.cloneDeep(patch), (objValue, srcValue) => {
    if (Array.isArray(srcValue)) {
      return _.cloneDeep(srcValue);
    }
    return undefined;
  });
}

function mergeSchemas(base?: FlowJsonSchema, patch?: FlowJsonSchema): FlowJsonSchema | undefined {
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

function normalizeSchemaHints(hints?: FlowDynamicHint[]): FlowDynamicHint[] {
  return Array.isArray(hints)
    ? _.uniqBy(
        hints.map((item) => normalizeFlowHint(item)),
        (item) => `${item.kind}:${item.path || ''}:${item.message}`,
      )
    : [];
}

function normalizeSchemaDocs(docs?: FlowSchemaDocs): FlowSchemaDocs {
  return {
    description: docs?.description,
    examples: Array.isArray(docs?.examples) ? _.cloneDeep(docs?.examples) : [],
    minimalExample: docs?.minimalExample === undefined ? undefined : _.cloneDeep(docs.minimalExample),
    commonPatterns: Array.isArray(docs?.commonPatterns) ? _.cloneDeep(docs?.commonPatterns) : [],
    antiPatterns: Array.isArray(docs?.antiPatterns) ? _.cloneDeep(docs?.antiPatterns) : [],
    dynamicHints: normalizeSchemaHints(docs?.dynamicHints),
  };
}

function normalizeStringArray(values?: string[]): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return _.uniq(values.map((item) => String(item || '').trim()).filter(Boolean));
}

function normalizeSubModelContextPath(path?: FlowSubModelContextPathStep[]): FlowSubModelContextPathStep[] {
  if (!Array.isArray(path)) {
    return [];
  }
  return path
    .map((step) => ({
      slotKey: String(step?.slotKey || '').trim(),
      ...(typeof step?.use === 'string'
        ? { use: step.use.trim() }
        : Array.isArray(step?.use)
          ? { use: step.use.map((item) => String(item || '').trim()).filter(Boolean) }
          : {}),
    }))
    .filter((step) => !!step.slotKey);
}

function normalizeModelSchemaPatch(patch?: FlowModelSchemaPatch): FlowModelSchemaPatch | undefined {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return undefined;
  }

  const normalizedDynamicHints = Array.isArray(patch.dynamicHints)
    ? normalizeSchemaHints(patch.dynamicHints)
    : undefined;

  const normalized = _.pickBy(
    {
      stepParamsSchema: patch.stepParamsSchema ? _.cloneDeep(patch.stepParamsSchema) : undefined,
      flowRegistrySchema: patch.flowRegistrySchema ? _.cloneDeep(patch.flowRegistrySchema) : undefined,
      flowRegistrySchemaPatch: patch.flowRegistrySchemaPatch ? _.cloneDeep(patch.flowRegistrySchemaPatch) : undefined,
      subModelSlots: normalizeSubModelSlots(patch.subModelSlots),
      docs: patch.docs ? normalizeSchemaDocs(patch.docs) : undefined,
      examples: Array.isArray(patch.examples) ? _.cloneDeep(patch.examples) : undefined,
      skeleton: patch.skeleton === undefined ? undefined : _.cloneDeep(patch.skeleton),
      dynamicHints: normalizedDynamicHints,
    },
    (value) => value !== undefined && (!Array.isArray(value) || value.length > 0),
  ) as FlowModelSchemaPatch;

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeDescendantSchemaPatches(
  patches?: FlowDescendantSchemaPatch[],
): FlowDescendantSchemaPatch[] | undefined {
  if (!Array.isArray(patches)) {
    return undefined;
  }

  const normalized = patches
    .map((item) => {
      const path = normalizeSubModelContextPath(item?.path);
      const patch = normalizeModelSchemaPatch(item?.patch);
      if (!patch) {
        return undefined;
      }
      return { path, patch };
    })
    .filter(Boolean) as FlowDescendantSchemaPatch[];

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeChildSchemaPatch(
  patch?: FlowSubModelSlotSchema['childSchemaPatch'],
): FlowSubModelSlotSchema['childSchemaPatch'] | undefined {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return undefined;
  }

  const directPatch = normalizeModelSchemaPatch(patch as FlowModelSchemaPatch);
  if (directPatch) {
    return directPatch;
  }

  const entries = Object.entries(patch as Record<string, FlowModelSchemaPatch>)
    .map(([childUse, childPatch]) => [String(childUse || '').trim(), normalizeModelSchemaPatch(childPatch)] as const)
    .filter(([childUse, childPatch]) => !!childUse && !!childPatch);

  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function normalizeSubModelSlots(
  slots?: Record<string, FlowSubModelSlotSchema>,
): Record<string, FlowSubModelSlotSchema> | undefined {
  if (!slots || typeof slots !== 'object' || Array.isArray(slots)) {
    return undefined;
  }

  const normalizedEntries = Object.entries(slots)
    .map(([slotKey, slot]) => {
      const normalizedType = slot?.type;
      if (!normalizedType) {
        return undefined;
      }

      const normalizedSlot: FlowSubModelSlotSchema = {
        type: normalizedType,
      };

      const normalizedUse = typeof slot?.use === 'string' ? slot.use.trim() : undefined;
      if (normalizedUse) {
        normalizedSlot.use = normalizedUse;
      }

      const normalizedUses = Array.isArray(slot?.uses)
        ? slot.uses.map((item) => String(item || '').trim()).filter(Boolean)
        : undefined;
      if (normalizedUses?.length) {
        normalizedSlot.uses = normalizedUses;
      }

      if (slot?.required !== undefined) {
        normalizedSlot.required = slot.required;
      }

      if (slot?.dynamic !== undefined) {
        normalizedSlot.dynamic = slot.dynamic;
      }

      if (slot?.schema) {
        normalizedSlot.schema = _.cloneDeep(slot.schema);
      }

      const childSchemaPatch = normalizeChildSchemaPatch(slot?.childSchemaPatch);
      if (childSchemaPatch) {
        normalizedSlot.childSchemaPatch = childSchemaPatch;
      }

      const descendantSchemaPatches = normalizeDescendantSchemaPatches(slot?.descendantSchemaPatches);
      if (descendantSchemaPatches?.length) {
        normalizedSlot.descendantSchemaPatches = descendantSchemaPatches;
      }

      if (slot?.description !== undefined) {
        normalizedSlot.description = slot.description;
      }

      return [slotKey, normalizedSlot] as const;
    })
    .filter(Boolean) as Array<readonly [string, FlowSubModelSlotSchema]>;

  return normalizedEntries.length > 0 ? Object.fromEntries(normalizedEntries) : undefined;
}

function createFlowHint(hint: FlowDynamicHint, metadata?: FlowDynamicHint['x-flow']): FlowDynamicHint {
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

function collectAllowedUses(slot?: FlowSubModelSlotSchema): string[] {
  if (!slot) return [];
  if (Array.isArray(slot.uses)) {
    return slot.uses.filter(Boolean);
  }
  return slot.use ? [slot.use] : [];
}

function buildSkeletonFromSchema(
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
    if (propertyName === 'uid') return 'todo-uid';
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

function collectKeyEnums(
  schema?: FlowJsonSchema,
  path = '#',
  bucket: Record<string, any[]> = {},
  depth = 0,
  limit = 24,
): Record<string, any[]> {
  if (!schema || depth > 3 || Object.keys(bucket).length >= limit) {
    return bucket;
  }

  if (Array.isArray(schema.enum) && schema.enum.length) {
    bucket[path] = _.cloneDeep(schema.enum);
  } else if (schema.const !== undefined) {
    bucket[path] = [_.cloneDeep(schema.const)];
  }

  if (_.isPlainObject(schema.properties)) {
    for (const [key, child] of Object.entries(schema.properties as Record<string, FlowJsonSchema>)) {
      collectKeyEnums(child, `${path}/properties/${key}`, bucket, depth + 1, limit);
      if (Object.keys(bucket).length >= limit) break;
    }
  }

  if (_.isPlainObject(schema.items)) {
    collectKeyEnums(schema.items as FlowJsonSchema, `${path}/items`, bucket, depth + 1, limit);
  }

  if (Array.isArray(schema.oneOf)) {
    schema.oneOf
      .slice(0, 2)
      .forEach((child, index) => collectKeyEnums(child, `${path}/oneOf/${index}`, bucket, depth + 1, limit));
  }

  return bucket;
}

function toSchemaTitle(input: any, fallback: string): string {
  if (typeof input === 'string') {
    return input;
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input);
  }
  return fallback;
}

function inferSchemaFromUiSchemaValue(
  name: string,
  uiSchema: ISchema,
  path: string,
  hints: FlowDynamicHint[],
): FlowJsonSchema {
  if (!uiSchema || typeof uiSchema !== 'object' || Array.isArray(uiSchema)) {
    return { type: 'object', additionalProperties: true };
  }

  const xComponent = (uiSchema as any)['x-component'];
  if (typeof xComponent === 'function') {
    hints.push(
      createFlowHint(
        {
          kind: 'custom-component',
          path,
          message: `${name} uses a custom component and needs manual schema review.`,
        },
        {
          unresolvedReason: 'function-x-component',
          recommendedFallback: { type: 'object', additionalProperties: true },
        },
      ),
    );
  }

  const reactions = (uiSchema as any)['x-reactions'];
  if (
    reactions &&
    ((Array.isArray(reactions) && reactions.some((item) => typeof item === 'function')) ||
      typeof reactions === 'function')
  ) {
    hints.push(
      createFlowHint(
        {
          kind: 'x-reactions',
          path,
          message: `${name} contains function-based x-reactions and only static schema is generated.`,
        },
        {
          unresolvedReason: 'function-x-reactions',
        },
      ),
    );
  }

  const schema: FlowJsonSchema = {};
  const type = (uiSchema as any).type;
  if (type) {
    schema.type = type;
  }
  if ((uiSchema as any).description) {
    schema.description = (uiSchema as any).description;
  }
  if ((uiSchema as any).default !== undefined) {
    schema.default = _.cloneDeep((uiSchema as any).default);
  }
  if ((uiSchema as any).enum) {
    if (
      Array.isArray((uiSchema as any).enum) &&
      (uiSchema as any).enum.every((item) => _.isPlainObject(item) && 'value' in item)
    ) {
      schema.enum = (uiSchema as any).enum.map((item) => item.value);
    } else {
      schema.enum = _.cloneDeep((uiSchema as any).enum);
    }
  }
  if ((uiSchema as any).const !== undefined) {
    schema.const = _.cloneDeep((uiSchema as any).const);
  }
  if ((uiSchema as any).required === true) {
    schema.__required = true;
  }

  const validator = (uiSchema as any)['x-validator'];
  if (_.isPlainObject(validator)) {
    if (validator.minimum !== undefined) schema.minimum = validator.minimum;
    if (validator.maximum !== undefined) schema.maximum = validator.maximum;
    if (validator.minLength !== undefined) schema.minLength = validator.minLength;
    if (validator.maxLength !== undefined) schema.maxLength = validator.maxLength;
    if (validator.pattern !== undefined) schema.pattern = validator.pattern;
  } else if (Array.isArray(validator)) {
    for (const item of validator) {
      if (_.isPlainObject(item)) {
        Object.assign(schema, _.pick(item, ['minimum', 'maximum', 'minLength', 'maxLength', 'pattern']));
      }
    }
  } else if (typeof validator === 'string') {
    if (validator === 'integer') schema.type = 'integer';
    if (validator === 'email') schema.format = 'email';
    if (validator === 'url') schema.format = 'uri';
    if (validator === 'uid') schema.pattern = '^[A-Za-z0-9_-]+$';
  }

  if ((uiSchema as any).properties && _.isPlainObject((uiSchema as any).properties)) {
    schema.type = schema.type || 'object';
    schema.properties = {};
    const required: string[] = [];
    for (const [propName, propValue] of Object.entries((uiSchema as any).properties)) {
      const childSchema = inferSchemaFromUiSchemaValue(propName, propValue as ISchema, `${path}.${propName}`, hints);
      if ((childSchema as any).__required) {
        required.push(propName);
        delete (childSchema as any).__required;
      }
      (schema.properties as any)[propName] = childSchema;
    }
    if (required.length) schema.required = required;
    schema.additionalProperties = false;
  }

  if ((uiSchema as any).items) {
    schema.type = schema.type || 'array';
    if (_.isPlainObject((uiSchema as any).items)) {
      schema.items = inferSchemaFromUiSchemaValue(`${name}.items`, (uiSchema as any).items, `${path}.items`, hints);
    } else if (Array.isArray((uiSchema as any).items)) {
      schema.items = (uiSchema as any).items.map((item, index) =>
        inferSchemaFromUiSchemaValue(`${name}.items[${index}]`, item, `${path}.items[${index}]`, hints),
      );
    }
  }

  if (!schema.type) {
    schema.type = 'object';
    schema.additionalProperties = true;
  }

  return schema;
}

function inferParamsSchemaFromUiSchema(name: string, uiSchema: UiSchemaLike, path: string): StepSchemaResolution {
  const hints: FlowDynamicHint[] = [];
  if (!uiSchema) {
    return { schema: undefined, hints, coverage: 'unresolved' };
  }
  if (typeof uiSchema === 'function') {
    hints.push(
      createFlowHint(
        {
          kind: 'dynamic-ui-schema',
          path,
          message: `${name} uses function-based uiSchema and requires manual schema patch.`,
        },
        {
          unresolvedReason: 'function-ui-schema',
          recommendedFallback: { type: 'object', additionalProperties: true },
        },
      ),
    );
    return {
      schema: { type: 'object', additionalProperties: true },
      hints,
      coverage: 'unresolved',
    };
  }

  const properties: Record<string, any> = {};
  const required: string[] = [];
  for (const [key, value] of Object.entries(uiSchema || {})) {
    const childSchema = inferSchemaFromUiSchemaValue(key, value, `${path}.${key}`, hints);
    if ((childSchema as any).__required) {
      required.push(key);
      delete (childSchema as any).__required;
    }
    properties[key] = childSchema;
  }

  return {
    schema: {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: false,
    },
    hints,
    coverage: hints.length ? 'mixed' : 'auto',
  };
}

export class FlowSchemaRegistry {
  private readonly modelSchemas = new Map<string, RegisteredModelSchema>();
  private readonly actionSchemas = new Map<string, RegisteredActionSchema>();
  private readonly resolvedModelCache = new Map<string, RegisteredModelSchema>();

  registerAction(action: ActionDefinition | ({ name: string } & Partial<ActionDefinition>)) {
    const name = String(action?.name || '').trim();
    if (!name) return;

    const previous = this.actionSchemas.get(name);
    const inferred = inferParamsSchemaFromUiSchema(name, action.uiSchema as any, `actions.${name}`);
    const mergedSchema = mergeSchemas(action.paramsSchema || inferred.schema, action.paramsSchemaPatch);
    const explicit = !!action.paramsSchema || !!action.paramsSchemaPatch;
    const coverageStatus: FlowSchemaCoverage['status'] = explicit
      ? inferred.schema
        ? 'mixed'
        : 'manual'
      : inferred.coverage;
    const docs = normalizeSchemaDocs({
      ...previous?.docs,
      ...action.schemaDocs,
      examples: action.schemaDocs?.examples || previous?.docs?.examples,
      dynamicHints: [...(previous?.docs?.dynamicHints || []), ...(action.schemaDocs?.dynamicHints || [])],
    });

    this.actionSchemas.set(name, {
      name,
      title: action.title,
      definition: action as ActionDefinition,
      schema: mergedSchema,
      coverage: {
        status: mergedSchema ? coverageStatus : 'unresolved',
        source: previous?.coverage.source || 'official',
        strict: previous?.coverage.strict,
      },
      docs,
      dynamicHints: normalizeSchemaHints([
        ...(previous?.dynamicHints || []),
        ...(inferred.hints || []),
        ...(docs.dynamicHints || []),
      ]),
    });
  }

  registerActions(actions: Record<string, ActionDefinition>) {
    for (const action of Object.values(actions || {})) {
      this.registerAction(action);
    }
  }

  registerActionManifest(manifest: FlowActionSchemaManifest) {
    const name = String(manifest?.name || '').trim();
    if (!name) return;

    const previous = this.actionSchemas.get(name);
    const docs = normalizeSchemaDocs({
      ...previous?.docs,
      ...manifest.docs,
      examples: manifest.docs?.examples || previous?.docs?.examples,
      dynamicHints: [...(previous?.docs?.dynamicHints || []), ...(manifest.docs?.dynamicHints || [])],
      commonPatterns: manifest.docs?.commonPatterns || previous?.docs?.commonPatterns,
      antiPatterns: manifest.docs?.antiPatterns || previous?.docs?.antiPatterns,
      minimalExample:
        manifest.docs?.minimalExample !== undefined ? manifest.docs.minimalExample : previous?.docs?.minimalExample,
    });
    this.actionSchemas.set(name, {
      name,
      title: manifest.title || previous?.title,
      definition: previous?.definition,
      schema: manifest.paramsSchema ? _.cloneDeep(manifest.paramsSchema) : previous?.schema,
      docs,
      coverage: {
        status: manifest.paramsSchema ? 'manual' : previous?.coverage.status || 'unresolved',
        source: manifest.source || previous?.coverage.source || 'official',
        strict: manifest.strict ?? previous?.coverage.strict,
      },
      dynamicHints: normalizeSchemaHints([...(previous?.dynamicHints || []), ...(docs.dynamicHints || [])]),
    });
  }

  registerActionManifests(manifests: FlowActionSchemaManifest[] | Record<string, FlowActionSchemaManifest>) {
    const values = Array.isArray(manifests) ? manifests : Object.values(manifests || {});
    for (const manifest of values) {
      this.registerActionManifest(manifest);
    }
  }

  registerModel(use: string, options: Partial<RegisteredModelSchema>) {
    const name = String(use || '').trim();
    if (!name) return;
    const previous = this.modelSchemas.get(name);
    this.modelSchemas.set(name, {
      use: name,
      title: options.title || previous?.title,
      modelClass: options.modelClass || previous?.modelClass,
      stepParamsSchema: options.stepParamsSchema || previous?.stepParamsSchema,
      flowRegistrySchema: options.flowRegistrySchema || previous?.flowRegistrySchema,
      subModelSlots: normalizeSubModelSlots(options.subModelSlots || previous?.subModelSlots),
      flowRegistrySchemaPatch: options.flowRegistrySchemaPatch || previous?.flowRegistrySchemaPatch,
      examples: options.examples || previous?.examples || [],
      docs: normalizeSchemaDocs({
        ...previous?.docs,
        ...options.docs,
        examples: options.docs?.examples || previous?.docs?.examples,
        dynamicHints: [...(previous?.docs?.dynamicHints || []), ...(options.docs?.dynamicHints || [])],
        commonPatterns: options.docs?.commonPatterns || previous?.docs?.commonPatterns,
        antiPatterns: options.docs?.antiPatterns || previous?.docs?.antiPatterns,
        minimalExample:
          options.docs?.minimalExample !== undefined ? options.docs.minimalExample : previous?.docs?.minimalExample,
      }),
      skeleton: options.skeleton !== undefined ? _.cloneDeep(options.skeleton) : previous?.skeleton,
      dynamicHints: normalizeSchemaHints([...(previous?.dynamicHints || []), ...(options.dynamicHints || [])]),
      coverage: options.coverage || previous?.coverage || { status: 'unresolved', source: 'third-party' },
      exposure: options.exposure ?? previous?.exposure ?? 'public',
      allowDirectUse: options.allowDirectUse ?? previous?.allowDirectUse ?? true,
      suggestedUses: normalizeStringArray(options.suggestedUses || previous?.suggestedUses),
    });
    this.resolvedModelCache.clear();
  }

  registerModelManifest(manifest: FlowModelSchemaManifest) {
    const use = String(manifest?.use || '').trim();
    if (!use) return;

    const previous = this.modelSchemas.get(use);
    const docs = normalizeSchemaDocs({
      ...previous?.docs,
      ...manifest.docs,
      examples: manifest.examples || manifest.docs?.examples || previous?.docs?.examples,
      dynamicHints: [...(previous?.docs?.dynamicHints || []), ...(manifest.docs?.dynamicHints || [])],
      commonPatterns: manifest.docs?.commonPatterns || previous?.docs?.commonPatterns,
      antiPatterns: manifest.docs?.antiPatterns || previous?.docs?.antiPatterns,
      minimalExample:
        manifest.docs?.minimalExample !== undefined ? manifest.docs.minimalExample : previous?.docs?.minimalExample,
    });
    this.registerModel(use, {
      title: manifest.title,
      stepParamsSchema: manifest.stepParamsSchema ? _.cloneDeep(manifest.stepParamsSchema) : undefined,
      flowRegistrySchema: manifest.flowRegistrySchema ? _.cloneDeep(manifest.flowRegistrySchema) : undefined,
      subModelSlots: manifest.subModelSlots ? normalizeSubModelSlots(manifest.subModelSlots) : undefined,
      flowRegistrySchemaPatch: manifest.flowRegistrySchemaPatch
        ? _.cloneDeep(manifest.flowRegistrySchemaPatch)
        : undefined,
      examples: manifest.examples || docs.examples || [],
      docs,
      skeleton: manifest.skeleton,
      dynamicHints: [...(manifest.dynamicHints || []), ...(docs.dynamicHints || [])],
      coverage: {
        status:
          manifest.stepParamsSchema || manifest.flowRegistrySchema || manifest.subModelSlots ? 'manual' : 'unresolved',
        source: manifest.source || 'official',
        strict: manifest.strict,
      },
      exposure: manifest.exposure,
      allowDirectUse: manifest.allowDirectUse,
      suggestedUses: manifest.suggestedUses,
    });
  }

  registerModelManifests(manifests: FlowModelSchemaManifest[] | Record<string, FlowModelSchemaManifest>) {
    const values = Array.isArray(manifests) ? manifests : Object.values(manifests || {});
    for (const manifest of values) {
      this.registerModelManifest(manifest);
    }
  }

  registerModelClass(use: string, modelClass: ModelConstructor) {
    const meta = ((modelClass as any).meta || {}) as FlowModelMeta;
    const schemaMeta = meta.schema || {};
    const inferredSlots = this.inferSubModelSlotsFromModelClass(use, modelClass);
    const inferredHints = this.collectModelDynamicHints(use, modelClass, meta);
    const hasManual =
      !!schemaMeta.stepParamsSchema ||
      !!schemaMeta.flowRegistrySchema ||
      !!schemaMeta.subModelSlots ||
      !!schemaMeta.flowRegistrySchemaPatch;
    const hasAuto = !!Object.keys(inferredSlots).length;

    this.registerModel(use, {
      modelClass,
      title: toSchemaTitle(meta.label, use),
      stepParamsSchema: schemaMeta.stepParamsSchema,
      flowRegistrySchema: schemaMeta.flowRegistrySchema,
      subModelSlots: Object.keys(schemaMeta.subModelSlots || {}).length ? schemaMeta.subModelSlots : inferredSlots,
      flowRegistrySchemaPatch: schemaMeta.flowRegistrySchemaPatch,
      examples: schemaMeta.examples || schemaMeta.docs?.examples || [],
      docs: schemaMeta.docs,
      skeleton: schemaMeta.skeleton,
      dynamicHints: [...(schemaMeta.dynamicHints || []), ...(schemaMeta.docs?.dynamicHints || []), ...inferredHints],
      coverage: {
        status: hasManual && hasAuto ? 'mixed' : hasManual ? 'manual' : hasAuto ? 'auto' : 'unresolved',
        source: schemaMeta.source || 'official',
        strict: schemaMeta.strict,
      },
      exposure: schemaMeta.exposure,
      allowDirectUse: schemaMeta.allowDirectUse,
      suggestedUses: schemaMeta.suggestedUses,
    });
  }

  registerModels(models: Record<string, ModelConstructor | undefined>) {
    for (const [use, modelClass] of Object.entries(models || {})) {
      if (modelClass) {
        this.registerModelClass(use, modelClass);
      }
    }
  }

  getAction(name: string): RegisteredActionSchema | undefined {
    return this.actionSchemas.get(name);
  }

  listActionNames(): string[] {
    return Array.from(this.actionSchemas.keys()).sort();
  }

  getModel(use: string): RegisteredModelSchema | undefined {
    return this.modelSchemas.get(use);
  }

  resolveModelSchema(use: string, contextChain: FlowSchemaContextEdge[] = []): RegisteredModelSchema {
    const name = String(use || '').trim();
    const cacheKey = `${name}::${stableStringify(contextChain)}`;
    const cached = this.resolvedModelCache.get(cacheKey);
    if (cached) {
      return _.cloneDeep(cached);
    }

    const registered = this.modelSchemas.get(name);
    const resolved: RegisteredModelSchema = {
      use: name,
      title: registered?.title || name,
      modelClass: registered?.modelClass,
      stepParamsSchema: registered?.stepParamsSchema
        ? _.cloneDeep(registered.stepParamsSchema)
        : this.buildInferredStepParamsSchema(name),
      flowRegistrySchema: registered?.flowRegistrySchema
        ? _.cloneDeep(registered.flowRegistrySchema)
        : this.buildInferredFlowRegistrySchema(name),
      subModelSlots: normalizeSubModelSlots(registered?.subModelSlots),
      flowRegistrySchemaPatch: registered?.flowRegistrySchemaPatch
        ? _.cloneDeep(registered.flowRegistrySchemaPatch)
        : undefined,
      examples: _.cloneDeep(registered?.examples || []),
      docs: normalizeSchemaDocs(registered?.docs),
      skeleton: registered?.skeleton === undefined ? undefined : _.cloneDeep(registered.skeleton),
      dynamicHints: normalizeSchemaHints(registered?.dynamicHints),
      coverage: registered?.coverage || { status: 'unresolved', source: 'third-party' },
      exposure: registered?.exposure || 'public',
      allowDirectUse: registered?.allowDirectUse ?? true,
      suggestedUses: normalizeStringArray(registered?.suggestedUses),
    };

    for (const contribution of this.collectContextPatches(name, contextChain)) {
      this.applyModelSchemaPatch(resolved, contribution.patch, contribution.source, contribution.strict);
    }

    this.resolvedModelCache.set(cacheKey, _.cloneDeep(resolved));
    return resolved;
  }

  private isPublicModel(model?: Pick<RegisteredModelSchema, 'exposure'>): boolean {
    return (model?.exposure || 'public') === 'public';
  }

  getSuggestedUses(use: string): string[] {
    const model = this.modelSchemas.get(String(use || '').trim());
    if (model?.suggestedUses?.length) {
      return normalizeStringArray(model.suggestedUses);
    }
    return this.listModelUses({ publicOnly: true, directUseOnly: true })
      .filter((item) => item !== use)
      .slice(0, 20);
  }

  hasPublicModel(use: string): boolean {
    const model = this.modelSchemas.get(String(use || '').trim());
    return !!model && this.isPublicModel(model);
  }

  isDirectUseAllowed(use: string): boolean {
    const model = this.modelSchemas.get(String(use || '').trim());
    return model ? model.allowDirectUse !== false : true;
  }

  listModelUses(options: { publicOnly?: boolean; directUseOnly?: boolean } = {}): string[] {
    const { publicOnly = false, directUseOnly = false } = options;
    return Array.from(this.modelSchemas.values())
      .filter((model) => !publicOnly || this.isPublicModel(model))
      .filter((model) => !directUseOnly || model.allowDirectUse !== false)
      .map((model) => model.use)
      .sort();
  }

  listModelDocuments(options: { publicOnly?: boolean } = {}): FlowSchemaDocument[] {
    return this.listModelUses({ publicOnly: options.publicOnly }).map((use) => this.getModelDocument(use));
  }

  getCoverageSummary(options: { publicOnly?: boolean } = {}): FlowSchemaRegistrySummary {
    const { publicOnly = false } = options;
    const models = Array.from(this.modelSchemas.values()).filter((model) => !publicOnly || this.isPublicModel(model));
    return {
      registeredModels: models.length,
      registeredActions: this.actionSchemas.size,
      strictModels: models.filter((item) => item.coverage.strict).length,
      unresolvedModels: models.filter((item) => item.coverage.status === 'unresolved').length,
      officialModels: models.filter((item) => item.coverage.source === 'official').length,
      pluginModels: models.filter((item) => item.coverage.source === 'plugin').length,
      thirdPartyModels: models.filter((item) => item.coverage.source === 'third-party').length,
    };
  }

  getSchemaBundle(uses?: string[]): FlowSchemaBundleDocument {
    const documents = (
      !uses || uses.length === 0
        ? this.listModelDocuments({ publicOnly: true })
        : uses.filter((use) => this.hasPublicModel(use)).map((use) => this.getModelDocument(use))
    ).filter(Boolean);
    return {
      generatedAt: new Date().toISOString(),
      summary: this.getCoverageSummary({ publicOnly: true }),
      items: documents.map((document) => ({
        use: document.use,
        title: document.title,
        hash: document.hash,
        source: document.source,
        coverage: document.coverage,
        dynamicHints: _.cloneDeep(document.dynamicHints || []),
        minimalExample: _.cloneDeep(document.minimalExample),
        skeleton: _.cloneDeep(document.skeleton),
        commonPatterns: _.cloneDeep(document.commonPatterns || []),
        antiPatterns: _.cloneDeep(document.antiPatterns || []),
        keyEnums: collectKeyEnums(document.jsonSchema),
      })),
    };
  }

  getModelDocument(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowSchemaDocument {
    return this.buildModelDocument(use, contextChain, new Set<string>());
  }

  private buildModelDocument(
    use: string,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
  ): FlowSchemaDocument {
    const resolved = this.resolveModelSchema(use, contextChain);
    const baseCoverage = resolved.coverage || { status: 'unresolved', source: 'third-party' as const };
    const flowDiagnostics = this.collectFlowSchemaDiagnostics(use);
    const slotHints = Object.entries(resolved?.subModelSlots || {}).map(([slotKey, slot]) =>
      createFlowHint(
        {
          kind: slot.dynamic ? 'dynamic-children' : 'manual-schema-required',
          path: `${use}.subModels.${slotKey}`,
          message:
            slot.description ||
            `${use}.subModels.${slotKey} accepts ${slot.type}${
              collectAllowedUses(slot).length ? `: ${collectAllowedUses(slot).join(', ')}` : ''
            }.`,
        },
        {
          slotRules: {
            slotKey,
            type: slot.type,
            allowedUses: collectAllowedUses(slot),
          },
        },
      ),
    );
    const coverage = this.buildDocumentCoverage(baseCoverage, flowDiagnostics.statuses);
    const dynamicHints = normalizeSchemaHints([
      ...(resolved?.dynamicHints || []),
      ...slotHints,
      ...flowDiagnostics.hints,
      ...this.collectNestedDocumentHints(use, contextChain, visited),
      ...(coverage.status === 'unresolved'
        ? [
            createFlowHint(
              {
                kind: 'unresolved-model' as const,
                path: use,
                message: `${use} has no registered server-safe schema manifest yet.`,
              },
              {
                unresolvedReason: 'missing-model-manifest',
                recommendedFallback: { use },
              },
            ),
          ]
        : []),
    ]);

    const jsonSchema = this.buildModelSnapshotSchema(use, contextChain);
    const skeleton = _.cloneDeep(resolved?.skeleton ?? buildSkeletonFromSchema(jsonSchema));
    const minimalExample = _.cloneDeep(resolved?.docs?.minimalExample ?? resolved?.examples?.[0] ?? skeleton);
    const hash = hashString(stableStringify(jsonSchema));

    return {
      use,
      title: resolved?.title || use,
      jsonSchema,
      coverage,
      dynamicHints,
      examples: resolved?.examples || [],
      minimalExample,
      commonPatterns: _.cloneDeep(resolved?.docs?.commonPatterns || []),
      antiPatterns: _.cloneDeep(resolved?.docs?.antiPatterns || []),
      skeleton,
      hash,
      source: coverage.source,
    };
  }

  buildModelSnapshotSchema(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    const resolved = this.resolveModelSchema(use, contextChain);
    return this.buildSnapshotSchemaFromResolved(use, resolved, contextChain);
  }

  private buildSnapshotSchemaFromResolved(
    use: string | undefined,
    resolved: RegisteredModelSchema,
    contextChain: FlowSchemaContextEdge[],
  ): FlowJsonSchema {
    const flowRegistrySchema = resolved?.flowRegistrySchema || { type: 'object', additionalProperties: true };
    const stepParamsSchema = resolved?.stepParamsSchema || { type: 'object', additionalProperties: true };
    const subModelsSchema = this.buildSubModelsSchemaFromSlots(use || '', resolved?.subModelSlots, contextChain);

    return {
      $schema: JSON_SCHEMA_DRAFT_07,
      type: 'object',
      properties: {
        uid: { type: 'string' },
        use: use ? { const: use } : { type: 'string' },
        async: { type: 'boolean' },
        parentId: { type: 'string' },
        subKey: { type: 'string' },
        subType: { type: 'string', enum: ['object', 'array'] },
        sortIndex: { type: 'number' },
        stepParams: stepParamsSchema,
        flowRegistry: mergeSchemas(flowRegistrySchema, resolved?.flowRegistrySchemaPatch) || {
          type: 'object',
          additionalProperties: true,
        },
        subModels: subModelsSchema,
      },
      required: ['uid', 'use'],
      additionalProperties: true,
    };
  }

  buildStaticFlowRegistrySchema(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    const resolved = this.resolveModelSchema(use, contextChain);
    if (resolved?.flowRegistrySchema) {
      return _.cloneDeep(
        mergeSchemas(resolved.flowRegistrySchema, resolved.flowRegistrySchemaPatch) || resolved.flowRegistrySchema,
      );
    }
    return { type: 'object', additionalProperties: true };
  }

  buildStaticStepParamsSchema(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    const resolved = this.resolveModelSchema(use, contextChain);
    if (resolved?.stepParamsSchema) {
      return _.cloneDeep(resolved.stepParamsSchema);
    }
    return { type: 'object', additionalProperties: true };
  }

  buildSubModelsSchema(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    const resolved = this.resolveModelSchema(use, contextChain);
    return this.buildSubModelsSchemaFromSlots(use, resolved?.subModelSlots, contextChain);
  }

  private buildSubModelsSchemaFromSlots(
    parentUse: string,
    slots: Record<string, FlowSubModelSlotSchema> | undefined,
    contextChain: FlowSchemaContextEdge[] = [],
  ): FlowJsonSchema {
    if (!slots || Object.keys(slots).length === 0) {
      return { type: 'object', additionalProperties: true };
    }
    const properties: Record<string, FlowJsonSchema> = {};
    for (const [slotKey, slot] of Object.entries(slots)) {
      const itemSchema = this.buildSlotTargetSchema(parentUse, slotKey, slot, contextChain);
      properties[slotKey] =
        slot.type === 'array'
          ? {
              type: 'array',
              items: itemSchema,
            }
          : itemSchema;
    }
    return {
      type: 'object',
      properties,
      additionalProperties: true,
    };
  }

  private buildInferredFlowRegistrySchema(use: string): FlowJsonSchema | undefined {
    const registered = this.modelSchemas.get(use);
    const modelClass = registered?.modelClass as any;
    const flowsMap = modelClass?.globalFlowRegistry?.getFlows?.() as Map<string, any> | undefined;
    if (!flowsMap?.size) {
      return undefined;
    }

    const properties: Record<string, FlowJsonSchema> = {};
    for (const [flowKey, flowDef] of flowsMap.entries()) {
      const stepProperties: Record<string, FlowJsonSchema> = {};
      const steps = flowDef?.steps || {};
      for (const [stepKey, stepDef] of Object.entries(steps)) {
        stepProperties[stepKey] = this.buildStepDefinitionSchema(
          stepDef as StepDefinition,
          `${use}.${flowKey}.${stepKey}`,
        );
      }
      properties[flowKey] = {
        type: 'object',
        properties: {
          key: { type: 'string' },
          title: { type: 'string' },
          manual: { type: 'boolean' },
          sort: { type: 'number' },
          on: this.buildFlowOnSchema(),
          steps: {
            type: 'object',
            properties: stepProperties,
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      };
    }
    return {
      type: 'object',
      properties,
      additionalProperties: true,
    };
  }

  private buildInferredStepParamsSchema(use: string): FlowJsonSchema | undefined {
    const registered = this.modelSchemas.get(use);
    const modelClass = registered?.modelClass as any;
    const flowsMap = modelClass?.globalFlowRegistry?.getFlows?.() as Map<string, any> | undefined;
    if (!flowsMap?.size) {
      return undefined;
    }

    const properties: Record<string, FlowJsonSchema> = {};
    for (const [flowKey, flowDef] of flowsMap.entries()) {
      const stepProperties: Record<string, FlowJsonSchema> = {};
      const steps = flowDef?.steps || {};
      for (const [stepKey, stepDef] of Object.entries(steps)) {
        const resolved = this.resolveStepParamsSchema(stepDef as StepDefinition, `${use}.${flowKey}.${stepKey}`);
        stepProperties[stepKey] = resolved.schema || { type: 'object', additionalProperties: true };
      }
      properties[flowKey] = {
        type: 'object',
        properties: stepProperties,
        additionalProperties: false,
      };
    }
    return {
      type: 'object',
      properties,
      additionalProperties: true,
    };
  }

  buildFlowOnSchema(): FlowJsonSchema {
    return {
      anyOf: [
        { type: 'string' },
        {
          type: 'object',
          properties: {
            eventName: { type: 'string' },
            defaultParams: { type: 'object', additionalProperties: true },
            phase: {
              type: 'string',
              enum: ['beforeAllFlows', 'afterAllFlows', 'beforeFlow', 'afterFlow', 'beforeStep', 'afterStep'],
            },
            flowKey: { type: 'string' },
            stepKey: { type: 'string' },
          },
          required: ['eventName'],
          additionalProperties: true,
        },
      ],
    };
  }

  buildStepDefinitionSchema(step: StepDefinition, path: string): FlowJsonSchema {
    const paramsSchema = this.resolveStepParamsSchema(step, path).schema;
    return {
      type: 'object',
      properties: {
        key: { type: 'string' },
        flowKey: { type: 'string' },
        title: { type: 'string' },
        use: { type: 'string' },
        sort: { type: 'number' },
        preset: { type: 'boolean' },
        isAwait: { type: 'boolean' },
        manual: { type: 'boolean' },
        on: this.buildFlowOnSchema(),
        defaultParams: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] as any },
        paramsSchemaOverride: paramsSchema || { type: 'object', additionalProperties: true },
      },
      additionalProperties: true,
    };
  }

  resolveStepParamsSchema(step: StepDefinition, path: string): StepSchemaResolution {
    if (step.paramsSchemaOverride) {
      return {
        schema: _.cloneDeep(step.paramsSchemaOverride),
        hints: normalizeSchemaHints(step.schemaDocs?.dynamicHints),
        coverage: 'manual',
      };
    }

    if (step.use) {
      const action = this.getAction(step.use);
      if (action?.schema) {
        return {
          schema: _.cloneDeep(action.schema),
          hints: normalizeSchemaHints([...(action.dynamicHints || []), ...(step.schemaDocs?.dynamicHints || [])]),
          coverage:
            action.coverage.status === 'auto' || action.coverage.status === 'manual'
              ? action.coverage.status
              : action.coverage.status === 'unresolved'
                ? 'unresolved'
                : 'mixed',
        };
      }
      return {
        schema: { type: 'object', additionalProperties: true },
        hints: [
          createFlowHint(
            {
              kind: 'unresolved-action',
              path,
              message: `${path} references unresolved action "${step.use}".`,
            },
            {
              unresolvedReason: 'missing-action-manifest',
              recommendedFallback: { use: step.use, params: {} },
            },
          ),
          ...(step.schemaDocs?.dynamicHints || []),
        ],
        coverage: 'unresolved',
      };
    }

    const inferred = inferParamsSchemaFromUiSchema(path, step.uiSchema as any, path);
    return {
      schema: mergeSchemas(inferred.schema, step.paramsSchemaPatch),
      hints: normalizeSchemaHints([...(inferred.hints || []), ...(step.schemaDocs?.dynamicHints || [])]),
      coverage: step.paramsSchemaPatch ? 'mixed' : inferred.coverage,
    };
  }

  private buildSlotTargetSchema(
    parentUse: string,
    slotKey: string,
    slot: FlowSubModelSlotSchema,
    contextChain: FlowSchemaContextEdge[],
  ): FlowJsonSchema {
    if (slot.use) {
      return this.buildModelSnapshotSchema(slot.use, [
        ...contextChain,
        {
          parentUse,
          slotKey,
          childUse: slot.use,
        },
      ]);
    }
    if (Array.isArray(slot.uses) && slot.uses.length > 0) {
      return {
        oneOf: slot.uses.map((use) =>
          this.buildModelSnapshotSchema(use, [
            ...contextChain,
            {
              parentUse,
              slotKey,
              childUse: use,
            },
          ]),
        ),
      };
    }
    if (slot.childSchemaPatch || slot.descendantSchemaPatches?.length) {
      return this.buildAnonymousSlotSnapshotSchema(parentUse, slotKey, slot, contextChain);
    }
    if (slot.schema && !slot.childSchemaPatch && !slot.descendantSchemaPatches?.length) {
      return _.cloneDeep(slot.schema);
    }
    return { type: 'object', additionalProperties: true };
  }

  private buildAnonymousSlotSnapshotSchema(
    parentUse: string,
    slotKey: string,
    slot: FlowSubModelSlotSchema,
    contextChain: FlowSchemaContextEdge[],
  ): FlowJsonSchema {
    const anonymousResolved: RegisteredModelSchema = {
      use: '',
      title: slot.description || `${parentUse || 'AnonymousModel'}.${slotKey}`,
      examples: [],
      docs: normalizeSchemaDocs(),
      dynamicHints: [],
      coverage: {
        status: 'unresolved',
        source: 'third-party',
      },
    };

    const directPatch = this.resolveChildSchemaPatch(slot, '');
    if (directPatch) {
      this.applyModelSchemaPatch(anonymousResolved, directPatch, 'third-party');
    }

    return this.buildSnapshotSchemaFromResolved('', anonymousResolved, [
      ...contextChain,
      {
        parentUse,
        slotKey,
        childUse: '',
      },
    ]);
  }

  private collectNestedDocumentHints(
    use: string,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
  ): FlowDynamicHint[] {
    const visitKey = `${use}::${stableStringify(contextChain)}`;
    if (visited.has(visitKey)) {
      return [];
    }

    visited.add(visitKey);
    try {
      const resolved = this.resolveModelSchema(use, contextChain);
      const hints: FlowDynamicHint[] = [];
      for (const [slotKey, slot] of Object.entries(resolved.subModelSlots || {})) {
        const childUses = collectAllowedUses(slot);
        for (const childUse of childUses) {
          const childContext = [
            ...contextChain,
            {
              parentUse: use,
              slotKey,
              childUse,
            },
          ];
          const childDocument = this.buildModelDocument(childUse, childContext, visited);
          const basePath = `${use}.subModels.${slotKey}`;
          hints.push(...childDocument.dynamicHints.map((hint) => this.prefixNestedHint(hint, basePath, childUse)));
        }
      }
      return normalizeSchemaHints(hints);
    } finally {
      visited.delete(visitKey);
    }
  }

  private prefixNestedHint(hint: FlowDynamicHint, basePath: string, childUse: string): FlowDynamicHint {
    if (!hint.path) {
      return {
        ...hint,
        path: basePath,
      };
    }

    if (hint.path === childUse) {
      return {
        ...hint,
        path: basePath,
      };
    }

    if (hint.path.startsWith(`${childUse}.`)) {
      return {
        ...hint,
        path: `${basePath}.${hint.path.slice(childUse.length + 1)}`,
      };
    }

    return {
      ...hint,
      path: `${basePath}.${hint.path}`,
    };
  }

  private collectContextPatches(use: string, contextChain: FlowSchemaContextEdge[]): ModelPatchContribution[] {
    if (!contextChain.length) {
      return [];
    }

    const contributions: ModelPatchContribution[] = [];
    const targetEdgeIndex = contextChain.length - 1;

    for (let index = 0; index < contextChain.length; index++) {
      const edge = contextChain[index];
      const parentContext = contextChain.slice(0, index);
      const parentResolved = this.resolveModelSchema(edge.parentUse, parentContext);
      const slot = parentResolved.subModelSlots?.[edge.slotKey];
      if (!slot) {
        continue;
      }

      const remainingEdges = contextChain.slice(index + 1);
      for (const patch of slot.descendantSchemaPatches || []) {
        if (this.matchesDescendantSchemaPatch(patch, remainingEdges)) {
          contributions.push({
            patch: patch.patch,
            source: parentResolved.coverage.source,
            strict: parentResolved.coverage.strict,
          });
        }
      }

      if (index === targetEdgeIndex) {
        const directPatch = this.resolveChildSchemaPatch(slot, use);
        if (directPatch) {
          contributions.push({
            patch: directPatch,
            source: parentResolved.coverage.source,
            strict: parentResolved.coverage.strict,
          });
        }
      }
    }

    return contributions;
  }

  private matchesDescendantSchemaPatch(
    patch: FlowDescendantSchemaPatch,
    remainingEdges: FlowSchemaContextEdge[],
  ): boolean {
    const path = normalizeSubModelContextPath(patch.path);
    if (path.length !== remainingEdges.length) {
      return false;
    }

    return path.every((step, index) => {
      const edge = remainingEdges[index];
      if (step.slotKey !== edge.slotKey) {
        return false;
      }
      if (typeof step.use === 'undefined') {
        return true;
      }
      if (typeof step.use === 'string') {
        return step.use === edge.childUse;
      }
      return step.use.includes(edge.childUse);
    });
  }

  private resolveChildSchemaPatch(slot: FlowSubModelSlotSchema, childUse: string): FlowModelSchemaPatch | undefined {
    const childSchemaPatch = slot.childSchemaPatch;
    if (!childSchemaPatch || typeof childSchemaPatch !== 'object' || Array.isArray(childSchemaPatch)) {
      return undefined;
    }

    const directPatch = normalizeModelSchemaPatch(childSchemaPatch as FlowModelSchemaPatch);
    if (directPatch) {
      return directPatch;
    }

    return normalizeModelSchemaPatch((childSchemaPatch as Record<string, FlowModelSchemaPatch>)[childUse]);
  }

  private applyModelSchemaPatch(
    target: RegisteredModelSchema,
    patch: FlowModelSchemaPatch,
    source: FlowSchemaCoverage['source'],
    strict?: boolean,
  ) {
    target.stepParamsSchema = mergeSchemas(target.stepParamsSchema, patch.stepParamsSchema);
    target.flowRegistrySchema = mergeSchemas(target.flowRegistrySchema, patch.flowRegistrySchema);
    target.flowRegistrySchemaPatch = mergeSchemas(target.flowRegistrySchemaPatch, patch.flowRegistrySchemaPatch);
    target.subModelSlots = normalizeSubModelSlots(
      patch.subModelSlots
        ? deepMergeReplaceArrays(target.subModelSlots || {}, patch.subModelSlots)
        : target.subModelSlots,
    );
    target.docs = normalizeSchemaDocs({
      ...target.docs,
      ...patch.docs,
      examples: patch.docs?.examples || target.docs?.examples,
      dynamicHints: [...(target.docs?.dynamicHints || []), ...(patch.docs?.dynamicHints || [])],
      commonPatterns: patch.docs?.commonPatterns || target.docs?.commonPatterns,
      antiPatterns: patch.docs?.antiPatterns || target.docs?.antiPatterns,
      minimalExample:
        patch.docs?.minimalExample !== undefined ? patch.docs.minimalExample : target.docs?.minimalExample,
    });
    target.examples = Array.isArray(patch.examples) ? _.cloneDeep(patch.examples) : target.examples;
    target.skeleton =
      patch.skeleton !== undefined ? deepMergeReplaceArrays(target.skeleton, patch.skeleton) : target.skeleton;
    target.dynamicHints = normalizeSchemaHints([
      ...(target.dynamicHints || []),
      ...(patch.dynamicHints || []),
      ...(patch.docs?.dynamicHints || []),
    ]);

    const hasSchemaPatch =
      !!patch.stepParamsSchema ||
      !!patch.flowRegistrySchema ||
      !!patch.flowRegistrySchemaPatch ||
      !!patch.subModelSlots;
    if (hasSchemaPatch) {
      target.coverage = {
        ...target.coverage,
        status:
          target.coverage.status === 'unresolved'
            ? 'manual'
            : target.coverage.status === 'auto'
              ? 'mixed'
              : target.coverage.status,
        source: target.coverage.source === 'third-party' ? source : target.coverage.source,
        strict: target.coverage.strict ?? strict,
      };
    }
  }

  private collectModelDynamicHints(use: string, modelClass: ModelConstructor, meta: FlowModelMeta): FlowDynamicHint[] {
    const hints: FlowDynamicHint[] = [];
    if (typeof meta.children === 'function') {
      hints.push(
        createFlowHint(
          {
            kind: 'dynamic-children',
            path: `${use}.meta.children`,
            message: `${use} uses function-based children and only static slot hints are available.`,
          },
          {
            unresolvedReason: 'function-children',
          },
        ),
      );
    }
    if (typeof meta.createModelOptions === 'function') {
      hints.push(
        createFlowHint(
          {
            kind: 'dynamic-children',
            path: `${use}.meta.createModelOptions`,
            message: `${use} uses function-based createModelOptions and may need manual sub-model slot schema.`,
          },
          {
            unresolvedReason: 'function-create-model-options',
          },
        ),
      );
    }
    if (typeof (modelClass as any).defineChildren === 'function') {
      hints.push(
        createFlowHint(
          {
            kind: 'dynamic-children',
            path: `${use}.defineChildren`,
            message: `${use} defines dynamic children. Schema generation only keeps static baseline.`,
          },
          {
            unresolvedReason: 'runtime-define-children',
          },
        ),
      );
    }
    return hints;
  }

  private collectFlowSchemaDiagnostics(use: string): {
    hints: FlowDynamicHint[];
    statuses: FlowSchemaCoverage['status'][];
  } {
    const registered = this.modelSchemas.get(use);
    const modelClass = registered?.modelClass as any;
    const flowsMap = modelClass?.globalFlowRegistry?.getFlows?.() as Map<string, any> | undefined;
    if (!flowsMap?.size) {
      return {
        hints: [],
        statuses: [],
      };
    }

    const hints: FlowDynamicHint[] = [];
    const statuses: FlowSchemaCoverage['status'][] = [];
    for (const [flowKey, flowDef] of flowsMap.entries()) {
      for (const [stepKey, stepDef] of Object.entries(flowDef?.steps || {})) {
        const resolved = this.resolveStepParamsSchema(stepDef as StepDefinition, `${use}.${flowKey}.${stepKey}`);
        if (resolved.hints?.length) {
          hints.push(...resolved.hints);
        }
        statuses.push(resolved.coverage);
      }
    }

    return {
      hints: normalizeSchemaHints(hints),
      statuses,
    };
  }

  private buildDocumentCoverage(
    base: FlowSchemaCoverage,
    stepStatuses: FlowSchemaCoverage['status'][],
  ): FlowSchemaCoverage {
    const statuses = new Set<FlowSchemaCoverage['status']>([base.status, ...stepStatuses].filter(Boolean));

    let status: FlowSchemaCoverage['status'] = base.status;
    if (statuses.size > 1) {
      statuses.delete('unresolved');
      if (statuses.size === 0) {
        status = 'unresolved';
      } else {
        status = 'mixed';
      }
    } else if (statuses.size === 1) {
      status = (Array.from(statuses)[0] || 'unresolved') as FlowSchemaCoverage['status'];
    }

    return {
      ...base,
      status,
    };
  }

  private inferSubModelSlotsFromModelClass(
    use: string,
    modelClass: ModelConstructor,
  ): Record<string, FlowSubModelSlotSchema> {
    const meta = (((modelClass as any).meta || {}) as FlowModelMeta).schema;
    if (meta?.subModelSlots) {
      return _.cloneDeep(meta.subModelSlots);
    }

    const createModelOptions = ((modelClass as any).meta || {}).createModelOptions;
    if (!_.isPlainObject(createModelOptions) || !_.isPlainObject((createModelOptions as any).subModels)) {
      return {};
    }

    const slots: Record<string, FlowSubModelSlotSchema> = {};
    for (const [slotKey, slotValue] of Object.entries((createModelOptions as any).subModels || {})) {
      if (Array.isArray(slotValue)) {
        const first = slotValue[0] as any;
        slots[slotKey] = {
          type: 'array',
          ...(typeof first?.use === 'string' ? { use: first.use } : {}),
        };
      } else if (_.isPlainObject(slotValue)) {
        slots[slotKey] = {
          type: 'object',
          ...((slotValue as any).use ? { use: (slotValue as any).use } : {}),
        };
      } else {
        slots[slotKey] = {
          type: 'object',
        };
      }
    }
    return slots;
  }
}

export const globalFlowSchemaRegistry = new FlowSchemaRegistry();
