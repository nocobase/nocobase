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
  FLOW_SURFACE_DECLARED_REF_KEY,
  FLOW_SURFACE_INTERNAL_META_KEY,
  FLOW_SURFACE_REF_NOT_PERSISTABLE_CODE,
  FLOW_SURFACE_RESERVED_REFS,
  FLOW_SURFACE_SYSTEM_REF,
} from './ref-registry';
import type { FlowSurfaceResolvedRef } from './types';

type FlowSurfaceDeclaredRefPersistenceDeps = {
  findModelById: (uid: string, options?: { transaction?: any; includeAsyncNode?: boolean }) => Promise<any>;
  patchModel: (values: Record<string, any>, options?: { transaction?: any }) => Promise<any>;
  getDeclaredRefFromNode: (node: any) => string | undefined;
};

function getPersistableDeclaredRef(deps: FlowSurfaceDeclaredRefPersistenceDeps, node: any) {
  const declaredRef = deps.getDeclaredRefFromNode(node);
  if (!declaredRef || FLOW_SURFACE_RESERVED_REFS.has(declaredRef)) {
    return undefined;
  }
  return declaredRef;
}

export function assertRefPersistable(actionName: string, refInfo: FlowSurfaceResolvedRef, node: any) {
  if (FLOW_SURFACE_RESERVED_REFS.has(refInfo.ref)) {
    throwBadRequest(
      `flowSurfaces ${actionName} ref '${refInfo.ref}' is reserved and cannot be persisted`,
      FLOW_SURFACE_REF_NOT_PERSISTABLE_CODE,
    );
  }
  if (node?.use === 'RootPageModel' || node?.use === 'RootPageTabModel') {
    throwBadRequest(
      `flowSurfaces ${actionName} ref '${refInfo.ref}' cannot be persisted on route-backed surface '${refInfo.uid}'; use locator or system ref '${FLOW_SURFACE_SYSTEM_REF}' instead`,
      FLOW_SURFACE_REF_NOT_PERSISTABLE_CODE,
    );
  }
}

export async function assertRequestRefsPersistable(
  actionName: string,
  refs: Map<string, FlowSurfaceResolvedRef>,
  deps: FlowSurfaceDeclaredRefPersistenceDeps,
  transaction?: any,
) {
  for (const refInfo of refs.values()) {
    const node = await deps.findModelById(refInfo.uid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!node?.uid) {
      continue;
    }
    assertRefPersistable(actionName, refInfo, node);
  }
}

export async function clearDeclaredRefForNode(
  uid: string,
  deps: FlowSurfaceDeclaredRefPersistenceDeps,
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
  _.unset(nextStepParams, [FLOW_SURFACE_INTERNAL_META_KEY, FLOW_SURFACE_DECLARED_REF_KEY]);
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

export async function persistDeclaredRefForNode(
  refInfo: FlowSurfaceResolvedRef,
  deps: FlowSurfaceDeclaredRefPersistenceDeps,
  transaction?: any,
) {
  const node = await deps.findModelById(refInfo.uid, {
    transaction,
    includeAsyncNode: true,
  });
  if (!node?.uid) {
    return {
      ref: refInfo.ref,
      uid: refInfo.uid,
      persisted: false,
      skipped: 'not_found',
    };
  }
  assertRefPersistable('executePlan', refInfo, node);
  if (refInfo.reboundFromUid && refInfo.reboundFromUid !== refInfo.uid) {
    await clearDeclaredRefForNode(refInfo.reboundFromUid, deps, transaction);
  }
  const currentDeclaredRef = getPersistableDeclaredRef(deps, node);
  if (currentDeclaredRef && currentDeclaredRef !== refInfo.ref && !refInfo.rebind) {
    throwConflict(
      `flowSurfaces executePlan node '${node.uid}' already has declared ref '${currentDeclaredRef}'`,
      'FLOW_SURFACE_DECLARED_REF_CONFLICT',
    );
  }
  if (currentDeclaredRef === refInfo.ref) {
    return {
      ref: refInfo.ref,
      uid: refInfo.uid,
      persisted: true,
    };
  }
  const nextStepParams = _.cloneDeep(node.stepParams || {});
  _.set(nextStepParams, [FLOW_SURFACE_INTERNAL_META_KEY, FLOW_SURFACE_DECLARED_REF_KEY], refInfo.ref);
  await deps.patchModel(
    {
      uid: node.uid,
      stepParams: nextStepParams,
    },
    { transaction },
  );
  return {
    ref: refInfo.ref,
    uid: refInfo.uid,
    persisted: true,
  };
}
