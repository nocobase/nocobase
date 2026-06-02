/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { getSharedFieldDefaultBindingUse } from './core-field-default-bindings';

const FLOW_SURFACE_TEMPLATE_DEFAULT_PAGE = 1;
const FLOW_SURFACE_TEMPLATE_DEFAULT_PAGE_SIZE = 50;
const ASSOCIATION_FIELD_TYPES = new Set([
  'belongsto',
  'hasone',
  'hasmany',
  'belongstomany',
  'belongstoarray',
  'onetoone',
]);
const ASSOCIATION_FIELD_INTERFACES = new Set([
  'm2o',
  'o2m',
  'm2m',
  'o2o',
  'mbm',
  'obo',
  'oho',
  'manytoone',
  'onetomany',
  'manytomany',
]);

export type FlowSurfaceFieldMenuCandidateDedupeShape = {
  fieldPath: string;
  associationPathName?: string;
  explicitWrapperUse?: string;
  explicitFieldUse?: string;
};

export function toTemplatePlainRow(row: any) {
  if (!row) {
    return row;
  }
  if (typeof row.toJSON === 'function') {
    return row.toJSON();
  }
  return row;
}

export function buildFlowTemplateSearchFilter(existing: any, search?: string) {
  const filters = [];
  if (existing) {
    filters.push(existing);
  }
  const normalizedSearch = String(search || '').trim();
  if (normalizedSearch) {
    filters.push({
      $or: [{ name: { $includes: normalizedSearch } }, { description: { $includes: normalizedSearch } }],
    });
  }
  if (!filters.length) {
    return undefined;
  }
  if (filters.length === 1) {
    return filters[0];
  }
  return { $and: filters };
}

export function normalizeTemplatePage(value: any) {
  const num = Number(value || FLOW_SURFACE_TEMPLATE_DEFAULT_PAGE);
  if (!Number.isFinite(num) || num < 1) {
    return FLOW_SURFACE_TEMPLATE_DEFAULT_PAGE;
  }
  return Math.floor(num);
}

export function normalizeTemplatePageSize(value: any) {
  const num = Number(value || FLOW_SURFACE_TEMPLATE_DEFAULT_PAGE_SIZE);
  if (!Number.isFinite(num) || num < 1) {
    return FLOW_SURFACE_TEMPLATE_DEFAULT_PAGE_SIZE;
  }
  return Math.floor(num);
}

export function normalizeFieldPath(fieldPath: string, associationPathName?: string) {
  const normalizedFieldPath = String(fieldPath || '').trim();
  const normalizedAssociationPath = String(associationPathName || '').trim();
  if (!normalizedAssociationPath || !normalizedFieldPath || normalizedFieldPath.includes('.')) {
    return normalizedFieldPath;
  }
  return `${normalizedAssociationPath}.${normalizedFieldPath}`;
}

export function hasConfiguredFlowContextValue(value: any) {
  return !_.isNil(value) && value !== '';
}

export function buildFilterFieldMeta(field: any) {
  return _.pickBy(
    {
      name: getFieldName(field),
      title: getFieldTitle(field),
      interface: getFieldInterface(field),
      type: getFieldType(field),
    },
    (value) => !_.isUndefined(value),
  );
}

export function getCollectionFields(collection: any) {
  return _.castArray(collection?.getFields?.() || Array.from(collection?.fields?.values?.() || []));
}

export function getCollectionTitle(collection: any) {
  return collection?.title || collection?.options?.title || collection?.name || collection?.options?.name;
}

export function getCollectionName(collection: any) {
  return collection?.name || collection?.options?.name;
}

export function getCollectionTitleFieldName(collection: any) {
  const filterTargetKey = collection?.filterTargetKey || collection?.options?.filterTargetKey;
  return (
    collection?.options?.titleField ||
    collection?.titleCollectionField?.name ||
    collection?.titleCollectionField?.options?.name ||
    (Array.isArray(filterTargetKey) ? filterTargetKey[0] : filterTargetKey) ||
    collection?.titleField
  );
}

export function getFieldName(field: any) {
  return field?.name || field?.options?.name;
}

export function getFieldTitle(field: any) {
  return (
    field?.uiSchema?.title ||
    field?.options?.uiSchema?.title ||
    field?.title ||
    field?.options?.title ||
    getFieldName(field)
  );
}

export function getCollectionModelAttributes(collection: any) {
  return (
    (typeof collection?.model?.getAttributes === 'function' ? collection.model.getAttributes() : null) ||
    collection?.model?.rawAttributes ||
    collection?.model?.attributes ||
    {}
  );
}

