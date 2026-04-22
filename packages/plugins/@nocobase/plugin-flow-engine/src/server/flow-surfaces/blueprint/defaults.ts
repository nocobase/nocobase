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
  FlowSurfaceApplyBlueprintDefaultCollection,
  FlowSurfaceApplyBlueprintDefaults,
  FlowSurfaceApplyBlueprintDefaultPopupActionMap,
  FlowSurfaceApplyBlueprintDefaultPopupName,
} from './public-types';

export const FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY = '__flowSurfaceApplyBlueprintPopupDefaults';

export type FlowSurfaceApplyBlueprintPopupDefaultActionType = 'addNew' | 'view' | 'edit';

export type FlowSurfaceApplyBlueprintPopupDefaultsMetadata = {
  collections?: FlowSurfaceApplyBlueprintDefaults['collections'];
};

export function hasFlowSurfaceApplyBlueprintDefaults(defaults?: FlowSurfaceApplyBlueprintDefaults) {
  return _.isPlainObject(defaults?.collections) && Object.keys(defaults?.collections || {}).length > 0;
}

export function buildFlowSurfaceApplyBlueprintPopupDefaultsMetadata(
  defaults?: FlowSurfaceApplyBlueprintDefaults,
): FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined {
  if (!hasFlowSurfaceApplyBlueprintDefaults(defaults)) {
    return undefined;
  }
  return {
    collections: defaults?.collections,
  };
}

export function attachFlowSurfaceApplyBlueprintPopupDefaults<T extends Record<string, any> | undefined>(
  popup: T,
  metadata: FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined,
): T | Record<string, any> | undefined {
  if (!metadata) {
    return popup;
  }
  return {
    ...(_.isPlainObject(popup) ? _.cloneDeep(popup) : {}),
    [FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]: _.cloneDeep(metadata),
  };
}

export function readFlowSurfaceApplyBlueprintPopupDefaultsMetadata(
  value: Record<string, any> | undefined,
): FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined {
  const metadata = value?.[FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY];
  if (!_.isPlainObject(metadata) || !_.isPlainObject(metadata.collections)) {
    return undefined;
  }
  return metadata as FlowSurfaceApplyBlueprintPopupDefaultsMetadata;
}

export function getFlowSurfaceApplyBlueprintDefaultCollection(
  metadata: FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined,
  collectionName?: string,
): FlowSurfaceApplyBlueprintDefaultCollection | undefined {
  const normalizedCollectionName = String(collectionName || '').trim();
  if (!normalizedCollectionName) {
    return undefined;
  }
  const collectionDefaults = metadata?.collections?.[normalizedCollectionName];
  return _.isPlainObject(collectionDefaults) ? collectionDefaults : undefined;
}

function readPopupMetadata(
  popupMap: FlowSurfaceApplyBlueprintDefaultPopupActionMap | undefined,
  actionType: FlowSurfaceApplyBlueprintPopupDefaultActionType | undefined,
): FlowSurfaceApplyBlueprintDefaultPopupName | undefined {
  if (!popupMap || !actionType) {
    return undefined;
  }
  const normalizedName = String(popupMap[actionType]?.name || '').trim();
  const normalizedDescription = String(popupMap[actionType]?.description || '').trim();
  if (!normalizedName || !normalizedDescription) {
    return undefined;
  }
  return {
    name: normalizedName,
    description: normalizedDescription,
  };
}

export function resolveFlowSurfaceApplyBlueprintDefaultPopupMetadata(input: {
  metadata?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata;
  actionType?: FlowSurfaceApplyBlueprintPopupDefaultActionType;
  sourceCollectionName?: string;
  associationField?: string;
  targetCollectionName?: string;
}): FlowSurfaceApplyBlueprintDefaultPopupName | undefined {
  const actionType = input.actionType;
  const sourceCollectionDefaults = getFlowSurfaceApplyBlueprintDefaultCollection(
    input.metadata,
    input.sourceCollectionName,
  );
  const associationField = String(input.associationField || '').trim();
  if (sourceCollectionDefaults?.popups?.associations && associationField) {
    const associationPopupMetadata = readPopupMetadata(
      sourceCollectionDefaults.popups.associations[associationField],
      actionType,
    );
    if (associationPopupMetadata) {
      return associationPopupMetadata;
    }
  }

  const targetCollectionDefaults = getFlowSurfaceApplyBlueprintDefaultCollection(
    input.metadata,
    input.targetCollectionName,
  );
  return readPopupMetadata(targetCollectionDefaults?.popups, actionType);
}
