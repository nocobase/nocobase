/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RecordCommentRecord = {
  id?: string | number;
  [key: string]: unknown;
};

export type RecordCommentFieldMapping = {
  commenterField?: string;
  dateField?: string;
  contentField?: string;
  ownerField?: string;
  ownerValueField?: unknown;
};

export type DefaultRecordCommentFieldMapping = Pick<RecordCommentFieldMapping, 'ownerField' | 'ownerValueField'>;

export type RecordCommentAssociationLike = {
  collection?: {
    name?: string;
  };
  foreignKey?: string;
  sourceKey?: string;
};

export type RecordCommentCollection = {
  filterTargetKey?: string | string[];
  getFilterByTK?: (record: RecordCommentRecord) => unknown;
  getField?: (fieldName: string) => RecordCommentCollectionField | undefined;
  getFields?: () => RecordCommentCollectionField[];
  fields?: RecordCommentCollectionField[] | Map<string, RecordCommentCollectionField>;
  options?: {
    fields?: RecordCommentCollectionField[];
  };
};

export type RecordCommentCollectionField = {
  name?: string;
  title?: string;
  interface?: string;
  type?: string;
  target?: string;
  primaryKey?: boolean;
  targetKey?: string;
  targetCollection?: RecordCommentCollection & {
    name?: string;
  };
  uiSchema?: {
    title?: string;
    ['x-component-props']?: Record<string, unknown>;
  };
};

export type RecordCommentOwnerValueContext = {
  record?: RecordCommentRecord;
  resolveJsonTemplate?: (template: string) => Promise<unknown>;
};

export const DEFAULT_PAGE_SIZE = 20;
export const OWNER_FILTER_GROUP_KEY = 'record-comments-owner';
export const COMMENT_OWNER_VARIABLE_EXAMPLE = '{{ ctx.record.id }}';
export const COMMENT_OWNER_FILTER_BY_TK_VARIABLE = '{{ ctx.view.inputArgs.filterByTk }}';

const isCollectionLike = (value: unknown): value is RecordCommentCollection => {
  return Boolean(value && typeof value === 'object');
};

const normalizeFilterTargetKey = (filterTargetKey: unknown) => {
  if (typeof filterTargetKey === 'string') {
    return filterTargetKey;
  }

  if (Array.isArray(filterTargetKey) && filterTargetKey.length === 1 && typeof filterTargetKey[0] === 'string') {
    return filterTargetKey[0];
  }

  return undefined;
};

export const getCollectionFields = (collection?: unknown): RecordCommentCollectionField[] => {
  if (!isCollectionLike(collection)) {
    return [];
  }

  if (typeof collection?.getFields === 'function') {
    return collection.getFields();
  }

  if (collection.fields instanceof Map) {
    return Array.from(collection.fields.values());
  }

  return collection?.fields || collection?.options?.fields || [];
};

export const getCollectionField = (collection: unknown, fieldName?: string) => {
  if (!fieldName) {
    return undefined;
  }

  if (isCollectionLike(collection) && typeof collection?.getField === 'function') {
    return collection.getField(fieldName);
  }

  return getCollectionFields(collection).find((field) => field.name === fieldName);
};

export const getCollectionFieldOptions = (collection?: unknown) => {
  return getCollectionFields(collection)
    .filter((field) => field.name)
    .map((field) => ({
      label: field.title || field.uiSchema?.title || field.name,
      value: field.name,
    }));
};

const contentFieldTypes = new Set(['string', 'text']);
const contentFieldInterfaces = new Set(['input', 'markdown', 'richText', 'text', 'textarea', 'vditor']);
const dateFieldTypes = new Set(['date', 'dateOnly', 'datetime', 'time', 'unixTimestamp']);
const dateFieldInterfaces = new Set([
  'createdAt',
  'date',
  'dateOnly',
  'datetime',
  'time',
  'unixTimestamp',
  'updatedAt',
]);

export const isCommentContentField = (field?: RecordCommentCollectionField) => {
  if (!field) {
    return false;
  }

  if (field.interface) {
    return contentFieldInterfaces.has(field.interface);
  }

  return contentFieldTypes.has(field.type || '');
};

export const isCommentDateField = (field?: RecordCommentCollectionField) => {
  if (!field) {
    return false;
  }

  if (field.interface) {
    return dateFieldInterfaces.has(field.interface);
  }

  return dateFieldTypes.has(field.type || '');
};

