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
import { flattenModel } from '../service-utils';
import type {
  FlowSurfaceBindRef,
  FlowSurfacePlanSelector,
  FlowSurfaceReadLocator,
  FlowSurfaceReadTarget,
  FlowSurfaceResolvedTarget,
} from '../types';
import { FLOW_SURFACE_SYSTEM_REF } from './ref-registry';
import type { FlowSurfacePlanSurfaceContext, FlowSurfaceResolvedRef } from './types';

type BuildPlanSurfaceContextDeps = {
  resolveLocator: (
    target: FlowSurfaceReadLocator,
    options?: { transaction?: any },
  ) => Promise<FlowSurfaceResolvedTarget>;
  loadResolvedSurfaceTree: (resolved: FlowSurfaceResolvedTarget, transaction?: any) => Promise<any>;
  stripInternalSurfaceMetaFromNodeTree: <T = any>(node: T) => T;
  buildReadTargetSummary: (
    target: FlowSurfaceReadLocator,
    resolved: FlowSurfaceResolvedTarget,
  ) => FlowSurfaceReadTarget;
  buildSurfaceContextFingerprint: (
    context: Pick<FlowSurfacePlanSurfaceContext, 'surfaceResolved' | 'publicTree' | 'refMap'>,
  ) => string;
  buildPlanRefKind: (node: any, resolvedKind?: string) => string;
  assertBindRefKind: (actionName: string, bindRef: FlowSurfaceBindRef, node: any, resolvedKind?: string) => void;
  collectDeclaredRefsFromTree: (node: any) => Map<string, FlowSurfaceResolvedRef>;
};

export async function buildPlanSurfaceContext(
  input: {
    actionName: string;
    surfaceSelector: FlowSurfacePlanSelector;
    bindRefs: FlowSurfaceBindRef[];
  },
  deps: BuildPlanSurfaceContextDeps,
  options: { transaction?: any } = {},
): Promise<FlowSurfacePlanSurfaceContext> {
  const { actionName, surfaceSelector, bindRefs } = input;
  let surfaceTarget: FlowSurfaceReadLocator;
  if ('ref' in surfaceSelector) {
    const matchedBindRef = bindRefs.find((item) => item.ref === surfaceSelector.ref);
    if (!matchedBindRef) {
      throwBadRequest(`flowSurfaces ${actionName} surface.ref '${surfaceSelector.ref}' must also appear in bindRefs`);
    }
    surfaceTarget = matchedBindRef.locator;
  } else {
    surfaceTarget = surfaceSelector.locator;
  }

  const surfaceResolved = await deps.resolveLocator(surfaceTarget, options);
  const rawTree = await deps.loadResolvedSurfaceTree(surfaceResolved, options.transaction);
  const publicTree = deps.stripInternalSurfaceMetaFromNodeTree(_.cloneDeep(rawTree));
  const publicNodeMap = flattenModel(publicTree);
  const uidSet = new Set<string>([surfaceResolved.uid, ...Object.keys(publicNodeMap)]);
  const refMap = deps.collectDeclaredRefsFromTree(rawTree);
  const requestRefMap = new Map<string, FlowSurfaceResolvedRef>();

  for (const bindRef of bindRefs) {
    const resolved = await deps.resolveLocator(bindRef.locator, options);
    if (!uidSet.has(resolved.uid)) {
      throwBadRequest(
        `flowSurfaces ${actionName} bindRefs ref '${bindRef.ref}' must resolve inside the current surface '${surfaceResolved.uid}'`,
      );
    }
    const node = publicNodeMap[resolved.uid] || (resolved.uid === surfaceResolved.uid ? publicTree : undefined);
    deps.assertBindRefKind(actionName, bindRef, node, resolved.kind);
    const existing = requestRefMap.get(bindRef.ref) || refMap.get(bindRef.ref);
    if (existing && existing.uid !== resolved.uid && !bindRef.rebind) {
      throwConflict(
        `flowSurfaces ${actionName} ref '${bindRef.ref}' is already bound to '${existing.uid}', set rebind=true to move it`,
        'FLOW_SURFACE_DECLARED_REF_CONFLICT',
      );
    }
    requestRefMap.set(bindRef.ref, {
      ref: bindRef.ref,
      uid: resolved.uid,
      source: 'request',
      kind: deps.buildPlanRefKind(node, resolved.kind),
      locator: {
        uid: resolved.uid,
      },
      rebind: bindRef.rebind === true,
      reboundFromUid: existing && existing.uid !== resolved.uid ? existing.uid : undefined,
    });
  }

  requestRefMap.forEach((value, key) => refMap.set(key, value));
  refMap.set(FLOW_SURFACE_SYSTEM_REF, {
    ref: FLOW_SURFACE_SYSTEM_REF,
    uid: surfaceResolved.uid,
    source: 'system',
    kind: deps.buildPlanRefKind(publicTree, surfaceResolved.kind),
    locator: {
      uid: surfaceResolved.uid,
    },
  });

  const targetSummary = deps.buildReadTargetSummary(surfaceTarget, surfaceResolved);
  const fingerprint = deps.buildSurfaceContextFingerprint({
    surfaceResolved,
    publicTree,
    refMap,
  });

  return {
    surfaceSelector,
    surfaceTarget,
    surfaceResolved,
    rawTree,
    publicTree,
    publicNodeMap,
    targetSummary,
    fingerprint,
    uidSet,
    refMap,
    requestRefMap,
  };
}
