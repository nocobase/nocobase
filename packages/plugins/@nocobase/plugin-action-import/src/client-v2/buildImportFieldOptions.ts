/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const EXCLUDE_INTERFACES = ['createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
const RELATION_TYPES = ['hasOne', 'belongsTo', 'hasMany', 'belongsToMany', 'belongsToArray'];

export type ImportFieldOptionSource = {
  name?: string;
  type?: string;
  target?: string;
  interface?: string;
  uiSchema?: {
    title?: unknown;
    [key: string]: unknown;
  };
  targetCollection?: {
    getFields: () => ImportFieldOptionSource[];
  };
  [key: string]: unknown;
};

export type ImportFieldOption = {
  name?: string;
  title: unknown;
  schema: unknown;
  disabled?: boolean;
  children?: ImportFieldOption[];
};

const isRelationField = (field?: ImportFieldOptionSource) =>
  Boolean(field?.target && RELATION_TYPES.includes(field.type || ''));

const shouldExcludeField = (field?: ImportFieldOptionSource) =>
  !field?.interface || EXCLUDE_INTERFACES.includes(field.interface);

const createOption = <T extends ImportFieldOptionSource>(
  field: T,
  getTitle: (field: T) => unknown,
  disabled = false,
): ImportFieldOption => ({
  name: field.name,
  title: getTitle(field),
  schema: field.uiSchema,
  disabled,
});

const buildFieldOption = <T extends ImportFieldOptionSource>(
  field: T,
  getTitle: (field: T) => unknown,
  getTargetFields: (field: T) => ImportFieldOptionSource[] | null | undefined,
  relationDepth = 0,
): ImportFieldOption | null => {
  if (shouldExcludeField(field)) {
    return null;
  }

  if (!isRelationField(field)) {
    return createOption(field, getTitle);
  }

  const targetFields = getTargetFields(field) || [];
  const children = targetFields
    .map((targetField) => {
      if (shouldExcludeField(targetField)) {
        return null;
      }

      if (!isRelationField(targetField)) {
        return buildFieldOption(targetField, getTitle, getTargetFields);
      }

      if (relationDepth >= 1) {
        return createOption(targetField, getTitle, true);
      }

      return buildFieldOption(targetField, getTitle, getTargetFields, relationDepth + 1);
    })
    .filter((option): option is ImportFieldOption => Boolean(option));

  if (!children.length) {
    return createOption(field, getTitle, true);
  }

  return {
    ...createOption(field, getTitle),
    children,
  };
};

export const buildImportFieldOptions = <T extends ImportFieldOptionSource>(
  fields: T[] | null | undefined,
  getTitle: (field: T) => unknown,
  getTargetFields: (field: T) => ImportFieldOptionSource[] | null | undefined,
): ImportFieldOption[] => {
  return (fields || [])
    .map((field) => buildFieldOption(field, getTitle, getTargetFields, isRelationField(field) ? 1 : 0))
    .filter((option): option is ImportFieldOption => Boolean(option));
};
