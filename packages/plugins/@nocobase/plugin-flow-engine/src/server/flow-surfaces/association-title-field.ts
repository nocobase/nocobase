/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowSurfaceErrorOptions, throwBadRequest } from './errors';
import {
  getCollectionFields,
  getCollectionName,
  getFieldInterface,
  getFieldName,
  isAssociationField,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
} from './service-helpers';

export type FlowSurfaceResolvedAssociationTitleField = {
  field: any;
  fieldName: string;
  source: 'explicit' | 'firstTitleable' | 'relationFieldLabel';
  targetCollection?: any;
};

export type FlowSurfaceTitleFieldErrorOptions = {
  action?: string;
  path?: string;
  fieldPath?: string;
  titleField?: string;
  targetCollection?: any;
  targetCollectionName?: string;
  invalidReason?: string;
  details?: Record<string, any>;
};

const FALLBACK_TITLE_USABLE_INTERFACES = new Set([
  'attachmentURL',
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
  'url',
  'uuid',
  'vditor',
]);

const LAST_RESORT_TITLE_FIELD_NAMES = new Set(['createdAt', 'updatedAt']);
const LAST_RESORT_TITLE_FIELD_INTERFACES = new Set(['createdAt', 'updatedAt']);
const TITLE_FIELD_CANDIDATE_LIMIT = 20;

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

export function normalizeFlowSurfaceTitleField(value: any) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized || undefined;
}

export function getFlowSurfaceTitleFieldCandidateNames(collection: any, limit = TITLE_FIELD_CANDIDATE_LIMIT) {
  const candidates = getCollectionFields(collection)
    .filter((field) => {
      const fieldName = getFieldName(field);
      return !!fieldName && !isIdTitleFieldName(fieldName) && !isAssociationField(field);
    })
    .map(getFieldName)
    .filter(Boolean);
  return {
    availableFields: candidates.slice(0, limit),
    availableFieldsTruncated: candidates.length > limit,
  };
}

function buildDefinedTitleFieldDetails(details: Record<string, any>) {
  return Object.fromEntries(Object.entries(details).filter(([, value]) => typeof value !== 'undefined'));
}

export function buildFlowSurfaceTitleFieldErrorDetails(
  options: FlowSurfaceTitleFieldErrorOptions = {},
  candidates = getFlowSurfaceTitleFieldCandidateNames(options.targetCollection),
) {
  const { availableFields, availableFieldsTruncated } = candidates;
  return buildDefinedTitleFieldDetails({
    action: options.action,
    fieldPath: options.fieldPath,
    titleField: options.titleField,
    targetCollection: getTitleFieldTargetCollectionName(options),
    invalidReason: options.invalidReason,
    availableFields: availableFields.length ? availableFields : undefined,
    availableFieldsTruncated: availableFieldsTruncated || undefined,
    suggestion: buildTitleFieldSuggestion(options, availableFields),
    ...options.details,
  });
}

function getTitleFieldTargetCollectionName(options: FlowSurfaceTitleFieldErrorOptions) {
  return String(options.targetCollectionName || '').trim() || getCollectionName(options.targetCollection) || undefined;
}

function buildTitleFieldSuggestion(options: FlowSurfaceTitleFieldErrorOptions, availableFields: string[]) {
  const targetCollectionName = getTitleFieldTargetCollectionName(options);
  const target = targetCollectionName ? ` on target collection '${targetCollectionName}'` : '';
  if (availableFields.length) {
    return `Use one of: ${availableFields.join(', ')}.`;
  }
  return `Set titleField to a readable non-association field${target}.`;
}

function buildTitleFieldGuidance(options: FlowSurfaceTitleFieldErrorOptions, availableFields: string[]) {
  const targetCollectionName = getTitleFieldTargetCollectionName(options);
  const target = targetCollectionName ? ` on target collection '${targetCollectionName}'` : '';
  const suggestion = availableFields.length ? ` Use one of: ${availableFields.join(', ')}.` : '';
  return `; relation titleField must be a readable non-association field${target}.${suggestion}`;
}

function throwTitleFieldBadRequest(
  baseMessage: string,
  ruleId: string,
  options: FlowSurfaceTitleFieldErrorOptions = {},
): never {
  const candidates = getFlowSurfaceTitleFieldCandidateNames(options.targetCollection);
  const details = buildFlowSurfaceTitleFieldErrorDetails(options, candidates);
  const errorOptions: FlowSurfaceErrorOptions = buildDefinedTitleFieldDetails({
    path: options.path,
    ruleId,
    details,
  });
  throwBadRequest(`${baseMessage}${buildTitleFieldGuidance(options, candidates.availableFields)}`, errorOptions);
}

export function assertFlowSurfaceTitleFieldIsNotId(value: any, options: FlowSurfaceTitleFieldErrorOptions = {}) {
  const normalizedTitleField = normalizeFlowSurfaceTitleField(value);
  if (normalizedTitleField === 'id') {
    throwTitleFieldBadRequest("flowSurfaces titleField cannot use 'id'", 'relation-titleField-unreadable', {
      ...options,
      titleField: normalizedTitleField,
      invalidReason: options.invalidReason || 'id',
    });
  }
}

