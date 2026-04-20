/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { throwBadRequest } from './errors';
import {
  getCollectionFields,
  getCollectionName,
  getFieldName,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
} from './service-helpers';

export type FlowSurfaceResolvedAssociationTitleField = {
  field: any;
  fieldName: string;
  source: 'explicit' | 'firstTitleable';
  targetCollection?: any;
};

const FALLBACK_TITLE_USABLE_INTERFACES = new Set([
  'attachmentURL',
  'createdAt',
  'date',
  'datetime',
  'datetimeNoTz',
  'email',
  'formula',
  'id',
  'input',
  'integer',
  'nanoid',
  'number',
  'percent',
  'phone',
  'radioGroup',
  'select',
  'sequence',
  'snowflakeId',
  'sort',
  'space',
  'textarea',
  'time',
  'unixTimestamp',
  'updatedAt',
  'url',
  'uuid',
  'vditor',
]);

export function isTitleableCollectionField(field: any) {
  const configured = field?.titleable ?? field?.titleUsable ?? field?.options?.titleable ?? field?.options?.titleUsable;
  if (typeof configured === 'boolean') {
    return configured;
  }
  const interfaceOptions = typeof field?.getInterfaceOptions === 'function' ? field.getInterfaceOptions() : undefined;
  if (typeof interfaceOptions?.titleUsable === 'boolean') {
    return interfaceOptions.titleUsable;
  }
  const interfaceName =
    typeof field?.interface === 'string'
      ? field.interface
      : typeof field?.options?.interface === 'string'
        ? field.options.interface
        : undefined;
  const interfaceCtor =
    field?.collection?.collectionManager?.getFieldInterface?.(interfaceName) ||
    field?.collection?.db?.interfaceManager?.getInterfaceType?.(interfaceName);
  if (interfaceCtor) {
    const interfaceInstance = typeof interfaceCtor === 'function' ? new interfaceCtor(undefined) : interfaceCtor;
    if (typeof interfaceInstance?.titleUsable === 'boolean') {
      return interfaceInstance.titleUsable;
    }
  }
  return !!(interfaceName && FALLBACK_TITLE_USABLE_INTERFACES.has(interfaceName));
}

export function getExplicitCollectionTitleFieldName(collection: any) {
  const explicit = collection?.options?.titleField;
  return typeof explicit === 'string' ? explicit.trim() || undefined : undefined;
}

export function assertCollectionTitleFieldExists(collection: any, fieldName: string) {
  const normalizedFieldName = typeof fieldName === 'string' ? fieldName.trim() : String(fieldName || '').trim();
  if (!normalizedFieldName) {
    throwBadRequest('flowSurfaces association titleField must be a non-empty string');
  }
  const field = resolveFieldFromCollection(collection, normalizedFieldName);
  if (!field) {
    throwBadRequest(
      `flowSurfaces collection '${
        getCollectionName(collection) || 'unknown'
      }' titleField '${normalizedFieldName}' not found`,
    );
  }
  return field;
}

export function resolveCollectionSafeTitleField(collection: any): FlowSurfaceResolvedAssociationTitleField | null {
  if (!collection) {
    return null;
  }

  const explicitTitleField = getExplicitCollectionTitleFieldName(collection);
  if (explicitTitleField) {
    const field = assertCollectionTitleFieldExists(collection, explicitTitleField);
    return {
      field,
      fieldName: getFieldName(field) || explicitTitleField,
      source: 'explicit',
      targetCollection: collection,
    };
  }

  const firstTitleableField = getCollectionFields(collection).find(
    (field) => !!getFieldName(field) && isTitleableCollectionField(field),
  );
  if (!firstTitleableField) {
    return null;
  }

  return {
    field: firstTitleableField,
    fieldName: getFieldName(firstTitleableField),
    source: 'firstTitleable',
    targetCollection: collection,
  };
}

export function resolveAssociationTitleFieldTargetCollection(
  field: any,
  dataSourceKey: string,
  getCollection: (dataSourceKey: string, collectionName: string) => any,
) {
  return resolveFieldTargetCollection(field, dataSourceKey, getCollection) || null;
}

export function resolveAssociationSafeTitleField(
  field: any,
  dataSourceKey: string,
  getCollection: (dataSourceKey: string, collectionName: string) => any,
): FlowSurfaceResolvedAssociationTitleField | null {
  const targetCollection = resolveAssociationTitleFieldTargetCollection(field, dataSourceKey, getCollection);
  if (!targetCollection) {
    return null;
  }
  const resolved = resolveCollectionSafeTitleField(targetCollection);
  if (!resolved) {
    return null;
  }
  return {
    ...resolved,
    targetCollection,
  };
}
