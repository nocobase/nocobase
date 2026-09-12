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
  FlowSurfaceApplyBlueprintDefaultFormBehaviorScene,
  FlowSurfaceApplyBlueprintDefaults,
  FlowSurfaceApplyBlueprintDefaultPopupActionMap,
  FlowSurfaceApplyBlueprintDefaultPopupName,
} from './public-types';

export const FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY = '__flowSurfaceApplyBlueprintPopupDefaults';

export type FlowSurfaceApplyBlueprintPopupDefaultActionType = 'addNew' | 'view' | 'edit';

export type FlowSurfaceApplyBlueprintPopupDefaultsMetadata = {
  collections?: FlowSurfaceApplyBlueprintDefaults['collections'];
  dataSources?: FlowSurfaceApplyBlueprintDefaults['dataSources'];
};

export function hasFlowSurfaceApplyBlueprintDefaults(defaults?: FlowSurfaceApplyBlueprintDefaults) {
  return (
    (_.isPlainObject(defaults?.collections) && Object.keys(defaults?.collections || {}).length > 0) ||
    (_.isPlainObject(defaults?.dataSources) && Object.keys(defaults?.dataSources || {}).length > 0)
  );
}

export function buildFlowSurfaceApplyBlueprintPopupDefaultsMetadata(
  defaults?: FlowSurfaceApplyBlueprintDefaults,
): FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined {
  if (!hasFlowSurfaceApplyBlueprintDefaults(defaults)) {
    return undefined;
  }
  return {
    collections: defaults?.collections,
    dataSources: defaults?.dataSources,
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
  if (!_.isPlainObject(metadata)) {
    return undefined;
  }
  const hasCollections = _.isPlainObject(metadata.collections);
  const hasDataSources = _.isPlainObject(metadata.dataSources);
  if (!hasCollections && !hasDataSources) {
    return undefined;
  }
  return {
    ...(hasCollections ? { collections: metadata.collections } : {}),
    ...(hasDataSources ? { dataSources: metadata.dataSources } : {}),
  } as FlowSurfaceApplyBlueprintPopupDefaultsMetadata;
}

export function normalizeFlowSurfaceApplyBlueprintDataSourceKey(dataSourceKey?: string) {
  return String(dataSourceKey || '').trim() || 'main';
}

function getFlowSurfaceApplyBlueprintDefaultCollectionPath(dataSourceKey: string, collectionName: string) {
  return dataSourceKey === 'main'
    ? `$.defaults.collections.${collectionName}.fieldGroups`
    : `$.defaults.dataSources.${dataSourceKey}.collections.${collectionName}.fieldGroups`;
}

function getFlowSurfaceApplyBlueprintDataSourceDefaultCollectionPath(dataSourceKey: string, collectionName: string) {
  return `$.defaults.dataSources.${dataSourceKey}.collections.${collectionName}.fieldGroups`;
}

export function resolveFlowSurfaceApplyBlueprintDefaultCollection(input: {
  metadata?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata;
  dataSourceKey?: string;
  collectionName?: string;
}): {
  collectionDefaults?: FlowSurfaceApplyBlueprintDefaultCollection;
  dataSourceKey: string;
  collectionName?: string;
  path?: string;
} {
  const normalizedCollectionName = String(input.collectionName || '').trim();
  const normalizedDataSourceKey = normalizeFlowSurfaceApplyBlueprintDataSourceKey(input.dataSourceKey);
  if (!normalizedCollectionName) {
    return {
      dataSourceKey: normalizedDataSourceKey,
    };
  }
  const dataSourceDefaults = _.isPlainObject(input.metadata?.dataSources?.[normalizedDataSourceKey])
    ? input.metadata?.dataSources?.[normalizedDataSourceKey]
    : undefined;
  const dataSourceCollections = _.isPlainObject(dataSourceDefaults?.collections)
    ? dataSourceDefaults?.collections
    : undefined;
  const hasDataSourceCollectionDefaults = Object.prototype.hasOwnProperty.call(
    dataSourceCollections || {},
    normalizedCollectionName,
  );
  if (hasDataSourceCollectionDefaults) {
    const dataSourceCollectionDefaults = _.isPlainObject(dataSourceCollections?.[normalizedCollectionName])
      ? dataSourceCollections?.[normalizedCollectionName]
      : undefined;
    return {
      collectionDefaults: dataSourceCollectionDefaults,
      dataSourceKey: normalizedDataSourceKey,
      collectionName: normalizedCollectionName,
      path: getFlowSurfaceApplyBlueprintDataSourceDefaultCollectionPath(
        normalizedDataSourceKey,
        normalizedCollectionName,
      ),
    };
  }
  if (normalizedDataSourceKey === 'main') {
    const collectionDefaults = _.isPlainObject(input.metadata?.collections?.[normalizedCollectionName])
      ? input.metadata?.collections?.[normalizedCollectionName]
      : undefined;
    if (collectionDefaults) {
      return {
        collectionDefaults,
        dataSourceKey: normalizedDataSourceKey,
        collectionName: normalizedCollectionName,
        path: getFlowSurfaceApplyBlueprintDefaultCollectionPath(normalizedDataSourceKey, normalizedCollectionName),
      };
    }
  }
  return {
    dataSourceKey: normalizedDataSourceKey,
    collectionName: normalizedCollectionName,
    path: getFlowSurfaceApplyBlueprintDefaultCollectionPath(normalizedDataSourceKey, normalizedCollectionName),
  };
}

export function getFlowSurfaceApplyBlueprintDefaultCollection(
  metadata: FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined,
  collectionName?: string,
  dataSourceKey?: string,
): FlowSurfaceApplyBlueprintDefaultCollection | undefined {
  return resolveFlowSurfaceApplyBlueprintDefaultCollection({
    metadata,
    dataSourceKey,
    collectionName,
  }).collectionDefaults;
}

export function getFlowSurfaceApplyBlueprintDefaultFormBehavior(
  metadata: FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined,
  collectionName?: string,
  actionType?: FlowSurfaceApplyBlueprintPopupDefaultActionType,
  dataSourceKey?: string,
): FlowSurfaceApplyBlueprintDefaultFormBehaviorScene | undefined {
  if (actionType !== 'addNew' && actionType !== 'edit') {
    return undefined;
  }
  const scene = getFlowSurfaceApplyBlueprintDefaultCollection(metadata, collectionName, dataSourceKey)?.formBehavior?.[
    actionType
  ];
  return _.isPlainObject(scene) ? (_.cloneDeep(scene) as FlowSurfaceApplyBlueprintDefaultFormBehaviorScene) : undefined;
}

export function getFlowSurfaceDefaultFieldGroupRelationTitleFieldOverride(
  fieldGroups: any[] | undefined,
  fieldPath: string,
) {
  const normalizedFieldPath = String(fieldPath || '').trim();
  if (!normalizedFieldPath) {
    return undefined;
  }
  let result: string | undefined;
  _.castArray(fieldGroups || []).forEach((group) => {
    _.castArray(group?.fields || []).forEach((field) => {
      if (result || !_.isPlainObject(field)) {
        return;
      }
      const currentFieldPath = String(field.field || field.fieldPath || '').trim();
      const titleField = String(field.titleField || '').trim();
      if (currentFieldPath === normalizedFieldPath && titleField) {
        result = titleField;
      }
    });
  });
  return result;
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
  dataSourceKey?: string;
  sourceCollectionName?: string;
  associationField?: string;
  targetCollectionName?: string;
}): FlowSurfaceApplyBlueprintDefaultPopupName | undefined {
  const actionType = input.actionType;
  const sourceCollectionDefaults = getFlowSurfaceApplyBlueprintDefaultCollection(
    input.metadata,
    input.sourceCollectionName,
    input.dataSourceKey,
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
    input.dataSourceKey,
  );
  return readPopupMetadata(targetCollectionDefaults?.popups, actionType);
}
