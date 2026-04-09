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
import type { FlowSurfaceBindRef, FlowSurfaceReadLocator } from '../types';
import type { FlowSurfaceCompiledPlanStep, FlowSurfacePlanSurfaceContext, FlowSurfaceResolvedRef } from './types';

export const FLOW_SURFACE_SYSTEM_REF = 'surface';
export const FLOW_SURFACE_RESERVED_REFS = new Set([FLOW_SURFACE_SYSTEM_REF]);
export const FLOW_SURFACE_INTERNAL_META_KEY = '__flowSurfaceMeta';
export const FLOW_SURFACE_DECLARED_REF_KEY = 'declaredRef';
export const FLOW_SURFACE_REF_NOT_PERSISTABLE_CODE = 'FLOW_SURFACE_REF_NOT_PERSISTABLE';

export function getDeclaredRefFromNode(node: any) {
  const declaredRef = _.get(node, ['stepParams', FLOW_SURFACE_INTERNAL_META_KEY, FLOW_SURFACE_DECLARED_REF_KEY]);
  return typeof declaredRef === 'string' && declaredRef.trim() ? declaredRef.trim() : undefined;
}

export function normalizeBindRefs(
  actionName: string,
  bindRefs: any,
  deps: {
    normalizeGetTarget: (value: any) => FlowSurfaceReadLocator;
  },
): FlowSurfaceBindRef[] {
  if (_.isUndefined(bindRefs)) {
    return [];
  }
  if (!Array.isArray(bindRefs)) {
    throwBadRequest(`flowSurfaces ${actionName} bindRefs must be an array`);
  }
  const seenRefs = new Set<string>();
  return bindRefs.map((item, index) => {
    if (!_.isPlainObject(item)) {
      throwBadRequest(`flowSurfaces ${actionName} bindRefs[${index}] must be an object`);
    }
    const ref = String(item.ref || '').trim();
    if (!ref) {
      throwBadRequest(`flowSurfaces ${actionName} bindRefs[${index}].ref is required`);
    }
    if (FLOW_SURFACE_RESERVED_REFS.has(ref)) {
      throwBadRequest(`flowSurfaces ${actionName} bindRefs[${index}].ref '${ref}' is reserved`);
    }
    if (seenRefs.has(ref)) {
      throwBadRequest(`flowSurfaces ${actionName} bindRefs[${index}].ref '${ref}' is duplicated`);
    }
    seenRefs.add(ref);
    if (!_.isPlainObject(item.locator)) {
      throwBadRequest(`flowSurfaces ${actionName} bindRefs[${index}].locator is required`);
    }
    return buildDefinedPayload({
      ref,
      locator: deps.normalizeGetTarget(item.locator),
      expectedKind: typeof item.expectedKind === 'string' ? String(item.expectedKind).trim() : undefined,
      rebind: item.rebind === true,
    }) as FlowSurfaceBindRef;
  });
}

export function collectDeclaredRefsFromTree(
  node: any,
  deps: {
    actionName?: string;
    buildPlanRefKind: (node: any, resolvedKind?: string) => string;
  },
  carry = new Map<string, FlowSurfaceResolvedRef>(),
) {
  if (!node || typeof node !== 'object') {
    return carry;
  }
  if (node.uid) {
    const declaredRef = getDeclaredRefFromNode(node);
    if (declaredRef && !FLOW_SURFACE_RESERVED_REFS.has(declaredRef)) {
      const existing = carry.get(declaredRef);
      if (existing && existing.uid !== node.uid) {
        throwConflict(
          `flowSurfaces ${deps.actionName || 'describeSurface'} declared ref '${declaredRef}' is duplicated on '${
            existing.uid
          }' and '${node.uid}'`,
          'FLOW_SURFACE_DECLARED_REF_CONFLICT',
        );
      }
      carry.set(declaredRef, {
        ref: declaredRef,
        uid: node.uid,
        source: 'declared',
        kind: deps.buildPlanRefKind(node),
        locator: {
          uid: node.uid,
        },
      });
    }
  }
  for (const value of Object.values(node.subModels || {})) {
    _.castArray(value as any).forEach((child) => collectDeclaredRefsFromTree(child, deps, carry));
  }
  return carry;
}

export function annotateTreeRef(tree: any, refByUid: Map<string, string>) {
  const visit = (current: any) => {
    if (!current || typeof current !== 'object') {
      return;
    }
    const currentRef = current.uid ? refByUid.get(current.uid) : undefined;
    if (currentRef && typeof current.ref === 'undefined') {
      current.ref = currentRef;
    }
    for (const value of Object.values(current.subModels || {})) {
      _.castArray(value as any).forEach((child) => visit(child));
    }
  };
  visit(tree);
  return tree;
}

export function buildSurfaceRefsObject(refMap: Map<string, FlowSurfaceResolvedRef>) {
  return Object.fromEntries(
    Array.from(refMap.entries()).map(([ref, info]) => [
      ref,
      {
        uid: info.uid,
        kind: info.kind,
        source: info.source,
        locator: info.locator,
      },
    ]),
  );
}

export function buildSurfaceFingerprintRefsObject(refMap: Map<string, FlowSurfaceResolvedRef>) {
  return Object.fromEntries(
    Array.from(refMap.entries()).map(([ref, info]) => [
      ref,
      {
        uid: info.uid,
        kind: info.kind,
      },
    ]),
  );
}

export function getSurfaceSelectorRequestRef(context: FlowSurfacePlanSurfaceContext) {
  if (!('ref' in context.surfaceSelector)) {
    return undefined;
  }
  return context.requestRefMap.get(context.surfaceSelector.ref);
}

export function collectRequestRefsToPersist(
  context: FlowSurfacePlanSurfaceContext,
  compiledSteps: FlowSurfaceCompiledPlanStep[],
): Map<string, FlowSurfaceResolvedRef> {
  const refs = new Map<string, FlowSurfaceResolvedRef>();
  const surfaceRequestRef = getSurfaceSelectorRequestRef(context);
  if (surfaceRequestRef) {
    refs.set(surfaceRequestRef.ref, surfaceRequestRef);
  }
  for (const compiled of compiledSteps) {
    for (const refInfo of compiled.usedRefs) {
      if (refInfo.source === 'request') {
        refs.set(refInfo.ref, refInfo);
      }
    }
  }
  return refs;
}
