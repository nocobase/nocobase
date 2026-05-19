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
const optionMeta = new WeakMap<object, { field: any; relationDepth: number }>();

const isRelationField = (field) => field?.target && RELATION_TYPES.includes(field.type);
const isToManyRelationField = (field) => field?.target && TO_MANY_RELATION_TYPES.includes(field.type);

const createOption = (field, getTitle, disabled = false) => ({
  name: field.name,
  title: getTitle(field),
  schema: field?.uiSchema,
  disabled,
});

const createLazyOption = (field, getTitle, relationDepth = 0) => {
  const relation = isRelationField(field);
  const option = {
    ...createOption(field, getTitle),
    isLeaf: !relation,
  };
  optionMeta.set(option, {
    field,
    relationDepth: relation ? relationDepth : 0,
  });
  return option;
};

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

export const buildExportFieldLazyOptions = (fields, getTitle, options: any = {}) => {
  const { parentField, parentRelationDepth = 0 } = options;

  return (fields || [])
    .map((field) => {
      if (!field?.interface) {
        return null;
      }

      if (parentField && isRelationField(field) && !canNestRelationField(parentField, field, parentRelationDepth)) {
        return null;
      }

      return createLazyOption(field, getTitle, isRelationField(field) ? parentRelationDepth + 1 : 0);
    })
    .filter(Boolean);
};

export const buildExportFieldLazyChildren = (option, getTitle, getTargetFields) => {
  const meta = option && typeof option === 'object' ? optionMeta.get(option) : null;
  const field = meta?.field;
  if (!isRelationField(field)) {
    return [];
  }

  const targetFields = getTargetFields(field) || [];
  return buildExportFieldLazyOptions(targetFields, getTitle, {
    parentField: field,
    parentRelationDepth: meta?.relationDepth || 1,
  });
};

export const createExportFieldLazyOptionsCache = (fields, getTitle, getTargetFields) => {
  const rootOptions = buildExportFieldLazyOptions(fields, getTitle);

  const loadChildren = (option) => {
    if (!option || option.isLeaf) {
      return [];
    }

    if (option.children) {
      return option.children;
    }

    const children = buildExportFieldLazyChildren(option, getTitle, getTargetFields);
    if (children.length) {
      option.children = children;
    } else {
      option.isLeaf = true;
      option.disabled = true;
      option.children = [];
    }
    return option.children;
  };

  const preloadPath = (path) => {
    if (!Array.isArray(path) || path.length <= 1) {
      return false;
    }

    let changed = false;
    let currentOptions = rootOptions;
    for (let index = 0; index < path.length - 1; index++) {
      const segment = path[index]?.name ?? path[index];
      const option = currentOptions.find((item) => item?.name === segment);
      if (!option || option.isLeaf) {
        break;
      }

      const hadChildren = !!option.children;
      currentOptions = loadChildren(option);
      if (!hadChildren) {
        changed = true;
      }
    }
    return changed;
  };

  return {
    getRootOptions: () => rootOptions,
    loadChildren,
    preloadPath,
  };
};