function getCollectionFieldColumnName(collection: any, fieldName: string) {
  const normalized = String(fieldName || '').trim();
  if (!normalized) {
    return '';
  }
  const attribute = getCollectionModelAttributes(collection)?.[normalized];
  return String(attribute?.field || normalized).trim();
}

export type FlowSurfaceChartBuilderSupportedSubfield = {
  field: string;
  title?: string;
  interface?: string;
};

export function getChartBuilderSupportedRelationSubfields(
  associationPathName: string,
  targetCollection: any,
): FlowSurfaceChartBuilderSupportedSubfield[] {
  const normalizedAssociationPath = String(associationPathName || '').trim();
  if (!normalizedAssociationPath || !targetCollection) {
    return [];
  }

  return getCollectionFields(targetCollection).reduce<FlowSurfaceChartBuilderSupportedSubfield[]>((result, field) => {
    const fieldName = getFieldName(field);
    if (!fieldName || isAssociationField(field)) {
      return result;
    }
    if (getCollectionFieldColumnName(targetCollection, fieldName) !== fieldName) {
      return result;
    }
    result.push(
      _.pickBy(
        {
          field: `${normalizedAssociationPath}.${fieldName}`,
          title: getFieldTitle(field),
          interface: getFieldInterface(field),
        },
        (value) => !_.isUndefined(value),
      ) as FlowSurfaceChartBuilderSupportedSubfield,
    );
    return result;
  }, []);
}

export function formatChartBuilderSupportedRelationSubfields(
  associationPath: string,
  supportedFields: FlowSurfaceChartBuilderSupportedSubfield[] = [],
) {
  const fields = supportedFields.map((item) => String(item?.field || '').trim()).filter(Boolean);
  if (!fields.length) {
    return `No chart-builder-compatible fields are available under '${associationPath}'.`;
  }
  return `Supported fields under '${associationPath}': ${fields.join(', ')}.`;
}

export function getInvalidChartBuilderRelationDirectSubfieldDetails(input: {
  associationPathName: string;
  selectedSubfieldPath: string;
  targetCollection: any;
}) {
  const associationPath = String(input.associationPathName || '').trim();
  const selectedSubfieldPath = String(input.selectedSubfieldPath || '').trim();
  const selectedParts = selectedSubfieldPath.split('.').filter(Boolean);
  if (!associationPath || !input.targetCollection || !selectedParts.length) {
    return null;
  }

  const leafFieldName = selectedParts[0];
  const leafField = resolveFieldFromCollection(input.targetCollection, leafFieldName);
  const modelAttributes = getCollectionModelAttributes(input.targetCollection);
  const modelAttribute = modelAttributes?.[leafFieldName];
  const hasModelAttribute = Object.prototype.hasOwnProperty.call(modelAttributes, leafFieldName);
  const hasNestedSubfieldPath = selectedParts.length > 1;
  if (leafField && !hasNestedSubfieldPath && !isAssociationField(leafField)) {
    return null;
  }
  if (!leafField && hasModelAttribute && !hasNestedSubfieldPath) {
    const columnName = String(modelAttribute?.field || leafFieldName).trim();
    if (columnName && columnName !== leafFieldName) {
      return null;
    }
  }

  return {
    associationPath,
    leafFieldName,
    selectedSubfieldPath: selectedParts.join('.'),
    supportedFields: getChartBuilderSupportedRelationSubfields(associationPath, input.targetCollection),
  };
}

export function getUnsupportedChartBuilderRelationSubfieldDetails(input: {
  associationPathName: string;
  leafFieldName: string;
  leafField?: any;
  targetCollection: any;
}) {
  const leafFieldName = String(input.leafFieldName || '').trim();
  if (!input.targetCollection || !leafFieldName || (input.leafField && isAssociationField(input.leafField))) {
    return null;
  }

  const modelAttributes = getCollectionModelAttributes(input.targetCollection);
  if (!input.leafField && !Object.prototype.hasOwnProperty.call(modelAttributes, leafFieldName)) {
    return null;
  }

  const columnName = getCollectionFieldColumnName(input.targetCollection, leafFieldName);
  if (!columnName || columnName === leafFieldName) {
    return null;
  }

  return {
    associationPath: String(input.associationPathName || '').trim(),
    leafFieldName,
    columnName,
    supportedFields: getChartBuilderSupportedRelationSubfields(input.associationPathName, input.targetCollection),
  };
}

