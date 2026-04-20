/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest, throwConflict } from '../errors';
import { buildDefinedPayload } from '../service-utils';
import type { FlowSurfaceBindKey, FlowSurfaceReadLocator } from '../types';
import type { FlowSurfaceCompiledPlanStep, FlowSurfacePlanSurfaceContext, FlowSurfaceResolvedKey } from './types';

export const FLOW_SURFACE_SYSTEM_KEY = 'surface';
export const FLOW_SURFACE_RESERVED_KEYS = new Set([FLOW_SURFACE_SYSTEM_KEY]);
export const FLOW_SURFACE_INTERNAL_META_KEY = '__flowSurfaceMeta';
export const FLOW_SURFACE_DECLARED_KEY_KEY = 'declaredKey';
export const FLOW_SURFACE_KEY_NOT_PERSISTABLE_CODE = 'FLOW_SURFACE_KEY_NOT_PERSISTABLE';

export function getDeclaredKeyFromNode(node: any) {
  const declaredKey = _.get(node, ['stepParams', FLOW_SURFACE_INTERNAL_META_KEY, FLOW_SURFACE_DECLARED_KEY_KEY]);
  return typeof declaredKey === 'string' && declaredKey.trim() ? declaredKey.trim() : undefined;
}

export function normalizeBindKeys(
  actionName: string,
  bindKeys: any,
  deps: {
    normalizeGetTarget: (value: any) => FlowSurfaceReadLocator;
  },
): FlowSurfaceBindKey[] {
  if (_.isUndefined(bindKeys)) {
    return [];
  }
  if (!Array.isArray(bindKeys)) {
    throwBadRequest(`flowSurfaces ${actionName} bindKeys must be an array`);
  }
  const seenKeys = new Set<string>();
  return bindKeys.map((item, index) => {
    if (!_.isPlainObject(item)) {
      throwBadRequest(`flowSurfaces ${actionName} bindKeys[${index}] must be an object`);
    }
    const key = String(item.key || '').trim();
    if (!key) {
      throwBadRequest(`flowSurfaces ${actionName} bindKeys[${index}].key is required`);
    }
    if (FLOW_SURFACE_RESERVED_KEYS.has(key)) {
      throwBadRequest(`flowSurfaces ${actionName} bindKeys[${index}].key '${key}' is reserved`);
    }
    if (seenKeys.has(key)) {
      throwBadRequest(`flowSurfaces ${actionName} bindKeys[${index}].key '${key}' is duplicated`);
    }
    seenKeys.add(key);
    if (!_.isPlainObject(item.locator)) {
      throwBadRequest(`flowSurfaces ${actionName} bindKeys[${index}].locator is required`);
    }
    return buildDefinedPayload({
      key,
      locator: deps.normalizeGetTarget(item.locator),
      expectedKind: typeof item.expectedKind === 'string' ? String(item.expectedKind).trim() : undefined,
      rebind: item.rebind === true,
    }) as FlowSurfaceBindKey;
  });
}

export function collectDeclaredKeysFromTree(
  node: any,
  deps: {
    actionName?: string;
    buildPlanKeyKind: (node: any, resolvedKind?: string) => string;
  },
  carry = new Map<string, FlowSurfaceResolvedKey>(),
) {
  if (!node || typeof node !== 'object') {
    return carry;
  }
  if (node.uid) {
    const declaredKey = getDeclaredKeyFromNode(node);
    if (declaredKey && !FLOW_SURFACE_RESERVED_KEYS.has(declaredKey)) {
      const existing = carry.get(declaredKey);
      if (existing && existing.uid !== node.uid) {
        throwConflict(
          `flowSurfaces ${deps.actionName || 'describeSurface'} declared key '${declaredKey}' is duplicated on '${
            existing.uid
          }' and '${node.uid}'`,
          'FLOW_SURFACE_DECLARED_KEY_CONFLICT',
        );
      }
      carry.set(declaredKey, {
        key: declaredKey,
        uid: node.uid,
        source: 'declared',
        kind: deps.buildPlanKeyKind(node),
        locator: {
          uid: node.uid,
        },
      });
    }
  }
  for (const value of Object.values(node.subModels || {})) {
    _.castArray(value as any).forEach((child) => collectDeclaredKeysFromTree(child, deps, carry));
  }
  return carry;
}

export function annotateTreeKey(tree: any, keyByUid: Map<string, string>) {
  const visit = (current: any) => {
    if (!current || typeof current !== 'object') {
      return;
    }
    const currentKey = current.uid ? keyByUid.get(current.uid) : undefined;
    if (currentKey && typeof current.key === 'undefined') {
      current.key = currentKey;
    }
    for (const value of Object.values(current.subModels || {})) {
      _.castArray(value as any).forEach((child) => visit(child));
    }
  };
  visit(tree);
  return tree;
}

export function buildSurfaceKeysObject(keyMap: Map<string, FlowSurfaceResolvedKey>) {
  return Object.fromEntries(
    Array.from(keyMap.entries()).map(([key, info]) => [
      key,
      {
        uid: info.uid,
        kind: info.kind,
        source: info.source,
        locator: info.locator,
      },
    ]),
  );
}

export function buildSurfaceFingerprintKeysObject(keyMap: Map<string, FlowSurfaceResolvedKey>) {
  return Object.fromEntries(
    Array.from(keyMap.entries()).map(([key, info]) => [
      key,
      {
        uid: info.uid,
        kind: info.kind,
      },
    ]),
  );
}

export function getSurfaceSelectorRequestKey(context: FlowSurfacePlanSurfaceContext) {
  if (!context.surfaceSelector || !('key' in context.surfaceSelector)) {
    return undefined;
  }
  return context.requestKeyMap.get(context.surfaceSelector.key);
}

export function collectRequestKeysToPersist(
  context: FlowSurfacePlanSurfaceContext,
  compiledSteps: FlowSurfaceCompiledPlanStep[],
): Map<string, FlowSurfaceResolvedKey> {
  const keys = new Map<string, FlowSurfaceResolvedKey>();
  const surfaceRequestKey = getSurfaceSelectorRequestKey(context);
  if (surfaceRequestKey) {
    keys.set(surfaceRequestKey.key, surfaceRequestKey);
  }
  for (const compiled of compiledSteps) {
    for (const keyInfo of compiled.usedKeys) {
      if (keyInfo.source === 'request') {
        keys.set(keyInfo.key, keyInfo);
      }
    }
  }
  return keys;
}
