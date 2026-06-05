/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const TO_ONE_RELATION_TYPES = ['hasOne', 'belongsTo'];
const TO_MANY_RELATION_TYPES = ['hasMany', 'belongsToMany', 'belongsToArray'];
const RELATION_TYPES = [...TO_ONE_RELATION_TYPES, 'hasMany', 'belongsToMany', 'belongsToArray'];

const isRelationField = (field) => field?.target && RELATION_TYPES.includes(field.type);
const isToManyRelationField = (field) => field?.target && TO_MANY_RELATION_TYPES.includes(field.type);

const createOption = (field, getTitle, disabled = false) => ({
  name: field.name,
  title: getTitle(field),
  schema: field?.uiSchema,
  disabled,
});

const canNestRelationField = (parentField, childField, relationDepth) => {
  if (relationDepth >= 2) {
    return false;
  }

  if (isToManyRelationField(parentField) && isToManyRelationField(childField)) {
    return false;
  }

  return true;
};

const buildFieldOption = (field, getTitle, getTargetFields, relationDepth = 0) => {
  if (!field?.interface) {
    return null;
  }

  if (!isRelationField(field)) {
    return createOption(field, getTitle);
  }

  const targetFields = getTargetFields(field) || [];
  const children = targetFields
    .map((targetField) => {
      if (!isRelationField(targetField)) {
        return buildFieldOption(targetField, getTitle, getTargetFields);
      }

      if (!canNestRelationField(field, targetField, relationDepth)) {
        // return createOption(targetField, getTitle, true);
        return null;
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

export const buildExportFieldOptions = (fields, getTitle, getTargetFields) => {
  return (fields || [])
    .map((field) => buildFieldOption(field, getTitle, getTargetFields, isRelationField(field) ? 1 : 0))
    .filter(Boolean);
};
