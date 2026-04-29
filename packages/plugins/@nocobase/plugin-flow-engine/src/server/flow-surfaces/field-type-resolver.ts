/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { FlowSurfaceBadRequestError, throwBadRequest } from './errors';
import { SINGLE_VALUE_ASSOCIATION_INTERFACES, MULTI_VALUE_ASSOCIATION_INTERFACES } from './association-interfaces';
import { normalizeFieldContainerKind } from './field-semantics';
import {
  getCollectionFields,
  getFieldInterface,
  getFieldName,
  isAssociationField,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
} from './service-helpers';
import { resolveCollectionSafeTitleField } from './association-title-field';

export const FLOW_SURFACE_PUBLIC_RELATION_FIELD_TYPES = [
  'text',
  'select',
  'picker',
  'subForm',
  'subFormList',
  'subDetails',
  'subDetailsList',
  'subTable',
  'popupSubTable',
] as const;

export type FlowSurfacePublicRelationFieldType = (typeof FLOW_SURFACE_PUBLIC_RELATION_FIELD_TYPES)[number];

export const FLOW_SURFACE_RESERVED_RELATION_FIELD_TYPES = ['cascade', 'upload', 'preview'] as const;

export const FLOW_SURFACE_PUBLIC_FIELD_TYPE_SET = new Set<string>([
  ...FLOW_SURFACE_PUBLIC_RELATION_FIELD_TYPES,
  ...FLOW_SURFACE_RESERVED_RELATION_FIELD_TYPES,
]);

export const FLOW_SURFACE_INTERNAL_FIELD_KEYS = [
  'fieldComponent',
  'fieldModel',
  'componentFields',
  'use',
  'fieldUse',
  'subModels',
  'props',
  'stepParams',
];

const FIELD_USE_TO_PUBLIC_FIELD_TYPE: Record<string, FlowSurfacePublicRelationFieldType> = {
  DisplayTextFieldModel: 'text',
  RecordSelectFieldModel: 'select',
  RecordPickerFieldModel: 'picker',
  SubFormFieldModel: 'subForm',
  SubFormListFieldModel: 'subFormList',
  DisplaySubItemFieldModel: 'subDetails',
  DisplaySubListFieldModel: 'subDetailsList',
  DisplaySubTableFieldModel: 'subTable',
  SubTableFieldModel: 'subTable',
  PopupSubTableFieldModel: 'popupSubTable',
};

const FIELD_TYPES_WITH_FIELDS = new Set<FlowSurfacePublicRelationFieldType>([
  'picker',
  'subForm',
  'subFormList',
  'subDetails',
  'subDetailsList',
  'subTable',
  'popupSubTable',
]);

const FIELD_TYPES_WITH_TABLE_PROPS = new Set<FlowSurfacePublicRelationFieldType>(['subTable', 'popupSubTable']);

export function assertNoInternalFieldKeys(input: Record<string, any> | undefined, context: string) {
  if (!_.isPlainObject(input)) {
    return;
  }
  const forbidden = FLOW_SURFACE_INTERNAL_FIELD_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(input, key));
  if (forbidden.length) {
    throwBadRequest(`${context} does not accept internal field keys: ${forbidden.join(', ')}`);
  }
}

export function normalizePublicFieldType(value: any, context: string): FlowSurfacePublicRelationFieldType | undefined {
  if (_.isUndefined(value) || _.isNull(value) || value === '') {
    return undefined;
  }
  const normalized = String(value || '').trim();
  if (!normalized) {
    return undefined;
  }
  if (FLOW_SURFACE_RESERVED_RELATION_FIELD_TYPES.includes(normalized as any)) {
    throwBadRequest(`flowSurfaces ${context} fieldType '${normalized}' is reserved for plugin-specific field types`);
  }
  if (!FLOW_SURFACE_PUBLIC_RELATION_FIELD_TYPES.includes(normalized as any)) {
    throwBadRequest(
      `flowSurfaces ${context} fieldType '${normalized}' is not supported; supported fieldTypes: ${FLOW_SURFACE_PUBLIC_RELATION_FIELD_TYPES.join(
        ', ',
      )}`,
    );
  }
  return normalized as FlowSurfacePublicRelationFieldType;
}

