/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from '../errors';
import { normalizeFlowSurfaceComposeKey } from '../service-utils';
import type { FlowSurfaceApplyBlueprintAssetMap } from './public-types';

export function assertPlainObject(value: any, context: string) {
  if (!_.isPlainObject(value)) {
    throwBadRequest(`${context} must be an object`);
  }
}

export function assertOnlyAllowedKeys(input: Record<string, any>, context: string, allowedKeys: string[]) {
  const unsupportedKeys = Object.keys(input || {}).filter((key) => !allowedKeys.includes(key));
  if (!unsupportedKeys.length) {
    return;
  }
  throwBadRequest(
    `${context} only accepts keys ${allowedKeys.join(', ')}; unsupported keys: ${unsupportedKeys.join(', ')}`,
  );
}

export function normalizeApplyBlueprintToken(value: any, fallback = 'item') {
  const normalized = String(value || '')
    .trim()
    .replace(/[.[\](){}]+/g, '_')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
}

export function readString(value: any) {
  return typeof value === 'string' ? value.trim() : '';
}

export function readOptionalString(value: any) {
  const normalized = readString(value);
  return normalized || undefined;
}

export function readBoolean(value: any, context: string) {
  if (_.isUndefined(value)) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throwBadRequest(`${context} must be a boolean`);
  }
  return value;
}

export function assertNonEmptyString(value: any, context: string) {
  const normalized = readString(value);
  if (!normalized) {
    throwBadRequest(`${context} must be a non-empty string`);
  }
  return normalized;
}

export function readOptionalArray<T = any>(value: any, context: string): T[] | undefined {
  if (_.isUndefined(value)) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throwBadRequest(`${context} must be an array`);
  }
  return value as T[];
}

export function cloneOptionalPlainObject<T extends Record<string, any>>(value: any, context: string): T | undefined {
  if (_.isUndefined(value)) {
    return undefined;
  }
  assertPlainObject(value, context);
  return _.cloneDeep(value) as T;
}

export function buildApplyBlueprintTabPublicPath(index: number) {
  return `flowSurfaces applyBlueprint tabs[${index}]`;
}

export function buildScopedKey(scopePrefix: string, localKey: string) {
  return scopePrefix ? `${scopePrefix}.${localKey}` : localKey;
}

export function normalizeBlueprintLocalKey(rawValue: any, fallback: string, context: string) {
  const explicit = readString(rawValue);
  if (explicit) {
    return normalizeFlowSurfaceComposeKey(explicit, context);
  }
  return normalizeFlowSurfaceComposeKey(normalizeApplyBlueprintToken(fallback, fallback), context);
}

export function normalizeTabLocalKey(
  rawKey: any,
  fallback: string,
  index: number,
  usedKeys: Set<string>,
  options: {
    explicit: boolean;
  },
) {
  const normalizedBase = normalizeBlueprintLocalKey(rawKey, fallback, `flowSurfaces applyBlueprint tabs[${index}].key`);
  if (!usedKeys.has(normalizedBase)) {
    usedKeys.add(normalizedBase);
    return normalizedBase;
  }
  if (options.explicit) {
    throwBadRequest(`flowSurfaces applyBlueprint tabs[${index}].key '${normalizedBase}' is duplicated`);
  }
  let suffix = 2;
  let candidate = `${normalizedBase}_${suffix}`;
  while (usedKeys.has(candidate)) {
    suffix += 1;
    candidate = `${normalizedBase}_${suffix}`;
  }
  usedKeys.add(candidate);
  return candidate;
}

export function normalizeAssetRegistry(input: any, context: string): FlowSurfaceApplyBlueprintAssetMap {
  if (_.isUndefined(input)) {
    return {};
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`${context} must be an object map`);
  }
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      const normalizedKey = assertNonEmptyString(key, `${context} key`);
      if (!_.isPlainObject(value)) {
        throwBadRequest(`${context}['${normalizedKey}'] must be an object`);
      }
      return [normalizedKey, _.cloneDeep(value)];
    }),
  );
}