function getAssociationConfiguredLabelFieldName(field: any) {
  return (
    normalizeFlowSurfaceTitleField(field?.uiSchema?.['x-component-props']?.fieldNames?.label) ||
    normalizeFlowSurfaceTitleField(field?.options?.uiSchema?.['x-component-props']?.fieldNames?.label)
  );
}

function isLastResortTitleField(field: any) {
  const fieldName = getFieldName(field);
  if (fieldName && LAST_RESORT_TITLE_FIELD_NAMES.has(fieldName)) {
    return true;
  }
  const fieldInterface = getFieldInterface(field);
  return !!(fieldInterface && LAST_RESORT_TITLE_FIELD_INTERFACES.has(fieldInterface));
}

function isIdTitleFieldName(value: any) {
  return normalizeFlowSurfaceTitleField(value) === 'id';
}

export function assertCollectionTitleFieldExists(
  collection: any,
  fieldName: string,
  options: FlowSurfaceTitleFieldErrorOptions = {},
) {
  const normalizedFieldName = typeof fieldName === 'string' ? fieldName.trim() : String(fieldName || '').trim();
  if (!normalizedFieldName) {
    throwTitleFieldBadRequest(
      'flowSurfaces association titleField must be a non-empty string',
      'relation-titleField-invalid-shape',
      {
        ...options,
        targetCollection: collection,
        invalidReason: 'empty',
      },
    );
  }
  assertFlowSurfaceTitleFieldIsNotId(normalizedFieldName, {
    ...options,
    targetCollection: collection,
  });
  const field = resolveFieldFromCollection(collection, normalizedFieldName);
  if (!field) {
    throwTitleFieldBadRequest(
      `flowSurfaces collection '${
        getCollectionName(collection) || 'unknown'
      }' titleField '${normalizedFieldName}' not found`,
      'relation-titleField-unknown',
      {
        ...options,
        targetCollection: collection,
        titleField: normalizedFieldName,
        invalidReason: 'missing',
      },
    );
  }
  if (isAssociationField(field)) {
    throwTitleFieldBadRequest(
      `flowSurfaces collection '${
        getCollectionName(collection) || 'unknown'
      }' titleField '${normalizedFieldName}' is not readable`,
      'relation-titleField-unreadable',
      {
        ...options,
        targetCollection: collection,
        titleField: normalizedFieldName,
        invalidReason: 'association',
      },
    );
  }
  return field;
}

export function resolveCollectionSafeTitleField(
  collection: any,
  options: FlowSurfaceTitleFieldErrorOptions = {},
): FlowSurfaceResolvedAssociationTitleField | null {
  if (!collection) {
    return null;
  }

  const explicitTitleField = getExplicitCollectionTitleFieldName(collection);
  if (explicitTitleField) {
    const field = assertCollectionTitleFieldExists(collection, explicitTitleField, options);
    return {
      field,
      fieldName: getFieldName(field) || explicitTitleField,
      source: 'explicit',
      targetCollection: collection,
    };
  }

  const isSafeTitleableField = (field: any) =>
    !!getFieldName(field) &&
    !isIdTitleFieldName(getFieldName(field)) &&
    !isAssociationField(field) &&
    isTitleableCollectionField(field);
  const firstTitleableField = getCollectionFields(collection).find(isSafeTitleableField);
  if (!firstTitleableField) {
    return null;
  }

  const preferredTitleableField =
    getCollectionFields(collection).find((field) => isSafeTitleableField(field) && !isLastResortTitleField(field)) ||
    firstTitleableField;

  return {
    field: preferredTitleableField,
    fieldName: getFieldName(preferredTitleableField),
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
  options: FlowSurfaceTitleFieldErrorOptions = {},
): FlowSurfaceResolvedAssociationTitleField | null {
  const targetCollection = resolveAssociationTitleFieldTargetCollection(field, dataSourceKey, getCollection);
  if (!targetCollection) {
    return null;
  }
  const titleFieldErrorOptions = {
    ...options,
    targetCollection,
  };
  const configuredLabelFieldName = getAssociationConfiguredLabelFieldName(field);
  if (configuredLabelFieldName) {
    assertFlowSurfaceTitleFieldIsNotId(configuredLabelFieldName, {
      ...titleFieldErrorOptions,
      titleField: configuredLabelFieldName,
    });
    const configuredLabelField = resolveFieldFromCollection(targetCollection, configuredLabelFieldName);
    if (configuredLabelField) {
      assertCollectionTitleFieldExists(targetCollection, configuredLabelFieldName, {
        ...titleFieldErrorOptions,
        titleField: configuredLabelFieldName,
      });
      return {
        field: configuredLabelField,
        fieldName: configuredLabelFieldName,
        source: 'relationFieldLabel',
        targetCollection,
      };
    }
  }
  const resolved = resolveCollectionSafeTitleField(targetCollection, titleFieldErrorOptions);
  if (!resolved) {
    return null;
  }
  return {
    ...resolved,
    targetCollection,
  };
}