export function normalizePublicFieldNameList(value: any, context: string): string[] | undefined {
  if (_.isUndefined(value)) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throwBadRequest(`flowSurfaces ${context} must be an array of field names`);
  }
  return value.map((item, index) => {
    const normalized = String(item || '').trim();
    if (!normalized) {
      throwBadRequest(`flowSurfaces ${context}[${index + 1}] cannot be empty`);
    }
    return normalized;
  });
}

export function getPublicFieldTypeForUse(use?: string): FlowSurfacePublicRelationFieldType | undefined {
  return FIELD_USE_TO_PUBLIC_FIELD_TYPE[String(use || '').trim()];
}

function getAssociationCardinality(field: any): 'single' | 'multi' | null {
  const fieldInterface = String(getFieldInterface(field) || '').trim();
  if (SINGLE_VALUE_ASSOCIATION_INTERFACES.has(fieldInterface)) {
    return 'single';
  }
  if (MULTI_VALUE_ASSOCIATION_INTERFACES.has(fieldInterface)) {
    return 'multi';
  }
  return null;
}

function pickCollectionFallbackFieldName(collection: any) {
  const safeTitleFieldName = resolveCollectionSafeTitleField(collection)?.fieldName;
  if (safeTitleFieldName && resolveFieldFromCollection(collection, safeTitleFieldName)) {
    return safeTitleFieldName;
  }
  const primaryField = getCollectionFields(collection).find(
    (field) => !!field?.primaryKey || !!field?.options?.primaryKey,
  );
  return getFieldName(primaryField) || 'id';
}

function assertTargetFieldNamesExist(targetCollection: any, fields: string[], context: string) {
  fields.forEach((fieldName) => {
    if (!resolveFieldFromCollection(targetCollection, fieldName)) {
      throwBadRequest(`flowSurfaces ${context} field '${fieldName}' does not exist on relation target collection`);
    }
  });
}

