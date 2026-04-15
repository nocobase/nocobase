/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { throwBadRequest } from '../errors';
import {
  FLOW_SURFACE_REACTION_AMBIGUOUS_SCENE,
  FLOW_SURFACE_REACTION_FORM_ONLY,
  FLOW_SURFACE_REACTION_UNSUPPORTED_TARGET_KIND,
} from './errors';
import { getReactionKindsForUse, getReactionSlot } from './registry';
import type {
  FlowSurfaceReactionKind,
  FlowSurfaceReactionResolvedTargetKind,
  FlowSurfaceReactionScene,
  FlowSurfaceResolveReactionCapabilityResult,
  FlowSurfaceResolveReactionTargetValues,
  FlowSurfaceResolvedReactionCapability,
  FlowSurfaceResolvedReactionTarget,
} from './types';

type FlowSurfaceReactionReadbackLike = {
  tree?: any;
  nodeMap?: Record<string, any>;
};

type FlowSurfaceResolveReactionTargetFromReadbackValues = Omit<
  FlowSurfaceResolveReactionTargetValues,
  'node' | 'use'
> & {
  readback: FlowSurfaceReactionReadbackLike;
};

const FORM_REACTION_USES = new Set(['CreateFormModel', 'EditFormModel', 'FormBlockModel']);
const DETAILS_REACTION_USES = new Set(['DetailsBlockModel']);
const SUB_FORM_REACTION_USES = new Set(['SubFormFieldModel', 'SubFormListFieldModel']);
const FORM_GRID_STORAGE_KINDS = new Set<FlowSurfaceReactionKind>(['fieldValue', 'fieldLinkage']);

function normalizeTargetUid(input: FlowSurfaceResolveReactionTargetValues['target']) {
  const uid = String(input?.uid || '').trim();
  if (!uid) {
    throwBadRequest('flowSurfaces reaction requires target.uid');
  }
  return uid;
}

function inferReactionTargetKind(
  use: string | undefined,
  supportedKinds: FlowSurfaceReactionKind[],
): FlowSurfaceReactionResolvedTargetKind {
  if (SUB_FORM_REACTION_USES.has(use || '')) {
    return 'fieldHost';
  }
  if (supportedKinds.includes('actionLinkage') && supportedKinds.length === 1) {
    return 'action';
  }
  return 'block';
}

function inferReactionScene(kind: FlowSurfaceReactionKind, use?: string): FlowSurfaceReactionScene | undefined {
  switch (kind) {
    case 'fieldValue':
      return FORM_REACTION_USES.has(use || '') ? 'form' : undefined;
    case 'blockLinkage':
      return 'block';
    case 'actionLinkage':
      return 'action';
    case 'fieldLinkage':
      if (FORM_REACTION_USES.has(use || '')) {
        return 'form';
      }
      if (DETAILS_REACTION_USES.has(use || '')) {
        return 'details';
      }
      if (SUB_FORM_REACTION_USES.has(use || '')) {
        return 'subForm';
      }
      return undefined;
    default:
      return undefined;
  }
}

function buildUnsupportedTargetMessage(kind: FlowSurfaceReactionKind, use?: string) {
  if (kind === 'fieldValue') {
    return 'flowSurfaces reaction field values are only available on create/edit form blocks';
  }
  return `flowSurfaces reaction target '${use || 'unknown'}' does not support ${kind}`;
}

export function findReactionTargetNodeInReadback(readback: FlowSurfaceReactionReadbackLike, uid: string): any {
  const normalizedUid = String(uid || '').trim();
  if (!normalizedUid) {
    return undefined;
  }

  const visit = (node: any): any => {
    if (!node || typeof node !== 'object') {
      return undefined;
    }
    if (node.uid === normalizedUid) {
      return node;
    }
    for (const child of Object.values(node.subModels || {})) {
      const children = Array.isArray(child) ? child : [child];
      for (const item of children) {
        const matched = visit(item);
        if (matched) {
          return matched;
        }
      }
    }
    return undefined;
  };

  return visit(readback?.tree) || readback?.nodeMap?.[normalizedUid];
}