export const getCommentContentFieldOptions = (collection?: unknown) => {
  return getCollectionFields(collection)
    .filter((field) => field.name && isCommentContentField(field))
    .map((field) => ({
      label: field.title || field.uiSchema?.title || field.name,
      value: field.name,
    }));
};

export const getCommentDateFieldOptions = (collection?: unknown) => {
  return getCollectionFields(collection)
    .filter((field) => field.name && isCommentDateField(field))
    .map((field) => ({
      label: field.title || field.uiSchema?.title || field.name,
      value: field.name,
    }));
};

export const isBelongsToField = (field?: RecordCommentCollectionField) => {
  return field?.type === 'belongsTo' || field?.interface === 'm2o';
};

const multiValueAssociationTypes = new Set(['belongsToArray', 'belongsToMany', 'hasMany', 'hasOne']);
const multiValueAssociationInterfaces = new Set(['m2m', 'o2m', 'oho', 'obo']);

export const isCommentOwnerField = (field?: RecordCommentCollectionField) => {
  if (!field?.name) {
    return false;
  }

  if (field.type && multiValueAssociationTypes.has(field.type)) {
    return false;
  }

  if (field.interface && multiValueAssociationInterfaces.has(field.interface)) {
    return false;
  }

  if (isBelongsToField(field)) {
    return false;
  }

  return true;
};

export const isUserField = (field?: RecordCommentCollectionField) => {
  return isBelongsToField(field) && (field?.target === 'users' || field?.targetCollection?.name === 'users');
};

export const getCommentOwnerFieldOptions = (collection?: unknown) => {
  return getCollectionFields(collection)
    .filter(isCommentOwnerField)
    .map((field) => ({
      label: field.title || field.uiSchema?.title || field.name,
      value: field.name,
    }));
};

export const getCommentUserFieldOptions = (collection?: unknown) => {
  return getCollectionFields(collection)
    .filter((field) => field.name && isUserField(field))
    .map((field) => ({
      label: field.title || field.uiSchema?.title || field.name,
      value: field.name,
    }));
};

export const getDefaultRecordCommentFieldMapping = (options: {
  collection?: unknown;
  currentCollectionName?: string;
}): DefaultRecordCommentFieldMapping => {
  const { collection, currentCollectionName } = options;

  if (!currentCollectionName) {
    return {};
  }

  const ownerField = getCollectionFields(collection).find((field) => {
    if (!field.name || !isBelongsToField(field)) {
      return false;
    }

    return field.target === currentCollectionName || field.targetCollection?.name === currentCollectionName;
  })?.name;

  if (!ownerField) {
    return {};
  }

  return {
    ownerField,
    ownerValueField: COMMENT_OWNER_FILTER_BY_TK_VARIABLE,
  };
};

export const getAssociationSourceCollectionName = (options: {
  association?: RecordCommentAssociationLike;
  associationName?: string;
}) => {
  const { association, associationName } = options;

  if (association?.collection?.name) {
    return association.collection.name;
  }

  if (!associationName) {
    return undefined;
  }

  const [sourceCollectionName] = associationName.split('.');
  return sourceCollectionName || undefined;
};

export const getAssociationRecordCommentFieldMapping = (options: {
  collection?: unknown;
  association?: RecordCommentAssociationLike;
  associationName?: string;
  sourceId?: unknown;
}): DefaultRecordCommentFieldMapping => {
  const foreignKey = options.association?.foreignKey;
  if (foreignKey && getCollectionField(options.collection, foreignKey)) {
    return {
      ownerField: foreignKey,
      ownerValueField: options.sourceId ?? COMMENT_OWNER_FILTER_BY_TK_VARIABLE,
    };
  }

  const sourceCollectionName = getAssociationSourceCollectionName(options);

  const mapping = getDefaultRecordCommentFieldMapping({
    collection: options.collection,
    currentCollectionName: sourceCollectionName,
  });

  if (mapping.ownerField) {
    return {
      ...mapping,
      ownerValueField: options.sourceId ?? mapping.ownerValueField,
    };
  }

  return {};
};

export const getCollectionFilterTargetKey = (collection?: unknown) => {
  if (!isCollectionLike(collection)) {
    return 'id';
  }

  return (
    normalizeFilterTargetKey(collection?.filterTargetKey) ||
    getCollectionFields(collection).find((field) => field.primaryKey)?.name ||
    'id'
  );
};