export function resolveRelationFieldType(input: {
  fieldType: any;
  containerUse: string;
  field: any;
  dataSourceKey: string;
  getCollection: (dataSourceKey: string, collectionName: string) => any;
  fields?: any;
  titleField?: any;
  openMode?: any;
  popupSize?: any;
  pageSize?: any;
  showIndex?: any;
  applyDefaults?: boolean;
  context: string;
}) {
  const fieldType = normalizePublicFieldType(input.fieldType, input.context);
  if (!fieldType) {
    return undefined;
  }
  if (!isAssociationField(input.field)) {
    throw new FlowSurfaceBadRequestError('flowSurfaces fieldType is only supported for relation fields');
  }

  const targetCollection = resolveFieldTargetCollection(
    input.field,
    input.dataSourceKey || 'main',
    input.getCollection,
  );
  if (!targetCollection) {
    throwBadRequest(`flowSurfaces ${input.context} fieldType '${fieldType}' cannot resolve relation target collection`);
  }

  const cardinality = getAssociationCardinality(input.field);
  if (!cardinality) {
    throwBadRequest(`flowSurfaces ${input.context} fieldType '${fieldType}' is not supported for this relation field`);
  }

  const containerKind = normalizeFieldContainerKind(input.containerUse);
  let fieldUse: string | undefined;
  switch (fieldType) {
    case 'text':
      fieldUse = containerKind === 'form' ? 'RecordSelectFieldModel' : 'DisplayTextFieldModel';
      break;
    case 'select':
      fieldUse = 'RecordSelectFieldModel';
      break;
    case 'picker':
      fieldUse = 'RecordPickerFieldModel';
      break;
    case 'subForm':
      if (cardinality !== 'single') {
        throwBadRequest(`flowSurfaces ${input.context} fieldType 'subForm' only supports single relation fields`);
      }
      fieldUse = 'SubFormFieldModel';
      break;
    case 'subFormList':
      if (cardinality !== 'multi') {
        throwBadRequest(`flowSurfaces ${input.context} fieldType 'subFormList' only supports multi relation fields`);
      }
      fieldUse = 'SubFormListFieldModel';
      break;
    case 'subDetails':
      if (cardinality !== 'single') {
        throwBadRequest(`flowSurfaces ${input.context} fieldType 'subDetails' only supports single relation fields`);
      }
      fieldUse = 'DisplaySubItemFieldModel';
      break;
    case 'subDetailsList':
      if (cardinality !== 'multi') {
        throwBadRequest(`flowSurfaces ${input.context} fieldType 'subDetailsList' only supports multi relation fields`);
      }
      fieldUse = 'DisplaySubListFieldModel';
      break;
    case 'subTable':
      if (cardinality !== 'multi') {
        throwBadRequest(`flowSurfaces ${input.context} fieldType 'subTable' only supports multi relation fields`);
      }
      fieldUse = containerKind === 'form' ? 'SubTableFieldModel' : 'DisplaySubTableFieldModel';
      break;
    case 'popupSubTable':
      if (cardinality !== 'multi') {
        throwBadRequest(`flowSurfaces ${input.context} fieldType 'popupSubTable' only supports multi relation fields`);
      }
      fieldUse = 'PopupSubTableFieldModel';
      break;
  }

  const explicitFields = normalizePublicFieldNameList(input.fields, `${input.context}.fields`);
  if (explicitFields && !FIELD_TYPES_WITH_FIELDS.has(fieldType)) {
    throwBadRequest(`flowSurfaces ${input.context} fieldType '${fieldType}' does not support fields`);
  }
  if ((!_.isUndefined(input.openMode) || !_.isUndefined(input.popupSize)) && fieldType !== 'picker') {
    throwBadRequest(`flowSurfaces ${input.context} fieldType '${fieldType}' does not support openMode or popupSize`);
  }
  if (
    (!_.isUndefined(input.pageSize) || !_.isUndefined(input.showIndex)) &&
    !FIELD_TYPES_WITH_TABLE_PROPS.has(fieldType)
  ) {
    throwBadRequest(`flowSurfaces ${input.context} fieldType '${fieldType}' does not support pageSize or showIndex`);
  }
  const shouldApplyDefaults = input.applyDefaults !== false;
  const defaultTargetField = shouldApplyDefaults ? pickCollectionFallbackFieldName(targetCollection) : undefined;
  const fields =
    explicitFields ??
    (shouldApplyDefaults && (usesNestedRelationFields(fieldUse) || fieldType === 'picker')
      ? [defaultTargetField]
      : undefined);
  const selectorFields = ['picker', 'popupSubTable'].includes(fieldType) ? fields : undefined;
  const titleField = _.isUndefined(input.titleField)
    ? defaultTargetField
    : String(input.titleField || '').trim() || undefined;

  if (fields?.length) {
    assertTargetFieldNamesExist(targetCollection, fields, `${input.context}.fields`);
  }
  if (titleField && !resolveFieldFromCollection(targetCollection, titleField)) {
    throwBadRequest(
      `flowSurfaces ${input.context}.titleField '${titleField}' does not exist on relation target collection`,
    );
  }

  return {
    fieldType,
    fieldUse,
    cardinality,
    targetCollection,
    fields,
    selectorFields,
    titleField,
    openMode: input.openMode,
    popupSize: input.popupSize,
    pageSize: input.pageSize,
    showIndex: input.showIndex,
  };
}

export function usesNestedRelationFields(fieldUse?: string) {
  return [
    'SubTableFieldModel',
    'PopupSubTableFieldModel',
    'DisplaySubTableFieldModel',
    'SubFormFieldModel',
    'SubFormListFieldModel',
    'DisplaySubItemFieldModel',
    'DisplaySubListFieldModel',
  ].includes(String(fieldUse || '').trim());
}
