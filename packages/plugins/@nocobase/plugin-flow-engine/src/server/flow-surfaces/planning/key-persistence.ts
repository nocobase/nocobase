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
import {
  FLOW_SURFACE_DECLARED_KEY_KEY,
  FLOW_SURFACE_INTERNAL_META_KEY,
  FLOW_SURFACE_KEY_NOT_PERSISTABLE_CODE,
  FLOW_SURFACE_RESERVED_KEYS,
} from './key-registry';
import type { FlowSurfaceResolvedKey } from './types';

type FlowSurfaceDeclaredKeyPersistenceDeps = {
  findModelById: (uid: string, options?: { transaction?: any; includeAsyncNode?: boolean }) => Promise<any>;
  patchModel: (values: Record<string, any>, options?: { transaction?: any }) => Promise<any>;
  getDeclaredKeyFromNode: (node: any) => string | undefined;
};

function getPersistableDeclaredKey(deps: FlowSurfaceDeclaredKeyPersistenceDeps, node: any) {
  const declaredKey = deps.getDeclaredKeyFromNode(node);
  if (!declaredKey || FLOW_SURFACE_RESERVED_KEYS.has(declaredKey)) {
    return undefined;
  }
  return declaredKey;
}

export function assertKeyPersistable(actionName: string, keyInfo: FlowSurfaceResolvedKey, node: any) {
  if (FLOW_SURFACE_RESERVED_KEYS.has(keyInfo.key)) {
    throwBadRequest(
      `flowSurfaces ${actionName} key '${keyInfo.key}' is reserved and cannot be persisted`,
      FLOW_SURFACE_KEY_NOT_PERSISTABLE_CODE,
    );
  }
}

export async function assertRequestKeysPersistable(
  actionName: string,
  keys: Map<string, FlowSurfaceResolvedKey>,
  deps: FlowSurfaceDeclaredKeyPersistenceDeps,
  transaction?: any,
) {
  for (const keyInfo of keys.values()) {
    const node = await deps.findModelById(keyInfo.uid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!node?.uid) {
      continue;
    }
    assertKeyPersistable(actionName, keyInfo, node);
  }
}

export async function clearDeclaredKeyForNode(
  uid: string,
  deps: FlowSurfaceDeclaredKeyPersistenceDeps,
  transaction?: any,
) {
  const node = await deps.findModelById(uid, {
    transaction,
    includeAsyncNode: true,
  });
  if (!node?.uid || !_.isPlainObject(node.stepParams)) {
    return;
  }
  const nextStepParams = _.cloneDeep(node.stepParams || {});
  _.unset(nextStepParams, [FLOW_SURFACE_INTERNAL_META_KEY, FLOW_SURFACE_DECLARED_KEY_KEY]);
  if (_.isEmpty(_.get(nextStepParams, [FLOW_SURFACE_INTERNAL_META_KEY]))) {
    _.unset(nextStepParams, [FLOW_SURFACE_INTERNAL_META_KEY]);
  }
  await deps.patchModel(
    {
      uid: node.uid,
      ...(Object.keys(nextStepParams).length ? { stepParams: nextStepParams } : { stepParams: {} }),
    },
    { transaction },
  );
}

export async function persistDeclaredKeyForNode(
  keyInfo: FlowSurfaceResolvedKey,
  deps: FlowSurfaceDeclaredKeyPersistenceDeps,
  transaction?: any,
) {
  const node = await deps.findModelById(keyInfo.uid, {
    transaction,
    includeAsyncNode: true,
  });
  if (!node?.uid) {
    return {
      key: keyInfo.key,
      uid: keyInfo.uid,
      persisted: false,
      skipped: 'not_found',
    };
  }
  assertKeyPersistable('key persistence', keyInfo, node);
  if (keyInfo.reboundFromUid && keyInfo.reboundFromUid !== keyInfo.uid) {
    await clearDeclaredKeyForNode(keyInfo.reboundFromUid, deps, transaction);
  }
  const currentDeclaredKey = getPersistableDeclaredKey(deps, node);
  if (currentDeclaredKey && currentDeclaredKey !== keyInfo.key && !keyInfo.rebind) {
    throwConflict(
      `flowSurfaces node '${node.uid}' already has declared key '${currentDeclaredKey}'`,
      'FLOW_SURFACE_DECLARED_KEY_CONFLICT',
    );
  }
  if (currentDeclaredKey === keyInfo.key) {
    return {
      key: keyInfo.key,
      uid: keyInfo.uid,
      persisted: true,
    };
  }
  const nextStepParams = _.cloneDeep(node.stepParams || {});
  _.set(nextStepParams, [FLOW_SURFACE_INTERNAL_META_KEY, FLOW_SURFACE_DECLARED_KEY_KEY], keyInfo.key);
  await deps.patchModel(
    {
      uid: node.uid,
      stepParams: nextStepParams,
    },
    { transaction },
  );
  return {
    key: keyInfo.key,
    uid: keyInfo.uid,
    persisted: true,
  };
}