export const getRecordPrimaryKeyValue = (
  record?: RecordCommentRecord,
  collection?: unknown,
): string | number | undefined => {
  if (!record) {
    return undefined;
  }

  try {
    const filterByTk = isCollectionLike(collection) ? collection?.getFilterByTK?.(record) : undefined;
    if (typeof filterByTk === 'string' || typeof filterByTk === 'number') {
      return filterByTk;
    }
  } catch (error) {
    // Fall through to the configured target key.
  }

  const targetKey = getCollectionFilterTargetKey(collection);
  const value = targetKey ? record[targetKey] : undefined;
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
};

const normalizeStringConfigValue = (value?: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const configValue = (value as { value?: unknown }).value;
  return typeof configValue === 'string' ? configValue : undefined;
};

export const getValueByPath = (record: RecordCommentRecord | undefined, path?: unknown) => {
  const normalizedPath = normalizeStringConfigValue(path);
  if (!record || !normalizedPath) {
    return undefined;
  }

  return normalizedPath.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, record);
};

export const isContextVariableExpression = (value?: unknown) => {
  const normalizedValue = normalizeStringConfigValue(value);
  if (!normalizedValue) {
    return false;
  }

  return /^\{\{\s*ctx(?:\..+?)?\s*\}\}$/.test(normalizedValue.trim());
};

export const isContextVariablePath = (value?: unknown) => {
  const normalizedValue = normalizeStringConfigValue(value);
  if (!normalizedValue) {
    return false;
  }

  return /^ctx(?:\..+?)?$/.test(normalizedValue.trim());
};

export const isContextVariableValue = (value?: unknown) => {
  return isContextVariableExpression(value) || isContextVariablePath(value);
};

export const normalizeContextVariableTemplate = (value?: unknown) => {
  const normalizedValue = normalizeStringConfigValue(value);
  if (!normalizedValue) {
    return undefined;
  }

  const trimmedValue = normalizedValue.trim();
  if (isContextVariableExpression(trimmedValue)) {
    return trimmedValue;
  }

  if (isContextVariablePath(trimmedValue)) {
    return `{{ ${trimmedValue} }}`;
  }

  return undefined;
};

export const toScalarFilterValue = (value: unknown): string | number | boolean | undefined => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as RecordCommentRecord;
    const nestedValue = record.id ?? record.value ?? record.key;
    if (typeof nestedValue === 'string' || typeof nestedValue === 'number' || typeof nestedValue === 'boolean') {
      return nestedValue;
    }
  }

  return undefined;
};

const numericFieldTypes = new Set(['integer', 'bigInt', 'double', 'float', 'decimal', 'real']);
const booleanFieldTypes = new Set(['boolean']);
const stringFieldTypes = new Set([
  'string',
  'text',
  'uid',
  'uuid',
  'email',
  'phone',
  'url',
  'password',
  'radioGroup',
  'select',
]);

const isNumericField = (field?: RecordCommentCollectionField) => {
  return Boolean(field && (numericFieldTypes.has(field.type || '') || numericFieldTypes.has(field.interface || '')));
};

const isBooleanField = (field?: RecordCommentCollectionField) => {
  return Boolean(field && (booleanFieldTypes.has(field.type || '') || booleanFieldTypes.has(field.interface || '')));
};

const isStringField = (field?: RecordCommentCollectionField) => {
  return Boolean(field && (stringFieldTypes.has(field.type || '') || stringFieldTypes.has(field.interface || '')));
};

const normalizeFilterValueByFieldType = (value: string | number | boolean, field?: RecordCommentCollectionField) => {
  if (!field) {
    return {
      compatible: true,
      value,
    };
  }

  if (isNumericField(field)) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? { compatible: true, value } : { compatible: false };
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? { compatible: true, value: numberValue } : { compatible: false };
    }

    return { compatible: false };
  }

  if (isBooleanField(field)) {
    if (typeof value === 'boolean') {
      return { compatible: true, value };
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === 'true' || normalizedValue === '1') {
        return { compatible: true, value: true };
      }

      if (normalizedValue === 'false' || normalizedValue === '0') {
        return { compatible: true, value: false };
      }
    }

    return { compatible: false };
  }

  if (isStringField(field)) {
    return {
      compatible: true,
      value: String(value),
    };
  }

  return {
    compatible: true,
    value,
  };
};

const getOwnerValueField = (collection: unknown, ownerFieldName: string) => {
  const ownerField = getCollectionField(collection, ownerFieldName);
  if (!isBelongsToField(ownerField)) {
    return ownerField;
  }

  const targetKey =
    ownerField?.targetKey || normalizeFilterTargetKey(ownerField?.targetCollection?.filterTargetKey) || 'id';
  return getCollectionField(ownerField?.targetCollection, targetKey);
};

