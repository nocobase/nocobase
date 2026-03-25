/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type {
  FlowDescendantSchemaPatch,
  FlowJsonSchema,
  FlowModelSchemaPatch,
  FlowSchemaContextEdge,
  FlowSchemaCoverage,
  FlowSubModelContextPathStep,
  FlowSubModelSlotSchema,
} from '../types';
import type { RegisteredModelSchema } from '../FlowSchemaRegistry';
import { deepMergeReplaceArrays, mergeSchemas, normalizeSchemaDocs, normalizeSchemaHints } from './utils';

export function normalizeSubModelContextPath(path?: FlowSubModelContextPathStep[]): FlowSubModelContextPathStep[] {
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

export function normalizeModelSchemaPatch(patch?: FlowModelSchemaPatch): FlowModelSchemaPatch | undefined {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return undefined;
  }

  const normalized = _.pickBy(
    {
      stepParamsSchema: patch.stepParamsSchema ? _.cloneDeep(patch.stepParamsSchema) : undefined,
      flowRegistrySchema: patch.flowRegistrySchema ? _.cloneDeep(patch.flowRegistrySchema) : undefined,
      flowRegistrySchemaPatch: patch.flowRegistrySchemaPatch ? _.cloneDeep(patch.flowRegistrySchemaPatch) : undefined,
      subModelSlots: normalizeSubModelSlots(patch.subModelSlots),
      docs: patch.docs ? normalizeSchemaDocs(patch.docs) : undefined,
      examples: Array.isArray(patch.examples) ? _.cloneDeep(patch.examples) : undefined,
      skeleton: patch.skeleton === undefined ? undefined : _.cloneDeep(patch.skeleton),
      dynamicHints: Array.isArray(patch.dynamicHints) ? normalizeSchemaHints(patch.dynamicHints) : undefined,
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

export function normalizeSubModelSlots(
  slots?: Record<string, FlowSubModelSlotSchema>,
): Record<string, FlowSubModelSlotSchema> | undefined {
  if (!slots || typeof slots !== 'object' || Array.isArray(slots)) {
    return undefined;
  }

  const normalizedEntries = Object.entries(slots)
    .map(([slotKey, slot]) => {
      if (!slot?.type) {
        return undefined;
      }

      const normalizedSlot: FlowSubModelSlotSchema = {
        type: slot.type,
      };

      const normalizedUse = typeof slot.use === 'string' ? slot.use.trim() : undefined;
      if (normalizedUse) {
        normalizedSlot.use = normalizedUse;
      }

      const normalizedUses = Array.isArray(slot.uses)
        ? slot.uses.map((item) => String(item || '').trim()).filter(Boolean)
        : undefined;
      if (normalizedUses?.length) {
        normalizedSlot.uses = normalizedUses;
      }

      if (slot.required !== undefined) {
        normalizedSlot.required = slot.required;
      }
      if (slot.type === 'array' && typeof slot.minItems === 'number' && Number.isFinite(slot.minItems)) {
        normalizedSlot.minItems = Math.max(0, Math.trunc(slot.minItems));
      }
      if (slot.dynamic !== undefined) {
        normalizedSlot.dynamic = slot.dynamic;
      }
      if (slot.schema) {
        normalizedSlot.schema = _.cloneDeep(slot.schema);
      }
      if (typeof slot.fieldBindingContext === 'string' && slot.fieldBindingContext.trim()) {
        normalizedSlot.fieldBindingContext = slot.fieldBindingContext.trim();
      }

      const childSchemaPatch = normalizeChildSchemaPatch(slot.childSchemaPatch);
      if (childSchemaPatch) {
        normalizedSlot.childSchemaPatch = childSchemaPatch;
      }

      const descendantSchemaPatches = normalizeDescendantSchemaPatches(slot.descendantSchemaPatches);
      if (descendantSchemaPatches?.length) {
        normalizedSlot.descendantSchemaPatches = descendantSchemaPatches;
      }

      if (slot.description !== undefined) {
        normalizedSlot.description = slot.description;
      }

      return [slotKey, normalizedSlot] as const;
    })
    .filter(Boolean) as Array<readonly [string, FlowSubModelSlotSchema]>;

  return normalizedEntries.length > 0 ? Object.fromEntries(normalizedEntries) : undefined;
}

export function matchesDescendantSchemaPatch(
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

export function resolveChildSchemaPatch(
  slot: FlowSubModelSlotSchema,
  childUse: string,
): FlowModelSchemaPatch | undefined {
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

export function applyModelSchemaPatch(
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
    minimalExample: patch.docs?.minimalExample !== undefined ? patch.docs.minimalExample : target.docs?.minimalExample,
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
    !!patch.stepParamsSchema || !!patch.flowRegistrySchema || !!patch.flowRegistrySchemaPatch || !!patch.subModelSlots;
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
