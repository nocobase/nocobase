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
  FlowSurfaceBindKey,
  FlowSurfaceReadLocator,
  FlowSurfaceReadTarget,
  FlowSurfaceResolvedTarget,
  FlowSurfaceSurfaceSelector,
} from '../types';
import { FLOW_SURFACE_SYSTEM_KEY } from './key-registry';
import type { FlowSurfacePlanSurfaceContext, FlowSurfaceResolvedKey } from './types';

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
    context: Pick<FlowSurfacePlanSurfaceContext, 'surfaceResolved' | 'publicTree' | 'keyMap'>,
  ) => string;
  buildPlanKeyKind: (node: any, resolvedKind?: string) => string;
  assertBindKeyKind: (actionName: string, bindKey: FlowSurfaceBindKey, node: any, resolvedKind?: string) => void;
  collectDeclaredKeysFromTree: (node: any) => Map<string, FlowSurfaceResolvedKey>;
};

export async function buildPlanSurfaceContext(
  input: {
    actionName: string;
    surfaceSelector?: FlowSurfaceSurfaceSelector;
    bindKeys: FlowSurfaceBindKey[];
  },
  deps: BuildPlanSurfaceContextDeps,
  options: { transaction?: any } = {},
): Promise<FlowSurfacePlanSurfaceContext> {
  const { actionName, surfaceSelector, bindKeys } = input;
  if (!surfaceSelector) {
    if (bindKeys.length) {
      throwBadRequest(`flowSurfaces ${actionName} bindKeys require surface`);
    }
    return {
      publicNodeMap: {},
      targetSummary: null,
      fingerprint: null,
      uidSet: new Set<string>(),
      keyMap: new Map<string, FlowSurfaceResolvedKey>(),
      requestKeyMap: new Map<string, FlowSurfaceResolvedKey>(),
    };
  }
  let surfaceTarget: FlowSurfaceReadLocator;
  if ('key' in surfaceSelector) {
    const matchedBindKey = bindKeys.find((item) => item.key === surfaceSelector.key);
    if (!matchedBindKey) {
      throwBadRequest(`flowSurfaces ${actionName} surface.key '${surfaceSelector.key}' must also appear in bindKeys`);
    }
    surfaceTarget = matchedBindKey.locator;
  } else {
    surfaceTarget = surfaceSelector.locator;
  }

  const surfaceResolved = await deps.resolveLocator(surfaceTarget, options);
  const rawTree = await deps.loadResolvedSurfaceTree(surfaceResolved, options.transaction);
  const publicTree = deps.stripInternalSurfaceMetaFromNodeTree(_.cloneDeep(rawTree));
  const publicNodeMap = flattenModel(publicTree);
  const uidSet = new Set<string>([surfaceResolved.uid, ...Object.keys(publicNodeMap)]);
  const keyMap = deps.collectDeclaredKeysFromTree(rawTree);
  const requestKeyMap = new Map<string, FlowSurfaceResolvedKey>();

  for (const bindKey of bindKeys) {
    const resolved = await deps.resolveLocator(bindKey.locator, options);
    if (!uidSet.has(resolved.uid)) {
      throwBadRequest(
        `flowSurfaces ${actionName} bindKeys key '${bindKey.key}' must resolve inside the current surface '${surfaceResolved.uid}'`,
      );
    }
    const node = publicNodeMap[resolved.uid] || (resolved.uid === surfaceResolved.uid ? publicTree : undefined);
    deps.assertBindKeyKind(actionName, bindKey, node, resolved.kind);
    const existing = requestKeyMap.get(bindKey.key) || keyMap.get(bindKey.key);
    if (existing && existing.uid !== resolved.uid && !bindKey.rebind) {
      throwConflict(
        `flowSurfaces ${actionName} key '${bindKey.key}' is already bound to '${existing.uid}', set rebind=true to move it`,
        'FLOW_SURFACE_DECLARED_KEY_CONFLICT',
      );
    }
    requestKeyMap.set(bindKey.key, {
      key: bindKey.key,
      uid: resolved.uid,
      source: 'request',
      kind: deps.buildPlanKeyKind(node, resolved.kind),
      locator: {
        uid: resolved.uid,
      },
      rebind: bindKey.rebind === true,
      reboundFromUid: existing && existing.uid !== resolved.uid ? existing.uid : undefined,
    });
  }

  requestKeyMap.forEach((value, key) => keyMap.set(key, value));
  keyMap.set(FLOW_SURFACE_SYSTEM_KEY, {
    key: FLOW_SURFACE_SYSTEM_KEY,
    uid: surfaceResolved.uid,
    source: 'system',
    kind: deps.buildPlanKeyKind(publicTree, surfaceResolved.kind),
    locator: {
      uid: surfaceResolved.uid,
    },
  });

  const targetSummary = deps.buildReadTargetSummary(surfaceTarget, surfaceResolved);
  const fingerprint = deps.buildSurfaceContextFingerprint({
    surfaceResolved,
    publicTree,
    keyMap,
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
    keyMap,
    requestKeyMap,
  };
}