export const normalizeOwnerFilterValue = (
  collection: unknown,
  ownerFieldName: string,
  ownerValue: string | number | boolean,
) => {
  return normalizeFilterValueByFieldType(ownerValue, getOwnerValueField(collection, ownerFieldName));
};

const extractCurrentRecordVariablePath = (value?: unknown) => {
  const normalizedValue = normalizeStringConfigValue(value);
  if (!normalizedValue) {
    return undefined;
  }

  const trimmedValue = normalizedValue.trim();
  const templateMatch = trimmedValue.match(/^\{\{\s*(ctx\.(?:record|popup\.record)(?:\..+?)?)\s*\}\}$/);
  if (templateMatch) {
    return templateMatch[1];
  }

  if (/^(?:ctx\.)?(?:record|popup\.record)(?:\..+?)?$/.test(trimmedValue)) {
    return trimmedValue.startsWith('ctx.') ? trimmedValue : `ctx.${trimmedValue}`;
  }

  return undefined;
};

const isViewFilterByTkVariablePath = (value?: unknown) => {
  const normalizedValue = normalizeStringConfigValue(value);
  if (!normalizedValue) {
    return false;
  }

  const trimmedValue = normalizedValue.trim().replace(/\s+/g, '');
  return (
    trimmedValue === 'ctx.view.inputArgs.filterByTk' ||
    trimmedValue === 'ctx.inputArgs.filterByTk' ||
    trimmedValue === '{{ctx.view.inputArgs.filterByTk}}' ||
    trimmedValue === '{{ctx.inputArgs.filterByTk}}'
  );
};

const toFilterByTkScalarValue = (value: unknown, targetKey?: string) => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const record = value as RecordCommentRecord;
  if (targetKey) {
    const targetValue = record[targetKey];
    if (typeof targetValue === 'string' || typeof targetValue === 'number' || typeof targetValue === 'boolean') {
      return targetValue;
    }
  }

  return toScalarFilterValue(value);
};

export const resolveCommentOwnerValueFromFilterByTk = (
  ownerValueField: unknown,
  filterByTk: unknown,
  currentRecordTargetKey = 'id',
) => {
  if (isViewFilterByTkVariablePath(ownerValueField)) {
    return toFilterByTkScalarValue(filterByTk, currentRecordTargetKey);
  }

  const recordVariablePath = extractCurrentRecordVariablePath(ownerValueField);
  if (!recordVariablePath) {
    if (typeof ownerValueField === 'number' || typeof ownerValueField === 'boolean') {
      return ownerValueField;
    }

    if (typeof ownerValueField === 'string' && !isContextVariableValue(ownerValueField)) {
      return ownerValueField;
    }

    return undefined;
  }

  if (
    recordVariablePath !== 'ctx.record' &&
    recordVariablePath !== `ctx.record.${currentRecordTargetKey}` &&
    recordVariablePath !== 'ctx.popup.record' &&
    recordVariablePath !== `ctx.popup.record.${currentRecordTargetKey}`
  ) {
    return undefined;
  }

  const filterByTkValue = toFilterByTkScalarValue(filterByTk, currentRecordTargetKey);
  if (filterByTkValue !== undefined) {
    return filterByTkValue;
  }

  return undefined;
};

export const createOwnerFieldFilter = (
  collection: unknown,
  ownerFieldName: string,
  ownerValue: string | number | boolean,
) => {
  const field = getCollectionField(collection, ownerFieldName);

  if (isBelongsToField(field)) {
    const targetKey = field?.targetKey || normalizeFilterTargetKey(field?.targetCollection?.filterTargetKey) || 'id';
    return {
      [ownerFieldName]: {
        [targetKey]: {
          $eq: ownerValue,
        },
      },
    };
  }

  return {
    [ownerFieldName]: {
      $eq: ownerValue,
    },
  };
};

export const resolveCommentOwnerValue = async (context: RecordCommentOwnerValueContext, ownerValueField?: unknown) => {
  const contextVariableTemplate = normalizeContextVariableTemplate(ownerValueField);
  const value = contextVariableTemplate
    ? await context.resolveJsonTemplate?.(contextVariableTemplate)
    : getValueByPath(context.record, ownerValueField);

  return toScalarFilterValue(value);
};

export const getDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => getDisplayValue(item)).join(', ');
  }

  if (typeof value === 'object') {
    const record = value as RecordCommentRecord;
    return String(record.title ?? record.name ?? record.nickname ?? record.username ?? record.id ?? '-');
  }

  return String(value);
};