export function resolveReactionTarget(
  values: FlowSurfaceResolveReactionTargetValues,
): FlowSurfaceResolvedReactionTarget {
  const uid = normalizeTargetUid(values.target);
  const node = values.node || {};
  const use = String(values.use || node?.use || '').trim() || undefined;
  const supportedKinds = getReactionKindsForUse(use);

  if (!supportedKinds.length) {
    throwBadRequest(
      `flowSurfaces reaction target '${use || uid}' does not support advanced reaction capabilities`,
      FLOW_SURFACE_REACTION_UNSUPPORTED_TARGET_KIND,
    );
  }

  const capabilities: FlowSurfaceResolvedReactionCapability[] = supportedKinds.map((kind) => {
    const resolvedScene = inferReactionScene(kind, use);
    if (!resolvedScene) {
      throwBadRequest(
        `flowSurfaces reaction target '${use || uid}' cannot uniquely resolve scene for ${kind}`,
        FLOW_SURFACE_REACTION_AMBIGUOUS_SCENE,
      );
    }
    const resolvedSlot = getReactionSlot(kind, resolvedScene);
    if (!resolvedSlot) {
      throwBadRequest(
        `flowSurfaces reaction target '${use || uid}' cannot resolve storage slot for ${kind}`,
        FLOW_SURFACE_REACTION_AMBIGUOUS_SCENE,
      );
    }
    return {
      kind,
      resolvedScene,
      resolvedSlot,
    };
  });

  return {
    target: {
      uid,
      publicPath:
        String(
          values.publicPath ||
            ('publicPath' in values.target && typeof values.target.publicPath === 'string'
              ? values.target.publicPath
              : ''),
        ).trim() || undefined,
    },
    node,
    use,
    targetKind: inferReactionTargetKind(use, supportedKinds),
    capabilities,
  };
}

export function resolveReactionTargetFromReadback(
  values: FlowSurfaceResolveReactionTargetFromReadbackValues,
): FlowSurfaceResolvedReactionTarget {
  const uid = normalizeTargetUid(values.target);
  const node = findReactionTargetNodeInReadback(values.readback, uid);
  return resolveReactionTarget({
    node,
    use: node?.use,
    target: values.target,
    publicPath: values.publicPath,
  });
}

export function resolveReactionCapability(
  resolvedTarget: FlowSurfaceResolvedReactionTarget,
  kind: FlowSurfaceReactionKind,
): FlowSurfaceResolveReactionCapabilityResult {
  const matched = resolvedTarget.capabilities.find((item) => item.kind === kind);
  if (!matched) {
    throwBadRequest(
      buildUnsupportedTargetMessage(kind, resolvedTarget.use),
      kind === 'fieldValue' ? FLOW_SURFACE_REACTION_FORM_ONLY : FLOW_SURFACE_REACTION_UNSUPPORTED_TARGET_KIND,
    );
  }
  return {
    ...resolvedTarget,
    ...matched,
  };
}

export function resolveReactionStorageNode(
  resolvedTarget: FlowSurfaceResolvedReactionTarget,
  capability: FlowSurfaceResolvedReactionCapability,
): any {
  if (
    FORM_REACTION_USES.has(resolvedTarget.use || '') &&
    capability.resolvedScene === 'form' &&
    FORM_GRID_STORAGE_KINDS.has(capability.kind)
  ) {
    const gridNode = resolvedTarget.node?.subModels?.grid;
    if (gridNode && typeof gridNode === 'object' && String(gridNode.uid || '').trim()) {
      return gridNode;
    }
    throwBadRequest(
      `flowSurfaces reaction target '${
        resolvedTarget.use || resolvedTarget.target.uid
      }' is missing form grid storage node for ${capability.kind}`,
    );
  }
  return resolvedTarget.node;
}
