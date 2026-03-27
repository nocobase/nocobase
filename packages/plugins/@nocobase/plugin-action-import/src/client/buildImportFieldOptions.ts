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

const isRelationField = (field) => field?.target && RELATION_TYPES.includes(field.type);

const shouldExcludeField = (field) => !field?.interface || EXCLUDE_INTERFACES.includes(field.interface);

const createOption = (field, getTitle, disabled = false) => ({
  name: field.name,
  title: getTitle(field),
  schema: field?.uiSchema,
  disabled,
});

const buildFieldOption = (field, getTitle, getTargetFields, relationDepth = 0) => {
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
    .filter(Boolean);

  if (!children.length) {
    return createOption(field, getTitle, true);
  }

  return {
    ...createOption(field, getTitle),
    children,
  };
};

export const buildImportFieldOptions = (fields, getTitle, getTargetFields) => {
  return (fields || [])
    .map((field) => buildFieldOption(field, getTitle, getTargetFields, isRelationField(field) ? 1 : 0))
    .filter(Boolean);
};