export function resolveAssociationNameFromField(field: any, fallbackCollection?: any) {
  const resourceName = typeof field?.resourceName === 'string' ? field.resourceName.trim() : '';
  if (resourceName) {
    return resourceName;
  }
  const fieldName = getFieldName(field);
  if (!fieldName) {
    return undefined;
  }
  const sourceCollectionName = getCollectionName(field?.collection) || getCollectionName(fallbackCollection);
  return sourceCollectionName ? `${sourceCollectionName}.${fieldName}` : undefined;
}

export function getFieldInterface(field: any) {
  return field?.interface || field?.options?.interface;
}

export function getFieldType(field: any) {
  return field?.type || field?.options?.type;
}

export function inferFlowContextTypeFromField(field: any) {
  switch (getFieldType(field)) {
    case 'boolean':
      return 'boolean';
    case 'integer':
    case 'float':
    case 'double':
    case 'decimal':
      return 'number';
    case 'json':
      return 'object';
    case 'array':
      return 'array';
    default:
      return 'string';
  }
}

export function getFieldTarget(field: any) {
  return field?.target || field?.options?.target;
}

export function getFieldFilterable(field: any) {
  if (!_.isUndefined(field?.filterable)) {
    return field.filterable;
  }
  return field?.options?.filterable;
}

export function inferAssociationLeafDisplayFieldUse(fieldInterface?: string) {
  return getSharedFieldDefaultBindingUse('display', fieldInterface);
}

export function inferFieldMenuEditableFieldUse(fieldInterface?: string) {
  const normalized = String(fieldInterface || '').trim();
  if (['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'].includes(normalized)) {
    return 'RecordSelectFieldModel';
  }
  return getSharedFieldDefaultBindingUse('editable', normalized);
}

export function isAssociationField(field: any) {
  if (typeof field?.isAssociationField === 'function') {
    return field.isAssociationField();
  }
  if (getFieldTarget(field)) {
    return true;
  }
  const fieldType = String(getFieldType(field) || '')
    .trim()
    .toLowerCase();
  const fieldInterface = String(getFieldInterface(field) || '')
    .trim()
    .toLowerCase();
  return ASSOCIATION_FIELD_TYPES.has(fieldType) || ASSOCIATION_FIELD_INTERFACES.has(fieldInterface);
}

export function resolveFieldFromCollection(collection: any, fieldPath: string) {
  if (!collection || !fieldPath) {
    return null;
  }
  if (typeof collection?.getFieldByPath === 'function') {
    const direct = collection.getFieldByPath(fieldPath);
    if (direct) {
      return direct;
    }
  }

  const [head, ...rest] = String(fieldPath || '')
    .split('.')
    .filter(Boolean);
  const field = collection?.getField?.(head) || collection?.fields?.get?.(head);
  if (!field || rest.length === 0) {
    return field || null;
  }
  const targetCollection = resolveFieldTargetCollection(field, collection?.dataSourceKey, () => null);
  if (!targetCollection) {
    return null;
  }
  return resolveFieldFromCollection(targetCollection, rest.join('.'));
}

export function resolveFieldTargetCollection(
  field: any,
  dataSourceKey: string,
  getCollection: (dataSourceKey: string, collectionName: string) => any,
) {
  return (
    (typeof field?.targetCollection === 'function' ? field.targetCollection() : field?.targetCollection) ||
    (getFieldTarget(field) ? getCollection(dataSourceKey || 'main', getFieldTarget(field)) : null)
  );
}

export function buildCatalogCollectionCycleKey(collection: any, dataSourceKey?: string) {
  if (!collection) {
    return undefined;
  }
  return `${dataSourceKey || collection?.dataSourceKey || 'main'}:${
    collection?.name || collection?.options?.name || collection?.title || 'unknown'
  }`;
}

export function dedupeVisibleFieldCandidates<T extends FlowSurfaceFieldMenuCandidateDedupeShape>(candidates: T[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const dedupeKey = [
      normalizeFieldPath(candidate.fieldPath, candidate.associationPathName),
      candidate.explicitWrapperUse || '',
      candidate.explicitFieldUse || '',
    ].join('::');
    if (seen.has(dedupeKey)) {
      return false;
    }
    seen.add(dedupeKey);
    return true;
  });
}

export function getAssociationFilterTargetKey(field: any, targetCollection?: any) {
  const resolvedTargetCollection = targetCollection || resolveFieldTargetCollection(field, '', () => null);
  const filterTargetKey =
    resolvedTargetCollection?.filterTargetKey || resolvedTargetCollection?.options?.filterTargetKey;

  if (Array.isArray(filterTargetKey)) {
    return filterTargetKey[0] || 'id';
  }

  return filterTargetKey || 'id';
}
